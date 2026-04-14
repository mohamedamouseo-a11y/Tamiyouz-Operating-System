import { COOKIE_NAME } from "@shared/const";
import { ONE_YEAR_MS } from "@shared/const";
import { sdk } from "./_core/sdk";
import { verifyPassword } from "./_core/password";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  getAllDepartments, getDepartmentById, createDepartment, updateDepartment, deleteDepartment,
  getWorkspacesByDepartment, getAllDepartmentWorkspaces, getWorkspaceById,
  createDepartmentWorkspace, updateDepartmentWorkspace, deleteDepartmentWorkspace,
  getAllEmployees, getEmployeeById, getEmployeesByDepartment, getEmployeeByUserId,
  createEmployee, updateEmployee, deleteEmployee, linkEmployeeToUser,
  getAllClients, getClientById, createClient, updateClient, deleteClient,
  getTasksByEmployee, getTasksByDate, getTasksByDepartment, createTask, updateTask, updateTaskStatus, getTaskStats,
  getDailyReport, getDailyReportsByDate, getDailyReportsByEmployee, createOrUpdateDailyReport, approveDailyReport,
  getTrelloSettings, saveTrelloSettings, updateLastSync,
  logActivity, getActivityByEmployee,
  createAlert, getAlerts, markAlertRead, getUnreadAlertCount,
  saveChatMessage, getChatHistory,
  getAllUsers, updateUserRole, linkUserToEmployee, getUserByEmail,
  createComment, getAllComments, updateCommentStatus, getAllActivityLogs,
  getDb,
} from "./db";
import { getTrelloService, syncEmployeeBoard } from "./trello";
import { generateDailyReport as aiGenerateDailyReport, analyzePerformance, checkDeadlines } from "./ai-agent";
import { invokeLLM } from "./_core/llm";
import type { User } from "../drizzle/schema";
import {
  clients,
  clientServices,
  clientIntegrations,
  clientAssignments,
  clientNotes,
  clientKpis,
  employees,
  departments,
  users,
} from "../drizzle/schema";
import { and, desc, eq, gte, inArray, like, lte, or } from "drizzle-orm";
import { answerHelpQuestion } from "./helpCenterAI";
import { getDeveloperHubStatus, saveDeveloperHubConfig } from "./developerHub";
import {
  addFeedback as addHelpFeedback,
  createArticle as createHelpArticle,
  createChatSession as createHelpChatSession,
  deleteArticle as deleteHelpArticle,
  getAllArticles as getAllHelpArticles,
  getArticleBySlug as getHelpArticleBySlug,
  getArticleFeedback as getHelpArticleFeedback,
  getArticleViewCount as getHelpArticleViewCount,
  getChatHistory as getHelpChatHistory,
  getChatSession as getHelpChatSession,
  getPinnedArticles as getHelpPinnedArticles,
  getRecentUpdates as getHelpRecentUpdates,
  recordView as recordHelpView,
  searchArticles as searchHelpArticles,
  updateArticle as updateHelpArticle,
} from "./helpCenterDb";


// Role hierarchy for permission checks
const ROLE_HIERARCHY: Record<string, number> = {
  super_admin: 7, admin: 6, ceo: 5, cmo: 4, director: 3, team_leader: 2, employee: 1,
};

function getRoleLevel(role: string): number {
  return ROLE_HIERARCHY[role] || 0;
}

// Middleware: requires at least team_leader level
const teamLeaderProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (getRoleLevel(ctx.user.role) < 2) throw new TRPCError({ code: 'FORBIDDEN', message: 'Requires Team Leader or higher.' });
  return next({ ctx });
});

// Middleware: requires at least director level
const managementProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (getRoleLevel(ctx.user.role) < 3) throw new TRPCError({ code: 'FORBIDDEN', message: 'Requires Director or higher.' });
  return next({ ctx });
});

// Middleware: requires super_admin or admin
const superAdminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'super_admin' && ctx.user.role !== 'admin')
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Requires Admin role.' });
  return next({ ctx });
});

// Returns which employee IDs the current user can see
async function getVisibleEmployeeIds(user: User): Promise<number[] | 'all'> {
  if (['super_admin', 'admin', 'ceo', 'cmo'].includes(user.role)) return 'all';
  const employee = await getEmployeeByUserId(user.id);
  if (!employee) return [];
  if (user.role === 'director' || user.role === 'team_leader') {
    const deptEmployees = await getEmployeesByDepartment(employee.departmentId);
    return deptEmployees.map(e => e.id);
  }
  return [employee.id];
}

async function validateEmployeeWorkspaceLink(input: {
  departmentId?: number;
  departmentWorkspaceId?: number | null;
  existingEmployeeId?: number;
}) {
  let effectiveDepartmentId = input.departmentId;
  let effectiveWorkspaceId = input.departmentWorkspaceId;

  if (input.existingEmployeeId !== undefined && (effectiveDepartmentId === undefined || effectiveWorkspaceId === undefined)) {
    const existingEmployee = await getEmployeeById(input.existingEmployeeId);
    if (!existingEmployee) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Employee not found.' });
    }
    if (effectiveDepartmentId === undefined) effectiveDepartmentId = existingEmployee.departmentId;
    if (effectiveWorkspaceId === undefined) effectiveWorkspaceId = existingEmployee.departmentWorkspaceId ?? null;
  }

  if (effectiveWorkspaceId == null) return;

  if (effectiveDepartmentId == null) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Department is required when assigning a department workspace.',
    });
  }

  const workspace = await getWorkspaceById(effectiveWorkspaceId);
  if (!workspace) {
    throw new TRPCError({ code: 'BAD_REQUEST', message: 'Selected workspace does not exist.' });
  }

  if (workspace.departmentId == null || workspace.departmentId !== effectiveDepartmentId) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Selected workspace does not belong to the selected department.',
    });
  }
}

// =============================================
// Client Area RBAC Helpers
// =============================================

async function getCurrentEmployee(userId: number) {
  const db = await getDb();
  const rows = await db
    .select()
    .from(employees)
    .where(eq(employees.userId, userId))
    .limit(1);
  return rows[0] ?? null;
}

async function getVisibleClientIds(user: User): Promise<number[] | null> {
  const roleLevel = getRoleLevel(user.role);
  if (roleLevel >= 4) return null; // CMO+ sees all

  const currentEmployee = await getCurrentEmployee(user.id);
  if (!currentEmployee) return [];

  const db = await getDb();

  if (roleLevel === 1) {
    // employee: only assigned clients
    const rows = await db
      .select({ clientId: clientAssignments.clientId })
      .from(clientAssignments)
      .where(eq(clientAssignments.employeeId, currentEmployee.id));
    return [...new Set(rows.map((r: { clientId: number }) => r.clientId))];
  }

  // team_leader / director: department + own employees' assignments
  const deptEmployees = await getEmployeesByDepartment(currentEmployee.departmentId);
  const empIds = deptEmployees.map(e => e.id);

  const rows = await db
    .select({ clientId: clientAssignments.clientId })
    .from(clientAssignments)
    .where(
      or(
        eq(clientAssignments.departmentId, currentEmployee.departmentId),
        empIds.length ? inArray(clientAssignments.employeeId, empIds) : undefined,
      ),
    );
  return [...new Set(rows.map((r: { clientId: number }) => r.clientId))];
}

async function canAccessClient(user: User, clientId: number) {
  const visibleIds = await getVisibleClientIds(user);
  if (visibleIds === null) return true;
  return visibleIds.includes(clientId);
}

async function assertClientVisible(user: User, clientId: number) {
  const allowed = await canAccessClient(user, clientId);
  if (!allowed) {
    throw new TRPCError({ code: "FORBIDDEN", message: "You do not have access to this client." });
  }
}

async function assertTeamLeaderScope(
  user: User,
  input: { employeeId?: number | null; departmentId?: number | null },
) {
  const roleLevel = getRoleLevel(user.role);
  if (roleLevel >= 4) return;

  const currentEmployee = await getCurrentEmployee(user.id);
  if (!currentEmployee) {
    throw new TRPCError({ code: "FORBIDDEN", message: "No linked employee profile found." });
  }

  if (input.departmentId && input.departmentId !== currentEmployee.departmentId) {
    throw new TRPCError({ code: "FORBIDDEN", message: "You can only manage your own department." });
  }

  if (input.employeeId) {
    const db = await getDb();
    const rows = await db
      .select()
      .from(employees)
      .where(eq(employees.id, input.employeeId))
      .limit(1);
    const employee = rows[0];
    if (!employee || employee.departmentId !== currentEmployee.departmentId) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Target employee must belong to your department." });
    }
  }
}

// =============================================

const helpArticleSchema = z.object({
  title: z.string().min(1).max(255),
  titleAr: z.string().max(255).optional(),
  slug: z.string().min(1).max(255),
  content: z.string().min(1),
  contentAr: z.string().optional(),
  category: z.string().min(1),
  tags: z.array(z.string()).optional(),
  isPublished: z.boolean().optional(),
  isPinned: z.boolean().optional(),
  version: z.string().max(20).optional(),
});

async function enrichHelpArticle(article: Awaited<ReturnType<typeof getAllHelpArticles>>[number]) {
  const [viewCount, feedback] = await Promise.all([
    getHelpArticleViewCount(article.id),
    getHelpArticleFeedback(article.id),
  ]);
  const totalVotes = feedback.helpful + feedback.notHelpful;
  return {
    ...article,
    viewCount,
    helpful: feedback.helpful,
    notHelpful: feedback.notHelpful,
    helpfulPercentage: totalVotes > 0 ? Math.round((feedback.helpful / totalVotes) * 100) : 0,
  };
}

// =============================================
// Client Area Input Schemas
// =============================================

const clientListInputSchema = z
  .object({
    search: z.string().trim().optional(),
    industry: z.string().trim().optional(),
    status: z.enum(["active", "inactive"]).optional(),
  })
  .optional();

const clientBaseSchema = z.object({
  name: z.string().trim().min(1).max(191),
  nameAr: z.string().trim().max(191).optional().nullable(),
  contactEmail: z.string().trim().email().optional().nullable(),
  contactPhone: z.string().trim().max(50).optional().nullable(),
  industry: z.string().trim().min(1).max(120),
  isActive: z.boolean().default(true),
  services: z.array(z.string().trim().min(1).max(100)).default([]),
});

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
    login: publicProcedure
      .input(z.object({ email: z.string().email(), password: z.string().min(1) }))
      .mutation(async ({ ctx, input }) => {
        const user = await getUserByEmail(input.email);
        if (!user || !user.password) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid email or password" });
        }
        const valid = verifyPassword(input.password, user.password);
        if (!valid) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid email or password" });
        }
        const sessionToken = await sdk.createSessionToken(user.openId, {
          name: user.name || "",
          expiresInMs: ONE_YEAR_MS,
        });
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
        return { success: true } as const;
      }),
  }),

  // ---- Departments ----
  departments: router({
    list: protectedProcedure.query(() => getAllDepartments()),
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(({ input }) => getDepartmentById(input.id)),
    create: superAdminProcedure
      .input(z.object({ name: z.string().min(1), nameAr: z.string().optional(), description: z.string().optional() }))
      .mutation(({ input }) => createDepartment(input)),
    update: superAdminProcedure
      .input(z.object({ id: z.number(), name: z.string().min(1).optional(), nameAr: z.string().optional(), description: z.string().optional() }))
      .mutation(({ input }) => updateDepartment(input.id, input)),
    delete: superAdminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => deleteDepartment(input.id)),
  }),

  // ---- Employees ----
  employees: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const all = await getAllEmployees();
      const visible = await getVisibleEmployeeIds(ctx.user);
      if (visible === 'all') return all;
      return all.filter(emp => visible.includes(emp.id));
    }),
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const emp = await getEmployeeById(input.id);
        if (!emp) throw new TRPCError({ code: 'NOT_FOUND', message: 'Employee not found.' });
        const visible = await getVisibleEmployeeIds(ctx.user);
        if (visible !== 'all' && !visible.includes(emp.id)) throw new TRPCError({ code: 'FORBIDDEN' });
        return emp;
      }),
    getMe: protectedProcedure.query(async ({ ctx }) => {
      return getEmployeeByUserId(ctx.user.id);
    }),
    create: superAdminProcedure
      .input(z.object({
        name: z.string().min(1), nameAr: z.string().optional(), email: z.string().email().optional(),
        phone: z.string().optional(), departmentId: z.number(), position: z.string().optional(),
        departmentWorkspaceId: z.number().nullable().optional(),
        trelloBoardId: z.string().optional(), trelloBoardUrl: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        await validateEmployeeWorkspaceLink({
          departmentId: input.departmentId,
          departmentWorkspaceId: input.departmentWorkspaceId ?? null,
        });
        const linkedUser = input.email ? await getUserByEmail(input.email) : undefined;
        return createEmployee({
          ...input,
          departmentWorkspaceId: input.departmentWorkspaceId ?? null,
          userId: linkedUser?.id ?? null,
        });
      }),
    update: superAdminProcedure
      .input(z.object({
        id: z.number(), name: z.string().min(1).optional(), nameAr: z.string().optional(),
        email: z.string().email().optional(), phone: z.string().optional(),
        departmentId: z.number().optional(), position: z.string().optional(),
        departmentWorkspaceId: z.number().nullable().optional(),
        trelloBoardId: z.string().optional(), trelloBoardUrl: z.string().optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        await validateEmployeeWorkspaceLink({
          existingEmployeeId: input.id,
          departmentId: input.departmentId,
          departmentWorkspaceId: input.departmentWorkspaceId,
        });
        const linkedUser = input.email ? await getUserByEmail(input.email) : undefined;
        const payload: Record<string, unknown> = { ...input };
        if (input.departmentWorkspaceId !== undefined) payload.departmentWorkspaceId = input.departmentWorkspaceId ?? null;
        if (linkedUser?.id) payload.userId = linkedUser.id;
        return updateEmployee(input.id, payload);
      }),
    delete: superAdminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const target = await getEmployeeById(input.id);
        if (!target) throw new TRPCError({ code: 'NOT_FOUND', message: 'Employee not found.' });
        const current = await getEmployeeByUserId(ctx.user.id);
        if (current?.id === target.id) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'You cannot delete your own linked employee profile.' });
        }
        return deleteEmployee(input.id);
      }),
    linkToUser: superAdminProcedure
      .input(z.object({ employeeId: z.number(), userId: z.number() }))
      .mutation(({ input }) => linkEmployeeToUser(input.employeeId, input.userId)),
  }),

  // ---- Department Workspaces ----
  departmentWorkspaces: router({
    listAll: superAdminProcedure.query(() => getAllDepartmentWorkspaces()),
    listByDepartment: superAdminProcedure
      .input(z.object({ departmentId: z.number() }))
      .query(({ input }) => getWorkspacesByDepartment(input.departmentId)),
    create: superAdminProcedure
      .input(
        z.object({
          departmentId: z.number().nullable().optional(),
          name: z.string().trim().min(1),
          trelloWorkspaceId: z.string().trim().optional(),
          apiKey: z.string().trim().min(1),
          apiToken: z.string().trim().min(1),
          isActive: z.boolean().optional(),
        }),
      )
      .mutation(({ input }) =>
        createDepartmentWorkspace({
          departmentId: input.departmentId ?? null,
          name: input.name,
          trelloWorkspaceId: input.trelloWorkspaceId || null,
          apiKey: input.apiKey,
          apiToken: input.apiToken,
          isActive: input.isActive ?? true,
        }),
      ),
    update: superAdminProcedure
      .input(
        z.object({
          id: z.number(),
          data: z.object({
            departmentId: z.number().nullable().optional(),
            name: z.string().trim().min(1).optional(),
            trelloWorkspaceId: z.string().trim().optional(),
            apiKey: z.string().trim().optional(),
            apiToken: z.string().trim().optional(),
            isActive: z.boolean().optional(),
          }),
        }),
      )
      .mutation(({ input }) =>
        updateDepartmentWorkspace(input.id, {
          ...input.data,
          departmentId: input.data.departmentId === undefined ? undefined : input.data.departmentId ?? null,
          trelloWorkspaceId:
            input.data.trelloWorkspaceId === undefined ? undefined : input.data.trelloWorkspaceId || null,
        }),
      ),
    delete: superAdminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => deleteDepartmentWorkspace(input.id)),
    testConnection: superAdminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const workspace = await getWorkspaceById(input.id);
        if (!workspace) throw new TRPCError({ code: 'NOT_FOUND', message: 'Workspace not found.' });
        const svc = await getTrelloService(workspace.apiKey, workspace.apiToken);
        return svc.testConnection();
      }),
    getOrganizations: superAdminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const workspace = await getWorkspaceById(input.id);
        if (!workspace) throw new TRPCError({ code: 'NOT_FOUND', message: 'Workspace not found.' });
        const svc = await getTrelloService(workspace.apiKey, workspace.apiToken);
        return svc.getOrganizations();
      }),
    autoLinkWorkspaceId: superAdminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const workspace = await getWorkspaceById(input.id);
        if (!workspace) throw new TRPCError({ code: 'NOT_FOUND', message: 'Workspace not found.' });
        const svc = await getTrelloService(workspace.apiKey, workspace.apiToken);
        const orgs = await svc.getOrganizations();
        const match = orgs.find((o: { displayName: string }) => o.displayName === workspace.name);
        if (!match) throw new TRPCError({ code: 'NOT_FOUND', message: `No matching Trello organization found for: ${workspace.name}` });
        await updateDepartmentWorkspace(input.id, { trelloWorkspaceId: match.id });
        return { organizationId: match.id, organizationName: match.displayName };
      }),
    getBoards: superAdminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const workspace = await getWorkspaceById(input.id);
        if (!workspace) throw new TRPCError({ code: 'NOT_FOUND', message: 'Workspace not found.' });
        const svc = await getTrelloService(workspace.apiKey, workspace.apiToken);
        return svc.getBoards(workspace.trelloWorkspaceId || undefined);
      }),
  }),

  // ---- Clients (UPDATED with RBAC + search/filter + services) ----
  clients: router({
    list: protectedProcedure.input(clientListInputSchema).query(async ({ ctx, input }) => {
      const db = await getDb();
      const visibleClientIds = await getVisibleClientIds(ctx.user);
      if (visibleClientIds && visibleClientIds.length === 0) return [];

      const whereParts: any[] = [];
      if (visibleClientIds !== null) whereParts.push(inArray(clients.id, visibleClientIds));
      if (input?.search) {
        whereParts.push(
          or(
            like(clients.name, `%${input.search}%`),
            like(clients.nameAr, `%${input.search}%`),
            like(clients.contactEmail, `%${input.search}%`),
          ),
        );
      }
      if (input?.industry) whereParts.push(eq(clients.industry, input.industry));
      if (input?.status) whereParts.push(eq(clients.isActive, input.status === "active"));

      const rows = await db
        .select({
          id: clients.id,
          name: clients.name,
          nameAr: clients.nameAr,
          contactEmail: clients.contactEmail,
          contactPhone: clients.contactPhone,
          industry: clients.industry,
          isActive: clients.isActive,
          service: clientServices.service,
        })
        .from(clients)
        .leftJoin(clientServices, eq(clientServices.clientId, clients.id))
        .where(whereParts.length ? and(...whereParts) : undefined)
        .orderBy(desc(clients.id));

      const byClient = new Map<number, any>();
      for (const row of rows) {
        if (!byClient.has(row.id)) {
          byClient.set(row.id, {
            id: row.id,
            name: row.name,
            nameAr: row.nameAr,
            contactEmail: row.contactEmail,
            contactPhone: row.contactPhone,
            industry: row.industry,
            isActive: row.isActive,
            services: [],
          });
        }
        if (row.service) byClient.get(row.id).services.push(row.service);
      }

      return Array.from(byClient.values());
    }),

    getById: protectedProcedure
      .input(z.object({ id: z.coerce.number().int().positive() }))
      .query(async ({ ctx, input }) => {
        await assertClientVisible(ctx.user, input.id);
        const db = await getDb();

        const base = await db.select().from(clients).where(eq(clients.id, input.id)).limit(1);
        if (!base[0]) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Client not found." });
        }

        const services = await db
          .select({ service: clientServices.service })
          .from(clientServices)
          .where(eq(clientServices.clientId, input.id));

        return {
          ...base[0],
          services: services.map((item: { service: string }) => item.service),
        };
      }),

    create: teamLeaderProcedure.input(clientBaseSchema).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      const result = await db.insert(clients).values({
        name: input.name,
        nameAr: input.nameAr ?? null,
        contactEmail: input.contactEmail ?? null,
        contactPhone: input.contactPhone ?? null,
        industry: input.industry,
        isActive: input.isActive,
      });

      const clientId = Number((result as any)[0].insertId);

      if (input.services.length) {
        await db.insert(clientServices).values(
          input.services.map((service) => ({
            clientId,
            service,
          })),
        );
      }

      const created = await db.select().from(clients).where(eq(clients.id, clientId)).limit(1);
      return created[0];
    }),

    update: teamLeaderProcedure
      .input(clientBaseSchema.extend({ id: z.coerce.number().int().positive() }))
      .mutation(async ({ ctx, input }) => {
        await assertClientVisible(ctx.user, input.id);
        const db = await getDb();

        await db
          .update(clients)
          .set({
            name: input.name,
            nameAr: input.nameAr ?? null,
            contactEmail: input.contactEmail ?? null,
            contactPhone: input.contactPhone ?? null,
            industry: input.industry,
            isActive: input.isActive,
          })
          .where(eq(clients.id, input.id));

        await db.delete(clientServices).where(eq(clientServices.clientId, input.id));
        if (input.services.length) {
          await db.insert(clientServices).values(
            input.services.map((service) => ({
              clientId: input.id,
              service,
            })),
          );
        }

        const updated = await db.select().from(clients).where(eq(clients.id, input.id)).limit(1);
        return updated[0];
      }),

    delete: superAdminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => deleteClient(input.id)),
  }),

  // ---- Client Integrations (NEW) ----
  clientIntegrations: router({
    list: protectedProcedure
      .input(z.object({ clientId: z.coerce.number().int().positive(), service: z.string().trim().optional() }))
      .query(async ({ ctx, input }) => {
        await assertClientVisible(ctx.user, input.clientId);
        const db = await getDb();
        const whereParts = [eq(clientIntegrations.clientId, input.clientId)];
        if (input.service) whereParts.push(eq(clientIntegrations.service, input.service));
        return db.select().from(clientIntegrations).where(and(...whereParts)).orderBy(desc(clientIntegrations.updatedAt));
      }),

    upsert: protectedProcedure
      .input(
        z.object({
          id: z.coerce.number().int().positive().optional(),
          clientId: z.coerce.number().int().positive(),
          service: z.string().trim().min(1).max(100),
          integrationType: z.string().trim().min(1).max(100),
          displayName: z.string().trim().min(1).max(191),
          externalId: z.string().trim().max(191).optional().nullable(),
          status: z.string().trim().min(1).max(50).default("active"),
          metadata: z.record(z.any()).optional().nullable(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        await assertClientVisible(ctx.user, input.clientId);
        const db = await getDb();

        const payload = {
          clientId: input.clientId,
          service: input.service,
          integrationType: input.integrationType,
          displayName: input.displayName,
          externalId: input.externalId ?? null,
          status: input.status,
          metadata: input.metadata ?? null,
        };

        if (input.id) {
          await db.update(clientIntegrations).set(payload).where(eq(clientIntegrations.id, input.id));
          const updated = await db.select().from(clientIntegrations).where(eq(clientIntegrations.id, input.id)).limit(1);
          return updated[0];
        }

        const result = await db.insert(clientIntegrations).values(payload);
        const id = Number((result as any)[0].insertId);
        const created = await db.select().from(clientIntegrations).where(eq(clientIntegrations.id, id)).limit(1);
        return created[0];
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.coerce.number().int().positive() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        const rows = await db.select().from(clientIntegrations).where(eq(clientIntegrations.id, input.id)).limit(1);
        const integration = rows[0];
        if (!integration) throw new TRPCError({ code: "NOT_FOUND", message: "Integration not found." });
        await assertClientVisible(ctx.user, integration.clientId);
        await db.delete(clientIntegrations).where(eq(clientIntegrations.id, input.id));
        return { success: true };
      }),
  }),

  // ---- Client Assignments (NEW) ----
  clientAssignments: router({
    list: protectedProcedure
      .input(z.object({ clientId: z.coerce.number().int().positive() }))
      .query(async ({ ctx, input }) => {
        await assertClientVisible(ctx.user, input.clientId);
        const db = await getDb();
        return db
          .select({
            id: clientAssignments.id,
            clientId: clientAssignments.clientId,
            employeeId: clientAssignments.employeeId,
            departmentId: clientAssignments.departmentId,
            employeeName: employees.name,
            departmentName: departments.name,
          })
          .from(clientAssignments)
          .leftJoin(employees, eq(employees.id, clientAssignments.employeeId))
          .leftJoin(departments, eq(departments.id, clientAssignments.departmentId))
          .where(eq(clientAssignments.clientId, input.clientId))
          .orderBy(clientAssignments.id);
      }),
    listByEmployee: protectedProcedure
      .input(z.object({ employeeId: z.coerce.number().int().positive() }))
      .query(async ({ ctx, input }) => {
        const visible = await getVisibleEmployeeIds(ctx.user);
        if (visible !== 'all' && !visible.includes(input.employeeId)) throw new TRPCError({ code: 'FORBIDDEN' });
        const db = await getDb();
        return db
          .select({
            id: clientAssignments.id,
            clientId: clientAssignments.clientId,
            employeeId: clientAssignments.employeeId,
            departmentId: clientAssignments.departmentId,
            clientName: clients.name,
            clientIndustry: clients.industry,
            clientIsActive: clients.isActive,
            employeeName: employees.name,
            departmentName: departments.name,
          })
          .from(clientAssignments)
          .leftJoin(clients, eq(clients.id, clientAssignments.clientId))
          .leftJoin(employees, eq(employees.id, clientAssignments.employeeId))
          .leftJoin(departments, eq(departments.id, clientAssignments.departmentId))
          .where(eq(clientAssignments.employeeId, input.employeeId))
          .orderBy(clients.name, clientAssignments.id);
      }),

    assign: teamLeaderProcedure
      .input(
        z
          .object({
            clientId: z.coerce.number().int().positive(),
            employeeId: z.coerce.number().int().positive().optional(),
            departmentId: z.coerce.number().int().positive().optional(),
          })
          .refine((val) => !!val.employeeId || !!val.departmentId, {
            message: "employeeId or departmentId is required",
          }),
      )
      .mutation(async ({ ctx, input }) => {
        await assertClientVisible(ctx.user, input.clientId);
        await assertTeamLeaderScope(ctx.user, input);
        const db = await getDb();

        const duplicate = await db
          .select()
          .from(clientAssignments)
          .where(
            and(
              eq(clientAssignments.clientId, input.clientId),
              input.employeeId
                ? eq(clientAssignments.employeeId, input.employeeId)
                : eq(clientAssignments.departmentId, input.departmentId!),
            ),
          )
          .limit(1);

        if (duplicate[0]) return duplicate[0];

        const result = await db.insert(clientAssignments).values({
          clientId: input.clientId,
          employeeId: input.employeeId ?? null,
          departmentId: input.departmentId ?? null,
        });

        const id = Number((result as any)[0].insertId);
        const created = await db.select().from(clientAssignments).where(eq(clientAssignments.id, id)).limit(1);
        return created[0];
      }),

    unassign: teamLeaderProcedure
      .input(z.object({ id: z.coerce.number().int().positive() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        const rows = await db.select().from(clientAssignments).where(eq(clientAssignments.id, input.id)).limit(1);
        const assignment = rows[0];
        if (!assignment) throw new TRPCError({ code: "NOT_FOUND", message: "Assignment not found." });
        await assertClientVisible(ctx.user, assignment.clientId);
        await db.delete(clientAssignments).where(eq(clientAssignments.id, input.id));
        return { success: true };
      }),
  }),

  // ---- Client Notes (NEW) ----
  clientNotes: router({
    list: protectedProcedure
      .input(z.object({ clientId: z.coerce.number().int().positive() }))
      .query(async ({ ctx, input }) => {
        await assertClientVisible(ctx.user, input.clientId);
        const db = await getDb();
        return db
          .select({
            id: clientNotes.id,
            clientId: clientNotes.clientId,
            authorId: clientNotes.authorId,
            content: clientNotes.content,
            createdAt: clientNotes.createdAt,
            authorName: users.name,
          })
          .from(clientNotes)
          .leftJoin(users, eq(users.id, clientNotes.authorId))
          .where(eq(clientNotes.clientId, input.clientId))
          .orderBy(desc(clientNotes.createdAt));
      }),

    create: protectedProcedure
      .input(z.object({ clientId: z.coerce.number().int().positive(), content: z.string().trim().min(1).max(5000) }))
      .mutation(async ({ ctx, input }) => {
        await assertClientVisible(ctx.user, input.clientId);
        const db = await getDb();
        const result = await db.insert(clientNotes).values({
          clientId: input.clientId,
          authorId: ctx.user.id,
          content: input.content,
        });
        const id = Number((result as any)[0].insertId);
        const created = await db.select().from(clientNotes).where(eq(clientNotes.id, id)).limit(1);
        return created[0];
      }),

    update: protectedProcedure
      .input(z.object({ id: z.coerce.number().int().positive(), content: z.string().trim().min(1).max(5000) }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        const rows = await db.select().from(clientNotes).where(eq(clientNotes.id, input.id)).limit(1);
        const note = rows[0];
        if (!note) throw new TRPCError({ code: "NOT_FOUND", message: "Note not found." });
        await assertClientVisible(ctx.user, note.clientId);
        const canEdit = note.authorId === ctx.user.id || getRoleLevel(ctx.user.role) >= 2;
        if (!canEdit) throw new TRPCError({ code: "FORBIDDEN", message: "Not allowed." });
        await db.update(clientNotes).set({ content: input.content }).where(eq(clientNotes.id, input.id));
        const updated = await db.select().from(clientNotes).where(eq(clientNotes.id, input.id)).limit(1);
        return updated[0];
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.coerce.number().int().positive() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        const rows = await db.select().from(clientNotes).where(eq(clientNotes.id, input.id)).limit(1);
        const note = rows[0];
        if (!note) throw new TRPCError({ code: "NOT_FOUND", message: "Note not found." });
        await assertClientVisible(ctx.user, note.clientId);
        const canDelete = note.authorId === ctx.user.id || getRoleLevel(ctx.user.role) >= 2;
        if (!canDelete) throw new TRPCError({ code: "FORBIDDEN", message: "Not allowed." });
        await db.delete(clientNotes).where(eq(clientNotes.id, input.id));
        return { success: true };
      }),
  }),

  // ---- Client KPIs (NEW) ----
  clientKpis: router({
    list: protectedProcedure
      .input(
        z.object({
          clientId: z.coerce.number().int().positive(),
          metricName: z.string().trim().optional(),
          from: z.string().optional(),
          to: z.string().optional(),
        }),
      )
      .query(async ({ ctx, input }) => {
        await assertClientVisible(ctx.user, input.clientId);
        const db = await getDb();
        const whereParts = [eq(clientKpis.clientId, input.clientId)];
        if (input.metricName) whereParts.push(eq(clientKpis.metricName, input.metricName));
        if (input.from) whereParts.push(gte(clientKpis.date, input.from));
        if (input.to) whereParts.push(lte(clientKpis.date, input.to));
        return db
          .select({
            id: clientKpis.id,
            clientId: clientKpis.clientId,
            metricName: clientKpis.metricName,
            metricValue: clientKpis.metricValue,
            date: clientKpis.date,
            recordedById: clientKpis.recordedById,
            recordedByName: users.name,
          })
          .from(clientKpis)
          .leftJoin(users, eq(users.id, clientKpis.recordedById))
          .where(and(...whereParts))
          .orderBy(desc(clientKpis.date), desc(clientKpis.id));
      }),

    create: protectedProcedure
      .input(
        z.object({
          clientId: z.coerce.number().int().positive(),
          metricName: z.string().trim().min(1).max(120),
          metricValue: z.coerce.number(),
          date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        await assertClientVisible(ctx.user, input.clientId);
        const db = await getDb();
        const result = await db.insert(clientKpis).values({
          clientId: input.clientId,
          metricName: input.metricName,
          metricValue: input.metricValue,
          date: input.date,
          recordedById: ctx.user.id,
        });
        const id = Number((result as any)[0].insertId);
        const created = await db.select().from(clientKpis).where(eq(clientKpis.id, id)).limit(1);
        return created[0];
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.coerce.number().int().positive(),
          metricName: z.string().trim().min(1).max(120),
          metricValue: z.coerce.number(),
          date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        const rows = await db.select().from(clientKpis).where(eq(clientKpis.id, input.id)).limit(1);
        const kpi = rows[0];
        if (!kpi) throw new TRPCError({ code: "NOT_FOUND", message: "KPI not found." });
        await assertClientVisible(ctx.user, kpi.clientId);
        await db
          .update(clientKpis)
          .set({
            metricName: input.metricName,
            metricValue: input.metricValue,
            date: input.date,
          })
          .where(eq(clientKpis.id, input.id));
        const updated = await db.select().from(clientKpis).where(eq(clientKpis.id, input.id)).limit(1);
        return updated[0];
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.coerce.number().int().positive() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        const rows = await db.select().from(clientKpis).where(eq(clientKpis.id, input.id)).limit(1);
        const kpi = rows[0];
        if (!kpi) throw new TRPCError({ code: "NOT_FOUND", message: "KPI not found." });
        await assertClientVisible(ctx.user, kpi.clientId);
        await db.delete(clientKpis).where(eq(clientKpis.id, input.id));
        return { success: true };
      }),
  }),

  // ---- Tasks ----
  tasks: router({
    listByEmployee: protectedProcedure
      .input(z.object({ employeeId: z.number(), date: z.string().optional() }))
      .query(async ({ ctx, input }) => {
        const visible = await getVisibleEmployeeIds(ctx.user);
        if (visible !== 'all' && !visible.includes(input.employeeId)) throw new TRPCError({ code: 'FORBIDDEN' });
        return getTasksByEmployee(input.employeeId, input.date);
      }),
    listByDate: teamLeaderProcedure
      .input(z.object({ date: z.string() }))
      .query(async ({ ctx, input }) => {
        const all = await getTasksByDate(input.date);
        const visible = await getVisibleEmployeeIds(ctx.user);
        if (visible === 'all') return all;
        return all.filter(t => visible.includes(t.employeeId));
      }),
    create: teamLeaderProcedure
      .input(z.object({
        employeeId: z.number(), clientId: z.number().optional(), title: z.string().min(1),
        description: z.string().optional(), status: z.enum(['todo', 'in_progress', 'review', 'done']).optional(),
        date: z.string(), estimatedHours: z.string().optional(),
        trelloCardId: z.string().optional(), trelloCardUrl: z.string().optional(),
      }))
      .mutation(({ input }) => createTask(input)),
    updateStatus: protectedProcedure
      .input(z.object({ id: z.number(), status: z.enum(['todo', 'in_progress', 'review', 'done']), actualHours: z.number().optional() }))
      .mutation(({ input }) => updateTaskStatus(input.id, input.status, input.actualHours)),
    stats: protectedProcedure
      .input(z.object({
        employeeId: z.number().optional(), departmentId: z.number().optional(),
        startDate: z.string().optional(), endDate: z.string().optional(),
      }))
      .query(async ({ ctx, input }) => {
        const visible = await getVisibleEmployeeIds(ctx.user);
        let ids: number[] | undefined;
        if (input.employeeId) {
          if (visible !== 'all' && !visible.includes(input.employeeId)) throw new TRPCError({ code: 'FORBIDDEN' });
          ids = [input.employeeId];
        } else if (input.departmentId) {
          const deptEmps = await getEmployeesByDepartment(input.departmentId);
          const deptIds = deptEmps.map(e => e.id);
          ids = visible === 'all' ? deptIds : deptIds.filter(id => (visible as number[]).includes(id));
        } else if (visible !== 'all') {
          ids = visible;
        }
        return getTaskStats(ids, input.startDate, input.endDate);
      }),
  }),

  // ---- Reports ----
  reports: router({
    daily: protectedProcedure
      .input(z.object({ employeeId: z.number(), date: z.string() }))
      .query(async ({ ctx, input }) => {
        const visible = await getVisibleEmployeeIds(ctx.user);
        if (visible !== 'all' && !visible.includes(input.employeeId)) throw new TRPCError({ code: 'FORBIDDEN' });
        return getDailyReport(input.employeeId, input.date);
      }),
    dailyAll: teamLeaderProcedure
      .input(z.object({ date: z.string() }))
      .query(async ({ ctx, input }) => {
        const all = await getDailyReportsByDate(input.date);
        const visible = await getVisibleEmployeeIds(ctx.user);
        if (visible === 'all') return all;
        return all.filter(r => visible.includes(r.employeeId));
      }),
    byEmployee: protectedProcedure
      .input(z.object({ employeeId: z.number(), startDate: z.string().optional(), endDate: z.string().optional() }))
      .query(async ({ ctx, input }) => {
        const visible = await getVisibleEmployeeIds(ctx.user);
        if (visible !== 'all' && !visible.includes(input.employeeId)) throw new TRPCError({ code: 'FORBIDDEN' });
        return getDailyReportsByEmployee(input.employeeId, input.startDate, input.endDate);
      }),
    approve: managementProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ ctx, input }) => approveDailyReport(input.id, ctx.user.id)),
    generate: managementProcedure
      .input(z.object({ employeeId: z.number(), date: z.string() }))
      .mutation(({ input }) => aiGenerateDailyReport(input.employeeId, input.date)),
    generateAll: managementProcedure
      .input(z.object({ date: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const all = await getAllEmployees();
        const visible = await getVisibleEmployeeIds(ctx.user);
        const targets = visible === 'all' ? all : all.filter(e => (visible as number[]).includes(e.id));
        const results = await Promise.allSettled(targets.map(e => aiGenerateDailyReport(e.id, input.date)));
        return { success: true, generated: results.filter(r => r.status === 'fulfilled').length, failed: results.filter(r => r.status === 'rejected').length };
      }),
  }),

  // ---- Trello Settings ----
  trelloSettings: router({
    get: superAdminProcedure.query(() => getTrelloSettings()),
    save: superAdminProcedure
      .input(z.object({ apiKey: z.string().min(1), apiToken: z.string().min(1) }))
      .mutation(({ input }) => saveTrelloSettings(input)),
    testConnection: superAdminProcedure.mutation(async () => {
      const svc = await getTrelloService();
      return svc.testConnection();
    }),
    syncNow: superAdminProcedure.mutation(async () => {
      const emps = await getAllEmployees();
      const results = await Promise.allSettled(
        emps.filter(e => e.trelloBoardId).map(e => syncEmployeeBoard(e.id))
      );
      await updateLastSync();
      return { success: true, synced: results.filter(r => r.status === 'fulfilled').length };
    }),
  }),

  // ---- Trello Board Operations ----
  trello: router({
    getBoards: superAdminProcedure.query(async () => {
      const svc = await getTrelloService();
      return svc.getBoards();
    }),
    getBoardLists: superAdminProcedure
      .input(z.object({ boardId: z.string().min(1) }))
      .query(async ({ input }) => {
        const svc = await getTrelloService();
        return svc.getBoardLists(input.boardId);
      }),
    syncEmployee: teamLeaderProcedure
      .input(z.object({ employeeId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const visible = await getVisibleEmployeeIds(ctx.user);
        if (visible !== 'all' && !visible.includes(input.employeeId)) throw new TRPCError({ code: 'FORBIDDEN' });
        return syncEmployeeBoard(input.employeeId);
      }),
  }),

  // ---- Alerts ----
  alerts: router({
    list: protectedProcedure
      .input(z.object({ type: z.string().optional(), isRead: z.boolean().optional() }).optional())
      .query(async ({ ctx, input }) => {
        const allAlerts = await getAlerts({ targetRole: ctx.user.role, ...input });
        const visible = await getVisibleEmployeeIds(ctx.user);
        if (visible === 'all') return allAlerts;
        return allAlerts.filter(a => !a.employeeId || (visible as number[]).includes(a.employeeId));
      }),
    markRead: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => markAlertRead(input.id)),
    unreadCount: protectedProcedure.query(({ ctx }) => getUnreadAlertCount(ctx.user.role)),
  }),

  // ---- Analytics ----
  analytics: router({
    overview: teamLeaderProcedure.query(async ({ ctx }) => {
      const visible = await getVisibleEmployeeIds(ctx.user);
      const allEmps = await getAllEmployees();
      const emps = visible === 'all' ? allEmps : allEmps.filter(e => (visible as number[]).includes(e.id));
      const today = new Date().toISOString().split('T')[0];
      const stats = await getTaskStats(visible === 'all' ? undefined : visible as number[], today, today);
      const reports = await getDailyReportsByDate(today);
      return {
        totalEmployees: emps.length,
        tasksToday: stats.totalTasks,
        hoursToday: stats.totalActualHours,
        reportsToday: reports.length,
        tasksByStatus: stats.tasksByStatus,
      };
    }),
    employeeStats: protectedProcedure
      .input(z.object({ employeeId: z.number(), startDate: z.string().optional(), endDate: z.string().optional() }))
      .query(async ({ ctx, input }) => {
        const visible = await getVisibleEmployeeIds(ctx.user);
        if (visible !== 'all' && !visible.includes(input.employeeId)) throw new TRPCError({ code: 'FORBIDDEN' });
        return getTaskStats([input.employeeId], input.startDate, input.endDate);
      }),
    employeePerformance: protectedProcedure
      .input(z.object({ employeeId: z.number(), startDate: z.string().optional(), endDate: z.string().optional() }))
      .query(async ({ ctx, input }) => {
        const visible = await getVisibleEmployeeIds(ctx.user);
        if (visible !== 'all' && !visible.includes(input.employeeId)) throw new TRPCError({ code: 'FORBIDDEN' });
        const stats = await getTaskStats([input.employeeId], input.startDate, input.endDate);
        const reports = await getDailyReportsByEmployee(input.employeeId, input.startDate, input.endDate);
        const db = await getDb();
        const assignments = await db
          .select({
            clientId: clientAssignments.clientId,
            clientName: clients.name,
          })
          .from(clientAssignments)
          .leftJoin(clients, eq(clients.id, clientAssignments.clientId))
          .where(eq(clientAssignments.employeeId, input.employeeId));

        const approvedReports = reports.filter((report: any) => report.status === 'approved').length;
        const generatedReports = reports.filter((report: any) => report.status === 'generated').length;
        const avgReportHours = reports.length
          ? reports.reduce((sum: number, report: any) => sum + (Number(report.totalHours) || 0), 0) / reports.length
          : 0;
        const totalTasks = stats.totalTasks || 0;
        const doneTasks = Number(stats.tasksByStatus?.done || 0);
        const activeDays = new Set(reports.map((report: any) => report.date)).size;

        return {
          ...stats,
          reportCount: reports.length,
          approvedReports,
          generatedReports,
          approvalRate: reports.length ? Math.round((approvedReports / reports.length) * 100) : 0,
          avgReportHours,
          clientCount: new Set(assignments.map((item: any) => item.clientId)).size,
          activeDays,
          lastReportDate: reports[0]?.date ?? null,
          lastReportStatus: reports[0]?.status ?? null,
          completionRate: totalTasks ? Math.round((doneTasks / totalTasks) * 100) : 0,
          backlogTasks: totalTasks - doneTasks,
          tasksByStatus: stats.tasksByStatus,
        };
      }),
    departmentStats: managementProcedure
      .input(z.object({ departmentId: z.number().optional(), startDate: z.string().optional(), endDate: z.string().optional() }))
      .query(async ({ ctx, input }) => {
        const visible = await getVisibleEmployeeIds(ctx.user);
        let ids: number[] | undefined;
        if (input.departmentId) {
          const deptEmps = await getEmployeesByDepartment(input.departmentId);
          const deptIds = deptEmps.map(e => e.id);
          ids = visible === 'all' ? deptIds : deptIds.filter(id => (visible as number[]).includes(id));
        } else if (visible !== 'all') {
          ids = visible as number[];
        }
        return getTaskStats(ids, input.startDate, input.endDate);
      }),
    aiAnalysis: managementProcedure
      .input(z.object({
        type: z.enum(['employee', 'department', 'company']),
        targetId: z.number().optional(),
        startDate: z.string().optional(), endDate: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const visible = await getVisibleEmployeeIds(ctx.user);
        let ids: number[] | undefined;
        if (input.type === 'employee' && input.targetId) {
          if (visible !== 'all' && !visible.includes(input.targetId)) throw new TRPCError({ code: 'FORBIDDEN' });
          ids = [input.targetId];
        } else if (input.type === 'department' && input.targetId) {
          const deptEmps = await getEmployeesByDepartment(input.targetId);
          const deptIds = deptEmps.map(e => e.id);
          ids = visible === 'all' ? deptIds : deptIds.filter(id => (visible as number[]).includes(id));
        } else if (visible !== 'all') {
          ids = visible as number[];
        }
        return analyzePerformance(input.type, input.targetId, ids, input.startDate, input.endDate);
      }),
  }),

  // ---- AI Chat ----
  aiChat: router({
    send: protectedProcedure
      .input(z.object({ message: z.string().min(1) }))
      .mutation(async ({ ctx, input }) => {
        const user = ctx.user;
        let dataContext = '';
        const employee = await getEmployeeByUserId(user.id);

        if (['super_admin', 'admin', 'ceo'].includes(user.role)) {
          const allEmps = await getAllEmployees();
          const today = new Date().toISOString().split('T')[0];
          const todayTasks = await getTasksByDate(today);
          const stats = await getTaskStats();
          dataContext = `Company Overview:\n- Total employees: ${allEmps.length}\n- Tasks today: ${todayTasks.length}\n- Completed: ${todayTasks.filter(t => t.status === 'done').length}\n- Total hours today: ${todayTasks.reduce((s, t) => s + (Number(t.actualHours) || 0), 0)}\nEmployees: ${allEmps.map(e => `${e.name} (${e.departmentName})`).join(', ')}`;
        } else if (['cmo', 'director', 'team_leader'].includes(user.role) && employee) {
          const deptEmps = await getEmployeesByDepartment(employee.departmentId);
          const deptTasks = await getTasksByDepartment(employee.departmentId);
          dataContext = `Department data:\n- Team: ${deptEmps.map(e => e.name).join(', ')}\n- Tasks: ${deptTasks.length}\n- Completed: ${deptTasks.filter(t => t.status === 'done').length}`;
        } else if (employee) {
          const myTasks = await getTasksByEmployee(employee.id);
          dataContext = `Your tasks:\n${myTasks.map(t => `- ${t.title}: ${t.status} (${t.actualHours || 0}h)`).join('\n')}`;
        }

        const history = await getChatHistory(user.id, 10);
        const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
          {
            role: 'system',
            content: `You are the TOS AI Assistant for Tamiyouz digital marketing agency ("التميز ليس مهارة بل موقف"). Help users understand their work data, reports, and performance. Answer in the same language the user asks in. Be concise and data-driven.\n\nCurrent user: ${user.name} (Role: ${user.role})\n${dataContext}\n\nIMPORTANT: Only share data the user is authorized to see.`
          },
          ...history.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
          { role: 'user' as const, content: input.message }
        ];

        const result = await invokeLLM({ messages });
        const response = (result.choices[0]?.message?.content as string) || 'Sorry, I could not process your request.';

        await saveChatMessage({ userId: user.id, role: 'user', content: input.message });
        await saveChatMessage({ userId: user.id, role: 'assistant', content: response });

        return { response };
      }),
    history: protectedProcedure
      .input(z.object({ limit: z.number().optional() }).optional())
      .query(({ ctx, input }) => getChatHistory(ctx.user.id, input?.limit || 50)),
  }),


  // ---- Help Center ----
  helpCenter: router({
    listArticles: protectedProcedure
      .input(z.object({ category: z.string().optional(), published: z.boolean().optional() }))
      .query(async ({ ctx, input }) => {
        const canManageHelp = ["admin", "super_admin"].includes(ctx.user.role);
        const published = canManageHelp ? input.published : true;
        const articles = await getAllHelpArticles({ category: input.category, published });
        return Promise.all(articles.map(enrichHelpArticle));
      }),
    getArticle: protectedProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ ctx, input }) => {
        const article = await getHelpArticleBySlug(input.slug);
        if (!article || (!article.isPublished && !["admin", "super_admin"].includes(ctx.user.role))) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Help article not found." });
        }
        await recordHelpView(article.id, ctx.user.id);
        return enrichHelpArticle(article);
      }),
    searchArticles: protectedProcedure
      .input(z.object({ query: z.string().min(2) }))
      .query(async ({ input }) => {
        const articles = await searchHelpArticles(input.query);
        return Promise.all(articles.map(enrichHelpArticle));
      }),
    getPinnedArticles: protectedProcedure.query(async () => {
      const articles = await getHelpPinnedArticles();
      return Promise.all(articles.map(enrichHelpArticle));
    }),
    getRecentUpdates: protectedProcedure
      .input(z.object({ limit: z.number().int().positive().max(20).optional() }))
      .query(async ({ input }) => {
        const articles = await getHelpRecentUpdates(input.limit);
        return Promise.all(articles.map(enrichHelpArticle));
      }),
    getCategories: protectedProcedure.query(async () => {
      const articles = await getAllHelpArticles({ published: true });
      const counts = new Map<string, number>();
      for (const article of articles) {
        counts.set(article.category, (counts.get(article.category) || 0) + 1);
      }
      return Array.from(counts.entries())
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => a.category.localeCompare(b.category));
    }),
    submitFeedback: protectedProcedure
      .input(z.object({ articleId: z.number().int().positive(), helpful: z.boolean(), comment: z.string().max(500).optional() }))
      .mutation(async ({ ctx, input }) => {
        await addHelpFeedback({ articleId: input.articleId, helpful: input.helpful, comment: input.comment, userId: ctx.user.id });
        return { success: true };
      }),
    startChat: protectedProcedure.mutation(async ({ ctx }) => {
      return createHelpChatSession(ctx.user.id);
    }),
    sendMessage: protectedProcedure
      .input(z.object({ sessionKey: z.string(), message: z.string().min(1).max(1000) }))
      .mutation(async ({ ctx, input }) => {
        const answer = await answerHelpQuestion(input.message, input.sessionKey, ctx.user.id);
        const history = await getHelpChatHistory(input.sessionKey);
        return { answer: answer.answer, sources: answer.sources, history };
      }),
    getChatHistory: protectedProcedure
      .input(z.object({ sessionKey: z.string() }))
      .query(async ({ ctx, input }) => {
        const session = await getHelpChatSession(input.sessionKey);
        if (!session || (session.userId && session.userId !== ctx.user.id)) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Chat session not found." });
        }
        return getHelpChatHistory(input.sessionKey);
      }),
    createArticle: superAdminProcedure
      .input(helpArticleSchema)
      .mutation(async ({ ctx, input }) => {
        return createHelpArticle({ ...input, authorId: ctx.user.id });
      }),
    updateArticle: superAdminProcedure
      .input(z.object({ id: z.number().int().positive(), data: helpArticleSchema.partial() }))
      .mutation(async ({ input }) => {
        return updateHelpArticle(input.id, input.data);
      }),
    deleteArticle: superAdminProcedure
      .input(z.number().int().positive())
      .mutation(async ({ input }) => {
        await deleteHelpArticle(input);
        return { success: true };
      }),
  }),

  // ---- Comments / Issues ----
  comments: router({
    list: protectedProcedure.query(async () => {
      return getAllComments();
    }),
    create: protectedProcedure
      .input(z.object({
        title: z.string().max(255).optional(),
        content: z.string().min(1),
        type: z.enum(["comment", "issue", "feedback"]).optional(),
        priority: z.enum(["low", "medium", "high"]).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return createComment({ userId: ctx.user.id, ...input });
      }),
    updateStatus: teamLeaderProcedure
      .input(z.object({ id: z.number(), status: z.enum(["open", "in_progress", "resolved"]) }))
      .mutation(async ({ ctx, input }) => {
        return updateCommentStatus(input.id, input.status, ctx.user.id);
      }),
  }),

  // ---- Activity Logs ----
  activityLogs: router({
    list: managementProcedure
      .input(z.object({ limit: z.number().optional() }).optional())
      .query(async ({ input }) => {
        return getAllActivityLogs(input?.limit || 200);
      }),
  }),

  // ---- User Management ----
  userManagement: router({
    list: superAdminProcedure.query(() => getAllUsers()),
    updateRole: superAdminProcedure
      .input(z.object({
        userId: z.number(),
        role: z.enum(['employee', 'team_leader', 'director', 'cmo', 'ceo', 'admin', 'super_admin']),
      }))
      .mutation(({ input }) => updateUserRole(input.userId, input.role)),
    linkEmployee: superAdminProcedure
      .input(z.object({ userId: z.number(), employeeId: z.number() }))
      .mutation(({ input }) => linkUserToEmployee(input.userId, input.employeeId)),
  }),

  // ---- Developer Hub ----
  developerHub: router({
    get: superAdminProcedure.query(() => getDeveloperHubStatus()),
    save: superAdminProcedure
      .input(z.object({
        repoPath: z.string(),
        githubRepo: z.string(),
        githubToken: z.string().optional(),
        defaultBranch: z.string().default("main"),
        isEnabled: z.boolean().default(true),
      }))
      .mutation(({ input }) => saveDeveloperHubConfig(input)),
  }),
});

export type AppRouter = typeof appRouter;
