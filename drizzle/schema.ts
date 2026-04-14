import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  boolean,
  decimal,
  date,
  primaryKey,
  unique,
  double,
  index,
  uniqueIndex,
  json,
} from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  password: varchar("password", { length: 255 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", [
    "employee",
    "team_leader",
    "director",
    "cmo",
    "ceo",
    "admin",
    "super_admin",
  ])
    .default("employee")
    .notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const departments = mysqlTable("departments", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  nameAr: varchar("nameAr", { length: 100 }),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const departmentWorkspaces = mysqlTable(
  "department_workspaces",
  {
    id: int("id").autoincrement().primaryKey(),
    departmentId: int("departmentId").references(() => departments.id, {
      onDelete: "set null",
    }),
    name: varchar("name", { length: 191 }).notNull(),
    trelloWorkspaceId: varchar("trelloWorkspaceId", { length: 255 }),
    apiKey: varchar("apiKey", { length: 255 }).notNull(),
    apiToken: text("apiToken").notNull(),
    isActive: boolean("isActive").default(true).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    nameIdx: uniqueIndex("department_workspaces_name_unique").on(table.name),
    departmentIdx: index("department_workspaces_department_idx").on(table.departmentId),
  }),
);

export const employees = mysqlTable("employees", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").unique(), // FK to users.id
  name: varchar("name", { length: 255 }).notNull(),
  nameAr: varchar("nameAr", { length: 255 }),
  email: varchar("email", { length: 320 }),
  password: varchar("password", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  departmentId: int("departmentId").notNull(), // FK to departments.id
  position: varchar("position", { length: 100 }),
  departmentWorkspaceId: int("departmentWorkspaceId").references(() => departmentWorkspaces.id, {
    onDelete: "set null",
  }),
  trelloBoardId: varchar("trelloBoardId", { length: 255 }),
  trelloBoardUrl: varchar("trelloBoardUrl", { length: 500 }),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const clients = mysqlTable("clients", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  nameAr: varchar("nameAr", { length: 255 }),
  contactEmail: varchar("contactEmail", { length: 320 }),
  contactPhone: varchar("contactPhone", { length: 50 }),
  industry: varchar("industry", { length: 100 }),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const tasks = mysqlTable("tasks", {
  id: int("id").autoincrement().primaryKey(),
  employeeId: int("employeeId").notNull(), // FK to employees.id
  clientId: int("clientId"), // FK to clients.id
  trelloCardId: varchar("trelloCardId", { length: 255 }),
  trelloCardUrl: varchar("trelloCardUrl", { length: 500 }),
  title: varchar("title", { length: 500 }).notNull(),
  description: text("description"),
  status: mysqlEnum("status", ["todo", "in_progress", "review", "done"])
    .default("todo")
    .notNull(),
  startedAt: timestamp("startedAt"),
  completedAt: timestamp("completedAt"),
  estimatedHours: decimal("estimatedHours", { precision: 5, scale: 2 }),
  actualHours: decimal("actualHours", { precision: 5, scale: 2 }),
  date: date("date", { mode: "string" }).notNull(), // which day this task belongs to
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const dailyReports = mysqlTable(
  "daily_reports",
  {
    id: int("id").autoincrement().primaryKey(),
    employeeId: int("employeeId").notNull(), // FK to employees.id
    date: date("date", { mode: "string" }).notNull(),
    totalHours: decimal("totalHours", { precision: 5, scale: 2 }).default("0"),
    tasksCompleted: int("tasksCompleted").default(0),
    tasksInProgress: int("tasksInProgress").default(0),
    summary: text("summary"), // AI-generated summary
    status: mysqlEnum("status", ["draft", "generated", "approved"])
      .default("draft")
      .notNull(),
    generatedAt: timestamp("generatedAt"),
    approvedBy: int("approvedBy"), // FK to users.id
    approvedAt: timestamp("approvedAt"),
    s3ReportUrl: varchar("s3ReportUrl", { length: 500 }), // stored PDF/Excel URL in S3
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => {
    return {
      employeeDateUnique: unique("employee_date_unique").on(
        table.employeeId,
        table.date,
      ),
    };
  },
);

export const trelloSettings = mysqlTable("trello_settings", {
  id: int("id").autoincrement().primaryKey(),
  apiKey: varchar("apiKey", { length: 255 }).notNull(),
  apiToken: text("apiToken").notNull(),
  isActive: boolean("isActive").default(true),
  lastSyncAt: timestamp("lastSyncAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const activityLog = mysqlTable("activity_log", {
  id: int("id").autoincrement().primaryKey(),
  employeeId: int("employeeId").notNull(), // FK to employees.id
  taskId: int("taskId"), // FK to tasks.id
  action: varchar("action", { length: 100 }).notNull(), // 'card_moved', 'card_created', 'card_completed'
  details: text("details"), // JSON string
  trelloCardId: varchar("trelloCardId", { length: 255 }),
  fromStatus: varchar("fromStatus", { length: 50 }),
  toStatus: varchar("toStatus", { length: 50 }),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const alerts = mysqlTable("alerts", {
  id: int("id").autoincrement().primaryKey(),
  employeeId: int("employeeId"), // FK to employees.id
  type: mysqlEnum("type", [
    "deadline_missed",
    "overdue_task",
    "low_productivity",
    "system",
  ])
    .default("system")
    .notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message"),
  isRead: boolean("isRead").default(false),
  severity: mysqlEnum("severity", ["info", "warning", "critical"])
    .default("info")
    .notNull(),
  targetRole: varchar("targetRole", { length: 50 }), // which role should see this alert
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const chatMessages = mysqlTable("chat_messages", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // FK to users.id
  role: mysqlEnum("role", ["user", "assistant"]).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// =============================================
// Client Area Tables (NEW)
// =============================================

export const clientServices = mysqlTable(
  "client_services",
  {
    id: int("id").autoincrement().primaryKey(),
    clientId: int("clientId")
      .notNull()
      .references(() => clients.id, { onDelete: "cascade" }),
    service: varchar("service", { length: 100 }).notNull(),
  },
  (table) => ({
    clientIdx: index("client_services_client_idx").on(table.clientId),
    uniqueClientService: uniqueIndex("client_services_unique").on(
      table.clientId,
      table.service,
    ),
  }),
);

export const clientIntegrations = mysqlTable(
  "client_integrations",
  {
    id: int("id").autoincrement().primaryKey(),
    clientId: int("clientId")
      .notNull()
      .references(() => clients.id, { onDelete: "cascade" }),
    service: varchar("service", { length: 100 }).notNull(),
    integrationType: varchar("integrationType", { length: 100 }).notNull(),
    displayName: varchar("displayName", { length: 191 }).notNull(),
    externalId: varchar("externalId", { length: 191 }),
    status: varchar("status", { length: 50 }).notNull().default("active"),
    metadata: json("metadata").$type<Record<string, unknown> | null>().default(null),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    clientIdx: index("client_integrations_client_idx").on(table.clientId),
    serviceIdx: index("client_integrations_service_idx").on(table.service),
    typeIdx: index("client_integrations_type_idx").on(table.integrationType),
  }),
);

export const clientAssignments = mysqlTable(
  "client_assignments",
  {
    id: int("id").autoincrement().primaryKey(),
    clientId: int("clientId")
      .notNull()
      .references(() => clients.id, { onDelete: "cascade" }),
    employeeId: int("employeeId").references(() => employees.id, {
      onDelete: "cascade",
    }),
    departmentId: int("departmentId").references(() => departments.id, {
      onDelete: "cascade",
    }),
  },
  (table) => ({
    clientIdx: index("client_assignments_client_idx").on(table.clientId),
    employeeIdx: index("client_assignments_employee_idx").on(table.employeeId),
    departmentIdx: index("client_assignments_department_idx").on(table.departmentId),
    uniqueClientEmployee: uniqueIndex("client_assignments_client_employee_unique").on(
      table.clientId,
      table.employeeId,
    ),
    uniqueClientDepartment: uniqueIndex("client_assignments_client_department_unique").on(
      table.clientId,
      table.departmentId,
    ),
  }),
);

export const clientNotes = mysqlTable(
  "client_notes",
  {
    id: int("id").autoincrement().primaryKey(),
    clientId: int("clientId")
      .notNull()
      .references(() => clients.id, { onDelete: "cascade" }),
    authorId: int("authorId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    clientIdx: index("client_notes_client_idx").on(table.clientId),
    authorIdx: index("client_notes_author_idx").on(table.authorId),
    createdIdx: index("client_notes_created_idx").on(table.createdAt),
  }),
);

export const clientKpis = mysqlTable(
  "client_kpis",
  {
    id: int("id").autoincrement().primaryKey(),
    clientId: int("clientId")
      .notNull()
      .references(() => clients.id, { onDelete: "cascade" }),
    metricName: varchar("metricName", { length: 120 }).notNull(),
    metricValue: double("metricValue").notNull(),
    date: date("date", { mode: "string" }).notNull(),
    recordedById: int("recordedById")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
  },
  (table) => ({
    clientIdx: index("client_kpis_client_idx").on(table.clientId),
    metricIdx: index("client_kpis_metric_idx").on(table.metricName),
    dateIdx: index("client_kpis_date_idx").on(table.date),
  }),
);

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  employee: one(employees, {
    fields: [users.id],
    references: [employees.userId],
  }),
  approvedReports: many(dailyReports),
  chatMessages: many(chatMessages),
  clientNotes: many(clientNotes),
  clientKpis: many(clientKpis),
}));

export const departmentsRelations = relations(departments, ({ many }) => ({
  employees: many(employees),
  clientAssignments: many(clientAssignments),
}));

export const employeesRelations = relations(employees, ({ one, many }) => ({
  user: one(users, {
    fields: [employees.userId],
    references: [users.id],
  }),
  department: one(departments, {
    fields: [employees.departmentId],
    references: [departments.id],
  }),
  tasks: many(tasks),
  dailyReports: many(dailyReports),
  activityLog: many(activityLog),
  alerts: many(alerts),
  clientAssignments: many(clientAssignments),
}));

export const clientsRelations = relations(clients, ({ many }) => ({
  tasks: many(tasks),
  services: many(clientServices),
  integrations: many(clientIntegrations),
  assignments: many(clientAssignments),
  notes: many(clientNotes),
  kpis: many(clientKpis),
}));

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  employee: one(employees, {
    fields: [tasks.employeeId],
    references: [employees.id],
  }),
  client: one(clients, {
    fields: [tasks.clientId],
    references: [clients.id],
  }),
  activityLog: many(activityLog),
}));

export const dailyReportsRelations = relations(dailyReports, ({ one }) => ({
  employee: one(employees, {
    fields: [dailyReports.employeeId],
    references: [employees.id],
  }),
  approver: one(users, {
    fields: [dailyReports.approvedBy],
    references: [users.id],
  }),
}));

export const activityLogRelations = relations(activityLog, ({ one }) => ({
  employee: one(employees, {
    fields: [activityLog.employeeId],
    references: [employees.id],
  }),
  task: one(tasks, {
    fields: [activityLog.taskId],
    references: [tasks.id],
  }),
}));

export const alertsRelations = relations(alerts, ({ one }) => ({
  employee: one(employees, {
    fields: [alerts.employeeId],
    references: [employees.id],
  }),
}));

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  user: one(users, {
    fields: [chatMessages.userId],
    references: [users.id],
  }),
}));

// Client Area Relations (NEW)
export const clientServicesRelations = relations(clientServices, ({ one }) => ({
  client: one(clients, {
    fields: [clientServices.clientId],
    references: [clients.id],
  }),
}));

export const clientIntegrationsRelations = relations(clientIntegrations, ({ one }) => ({
  client: one(clients, {
    fields: [clientIntegrations.clientId],
    references: [clients.id],
  }),
}));

export const clientAssignmentsRelations = relations(clientAssignments, ({ one }) => ({
  client: one(clients, {
    fields: [clientAssignments.clientId],
    references: [clients.id],
  }),
  employee: one(employees, {
    fields: [clientAssignments.employeeId],
    references: [employees.id],
  }),
  department: one(departments, {
    fields: [clientAssignments.departmentId],
    references: [departments.id],
  }),
}));

export const clientNotesRelations = relations(clientNotes, ({ one }) => ({
  client: one(clients, {
    fields: [clientNotes.clientId],
    references: [clients.id],
  }),
  author: one(users, {
    fields: [clientNotes.authorId],
    references: [users.id],
  }),
}));

export const clientKpisRelations = relations(clientKpis, ({ one }) => ({
  client: one(clients, {
    fields: [clientKpis.clientId],
    references: [clients.id],
  }),
  recordedBy: one(users, {
    fields: [clientKpis.recordedById],
    references: [users.id],
  }),
}));

// Export types for Drizzle ORM
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export type Department = typeof departments.$inferSelect;
export type InsertDepartment = typeof departments.$inferInsert;

export type DepartmentWorkspace = typeof departmentWorkspaces.$inferSelect;
export type InsertDepartmentWorkspace = typeof departmentWorkspaces.$inferInsert;

export type Employee = typeof employees.$inferSelect;
export type InsertEmployee = typeof employees.$inferInsert;

export type Client = typeof clients.$inferSelect;
export type InsertClient = typeof clients.$inferInsert;

export type Task = typeof tasks.$inferSelect;
export type InsertTask = typeof tasks.$inferInsert;

export type DailyReport = typeof dailyReports.$inferSelect;
export type InsertDailyReport = typeof dailyReports.$inferInsert;

export type TrelloSetting = typeof trelloSettings.$inferSelect;
export type InsertTrelloSetting = typeof trelloSettings.$inferInsert;

export type ActivityLog = typeof activityLog.$inferSelect;
export type InsertActivityLog = typeof activityLog.$inferInsert;

export type Alert = typeof alerts.$inferSelect;
export type InsertAlert = typeof alerts.$inferInsert;

export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = typeof chatMessages.$inferInsert;

export type ClientService = typeof clientServices.$inferSelect;
export type InsertClientService = typeof clientServices.$inferInsert;

export type ClientIntegration = typeof clientIntegrations.$inferSelect;
export type InsertClientIntegration = typeof clientIntegrations.$inferInsert;

export type ClientAssignment = typeof clientAssignments.$inferSelect;
export type InsertClientAssignment = typeof clientAssignments.$inferInsert;

export type ClientNote = typeof clientNotes.$inferSelect;
export type InsertClientNote = typeof clientNotes.$inferInsert;

export type ClientKpi = typeof clientKpis.$inferSelect;
export type InsertClientKpi = typeof clientKpis.$inferInsert;

// Help Center tables
export const helpArticles = mysqlTable("help_articles", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  titleAr: varchar("titleAr", { length: 255 }),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  content: text("content").notNull(),
  contentAr: text("contentAr"),
  category: varchar("category", { length: 100 }).notNull(),
  tags: text("tags"),
  isPublished: boolean("isPublished").default(true).notNull(),
  isPinned: boolean("isPinned").default(false).notNull(),
  version: varchar("version", { length: 20 }),
  authorId: int("authorId").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const helpArticleViews = mysqlTable("help_article_views", {
  id: int("id").autoincrement().primaryKey(),
  articleId: int("articleId").notNull().references(() => helpArticles.id, { onDelete: "cascade" }),
  userId: int("userId").references(() => users.id, { onDelete: "set null" }),
  viewedAt: timestamp("viewedAt").defaultNow().notNull(),
});

export const helpFeedback = mysqlTable("help_feedback", {
  id: int("id").autoincrement().primaryKey(),
  articleId: int("articleId").notNull().references(() => helpArticles.id, { onDelete: "cascade" }),
  userId: int("userId").references(() => users.id, { onDelete: "set null" }),
  helpful: boolean("helpful").notNull(),
  comment: text("comment"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const helpChatSessions = mysqlTable("help_chat_sessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").references(() => users.id, { onDelete: "set null" }),
  sessionKey: varchar("sessionKey", { length: 100 }).notNull().unique(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const helpChatMessages = mysqlTable("help_chat_messages", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: int("sessionId").notNull().references(() => helpChatSessions.id, { onDelete: "cascade" }),
  role: mysqlEnum("role", ["user", "assistant"]).notNull(),
  content: text("content").notNull(),
  sources: text("sources"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Comments / Issues table
export const comments = mysqlTable("comments", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 255 }),
  content: text("content").notNull(),
  type: mysqlEnum("type", ["comment", "issue", "feedback"]).default("comment"),
  priority: mysqlEnum("priority", ["low", "medium", "high"]).default("medium"),
  status: mysqlEnum("status", ["open", "in_progress", "resolved"]).default("open"),
  resolvedById: int("resolvedById"),
  resolvedAt: timestamp("resolvedAt"),
  createdAt: timestamp("createdAt").defaultNow(),
});

// Type exports for new tables
export type HelpArticle = typeof helpArticles.$inferSelect;
export type InsertHelpArticle = typeof helpArticles.$inferInsert;

export type HelpArticleView = typeof helpArticleViews.$inferSelect;
export type InsertHelpArticleView = typeof helpArticleViews.$inferInsert;

export type HelpFeedback = typeof helpFeedback.$inferSelect;
export type InsertHelpFeedback = typeof helpFeedback.$inferInsert;

export type HelpChatSession = typeof helpChatSessions.$inferSelect;
export type InsertHelpChatSession = typeof helpChatSessions.$inferInsert;

export type HelpChatMessage = typeof helpChatMessages.$inferSelect;
export type InsertHelpChatMessage = typeof helpChatMessages.$inferInsert;

export type Comment = typeof comments.$inferSelect;
export type InsertComment = typeof comments.$inferInsert;

// ---- Developer Hub Settings ----
export const developerHubSettings = mysqlTable("developer_hub_settings", {
  id: int("id").autoincrement().primaryKey(),
  repoPath: varchar("repoPath", { length: 512 }),
  githubRepo: varchar("githubRepo", { length: 255 }),
  githubTokenEncrypted: text("githubTokenEncrypted"),
  defaultBranch: varchar("defaultBranch", { length: 100 }).default("main").notNull(),
  isEnabled: boolean("isEnabled").default(true).notNull(),
  lastPushAt: timestamp("lastPushAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DeveloperHubSettings = typeof developerHubSettings.$inferSelect;
export type InsertDeveloperHubSettings = typeof developerHubSettings.$inferInsert;
