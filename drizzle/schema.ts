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

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  employee: one(employees, {
    fields: [users.id],
    references: [employees.userId],
  }),
  approvedReports: many(dailyReports),
  chatMessages: many(chatMessages),
}));

export const departmentsRelations = relations(departments, ({ many }) => ({
  employees: many(employees),
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
}));

export const clientsRelations = relations(clients, ({ many }) => ({
  tasks: many(tasks),
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

// Export types for Drizzle ORM
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export type Department = typeof departments.$inferSelect;
export type InsertDepartment = typeof departments.$inferInsert;

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
