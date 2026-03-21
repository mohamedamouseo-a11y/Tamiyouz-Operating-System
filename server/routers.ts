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
} from "./db";
import { getTrelloService, syncEmployeeBoard } from "./trello";
import { generateDailyReport as aiGenerateDailyReport, analyzePerformance, checkDeadlines } from "./ai-agent";
import { invokeLLM } from "./_core/llm";
import type { User } from "../drizzle/schema";
import { answerHelpQuestion } from "./helpCenterAI";
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
        trelloBoardId: z.string().optional(), trelloBoardUrl: z.string().optional(),
      }))
      .mutation(({ input }) => createEmployee(input)),
    update: superAdminProcedure
      .input(z.object({
        id: z.number(), name: z.string().min(1).optional(), nameAr: z.string().optional(),
        email: z.string().email().optional(), phone: z.string().optional(),
        departmentId: z.number().optional(), position: z.string().optional(),
        trelloBoardId: z.string().optional(), trelloBoardUrl: z.string().optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(({ input }) => updateEmployee(input.id, input)),
    delete: superAdminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => deleteEmployee(input.id)),
    linkToUser: superAdminProcedure
      .input(z.object({ employeeId: z.number(), userId: z.number() }))
      .mutation(({ input }) => linkEmployeeToUser(input.employeeId, input.userId)),
  }),

  // ---- Clients ----
  clients: router({
    list: protectedProcedure.query(() => getAllClients()),
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(({ input }) => getClientById(input.id)),
    create: teamLeaderProcedure
      .input(z.object({
        name: z.string().min(1), nameAr: z.string().optional(),
        contactEmail: z.string().email().optional(), contactPhone: z.string().optional(),
        industry: z.string().optional(),
      }))
      .mutation(({ input }) => createClient(input)),
    update: teamLeaderProcedure
      .input(z.object({
        id: z.number(), name: z.string().min(1).optional(), nameAr: z.string().optional(),
        contactEmail: z.string().email().optional(), contactPhone: z.string().optional(),
        industry: z.string().optional(), isActive: z.boolean().optional(),
      }))
      .mutation(({ input }) => updateClient(input.id, input)),
    delete: superAdminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => deleteClient(input.id)),
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
});

export type AppRouter = typeof appRouter;
