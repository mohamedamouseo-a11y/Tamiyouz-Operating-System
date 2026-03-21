import { eq, and, desc, sql, count, gte, lte, between } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  users, departments, employees, clients, tasks, dailyReports,
  trelloSettings, activityLog, alerts, chatMessages, comments,
  type InsertUser, type InsertDepartment, type InsertEmployee,
  type InsertClient, type InsertTask, type InsertDailyReport,
  type InsertTrelloSetting, type InsertActivityLog, type InsertAlert,
  type InsertChatMessage, type InsertComment,
} from "../drizzle/schema";
import * as schema from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL, { schema, mode: 'default' });
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db!;
}

// ---- Existing User Functions ----

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot upsert user: database not available"); return; }
  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];
    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      values[field] = value ?? null;
      updateSet[field] = value ?? null;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
    if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
    else if (user.openId === ENV.ownerOpenId) { values.role = 'admin'; updateSet.role = 'admin'; }
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) { console.error("[Database] Failed to upsert user:", error); throw error; }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ---- Department Functions ----

export async function getAllDepartments() {
  const db = await getDb();
  return db.select().from(departments).orderBy(departments.name);
}

export async function getDepartmentById(id: number) {
  const db = await getDb();
  const result = await db.select().from(departments).where(eq(departments.id, id)).limit(1);
  return result[0] || null;
}

export async function createDepartment(data: Omit<InsertDepartment, 'id'>) {
  const db = await getDb();
  const result = await db.insert(departments).values(data);
  return { id: result[0].insertId, ...data };
}

export async function updateDepartment(id: number, data: Partial<InsertDepartment>) {
  const db = await getDb();
  await db.update(departments).set(data).where(eq(departments.id, id));
  return getDepartmentById(id);
}

export async function deleteDepartment(id: number) {
  const db = await getDb();
  await db.delete(departments).where(eq(departments.id, id));
  return { success: true };
}

// ---- Employee Functions ----

export async function getAllEmployees() {
  const db = await getDb();
  const result = await db.select({
    id: employees.id, userId: employees.userId, name: employees.name, nameAr: employees.nameAr,
    email: employees.email, phone: employees.phone, departmentId: employees.departmentId,
    position: employees.position, trelloBoardId: employees.trelloBoardId,
    trelloBoardUrl: employees.trelloBoardUrl, isActive: employees.isActive,
    createdAt: employees.createdAt, updatedAt: employees.updatedAt,
    departmentName: departments.name, departmentNameAr: departments.nameAr,
  }).from(employees)
    .leftJoin(departments, eq(employees.departmentId, departments.id))
    .orderBy(employees.name);
  return result;
}

export async function getEmployeeById(id: number) {
  const db = await getDb();
  const result = await db.select({
    id: employees.id, userId: employees.userId, name: employees.name, nameAr: employees.nameAr,
    email: employees.email, phone: employees.phone, departmentId: employees.departmentId,
    position: employees.position, trelloBoardId: employees.trelloBoardId,
    trelloBoardUrl: employees.trelloBoardUrl, isActive: employees.isActive,
    createdAt: employees.createdAt, updatedAt: employees.updatedAt,
    departmentName: departments.name, departmentNameAr: departments.nameAr,
  }).from(employees)
    .leftJoin(departments, eq(employees.departmentId, departments.id))
    .where(eq(employees.id, id)).limit(1);
  return result[0] || null;
}

export async function getEmployeesByDepartment(departmentId: number) {
  const db = await getDb();
  return db.select().from(employees)
    .where(and(eq(employees.departmentId, departmentId), eq(employees.isActive, true)))
    .orderBy(employees.name);
}

export async function getEmployeeByUserId(userId: number) {
  const db = await getDb();
  const result = await db.select({
    id: employees.id, userId: employees.userId, name: employees.name, nameAr: employees.nameAr,
    email: employees.email, phone: employees.phone, departmentId: employees.departmentId,
    position: employees.position, trelloBoardId: employees.trelloBoardId,
    trelloBoardUrl: employees.trelloBoardUrl, isActive: employees.isActive,
    createdAt: employees.createdAt, updatedAt: employees.updatedAt,
    departmentName: departments.name,
  }).from(employees)
    .leftJoin(departments, eq(employees.departmentId, departments.id))
    .where(eq(employees.userId, userId)).limit(1);
  return result[0] || null;
}

export async function createEmployee(data: Omit<InsertEmployee, 'id'>) {
  const db = await getDb();
  const result = await db.insert(employees).values(data);
  return { id: result[0].insertId, ...data };
}

export async function updateEmployee(id: number, data: Partial<InsertEmployee>) {
  const db = await getDb();
  await db.update(employees).set(data).where(eq(employees.id, id));
  return getEmployeeById(id);
}

export async function deleteEmployee(id: number) {
  const db = await getDb();
  await db.update(employees).set({ isActive: false }).where(eq(employees.id, id));
  return { success: true };
}

export async function linkEmployeeToUser(employeeId: number, userId: number) {
  const db = await getDb();
  await db.update(employees).set({ userId }).where(eq(employees.id, employeeId));
  return { success: true };
}

// ---- Client Functions ----

export async function getAllClients() {
  const db = await getDb();
  return db.select().from(clients).where(eq(clients.isActive, true)).orderBy(clients.name);
}

export async function getClientById(id: number) {
  const db = await getDb();
  const result = await db.select().from(clients).where(eq(clients.id, id)).limit(1);
  return result[0] || null;
}

export async function createClient(data: Omit<InsertClient, 'id'>) {
  const db = await getDb();
  const result = await db.insert(clients).values(data);
  return { id: result[0].insertId, ...data };
}

export async function updateClient(id: number, data: Partial<InsertClient>) {
  const db = await getDb();
  await db.update(clients).set(data).where(eq(clients.id, id));
  return getClientById(id);
}

export async function deleteClient(id: number) {
  const db = await getDb();
  await db.update(clients).set({ isActive: false }).where(eq(clients.id, id));
  return { success: true };
}

// ---- Task Functions ----

export async function getTasksByEmployee(employeeId: number, date?: string) {
  const db = await getDb();
  const conditions = [eq(tasks.employeeId, employeeId)];
  if (date) conditions.push(eq(tasks.date, date));
  return db.select({
    id: tasks.id, employeeId: tasks.employeeId, clientId: tasks.clientId,
    trelloCardId: tasks.trelloCardId, trelloCardUrl: tasks.trelloCardUrl,
    title: tasks.title, description: tasks.description, status: tasks.status,
    startedAt: tasks.startedAt, completedAt: tasks.completedAt,
    estimatedHours: tasks.estimatedHours, actualHours: tasks.actualHours,
    date: tasks.date, createdAt: tasks.createdAt, updatedAt: tasks.updatedAt,
    clientName: clients.name,
  }).from(tasks)
    .leftJoin(clients, eq(tasks.clientId, clients.id))
    .where(and(...conditions))
    .orderBy(desc(tasks.createdAt));
}

export async function getTasksByDate(date: string) {
  const db = await getDb();
  return db.select({
    id: tasks.id, employeeId: tasks.employeeId, clientId: tasks.clientId,
    title: tasks.title, description: tasks.description, status: tasks.status,
    startedAt: tasks.startedAt, completedAt: tasks.completedAt,
    estimatedHours: tasks.estimatedHours, actualHours: tasks.actualHours,
    date: tasks.date, createdAt: tasks.createdAt,
    employeeName: employees.name, clientName: clients.name,
    departmentName: departments.name,
  }).from(tasks)
    .leftJoin(employees, eq(tasks.employeeId, employees.id))
    .leftJoin(clients, eq(tasks.clientId, clients.id))
    .leftJoin(departments, eq(employees.departmentId, departments.id))
    .where(eq(tasks.date, date))
    .orderBy(desc(tasks.createdAt));
}

export async function getTasksByDepartment(departmentId: number, date?: string) {
  const db = await getDb();
  const conditions = [eq(employees.departmentId, departmentId)];
  if (date) conditions.push(eq(tasks.date, date));
  return db.select({
    id: tasks.id, employeeId: tasks.employeeId, clientId: tasks.clientId,
    title: tasks.title, description: tasks.description, status: tasks.status,
    actualHours: tasks.actualHours, date: tasks.date,
    employeeName: employees.name, clientName: clients.name,
  }).from(tasks)
    .innerJoin(employees, eq(tasks.employeeId, employees.id))
    .leftJoin(clients, eq(tasks.clientId, clients.id))
    .where(and(...conditions))
    .orderBy(desc(tasks.createdAt));
}

export async function createTask(data: Omit<InsertTask, 'id'>) {
  const db = await getDb();
  const result = await db.insert(tasks).values(data);
  return { id: result[0].insertId, ...data };
}

export async function updateTask(id: number, data: Partial<InsertTask>) {
  const db = await getDb();
  await db.update(tasks).set(data).where(eq(tasks.id, id));
}

export async function updateTaskStatus(id: number, status: string, actualHours?: number) {
  const db = await getDb();
  const updateData: Record<string, any> = { status };
  if (status === 'in_progress') updateData.startedAt = new Date();
  if (status === 'done') {
    updateData.completedAt = new Date();
    if (actualHours !== undefined) updateData.actualHours = String(actualHours);
  }
  await db.update(tasks).set(updateData).where(eq(tasks.id, id));
}

export async function getTaskStats(employeeIds?: number[], startDate?: string, endDate?: string) {
  const db = await getDb();
  const conditions: any[] = [];
  if (employeeIds && employeeIds.length > 0) {
    conditions.push(sql`${tasks.employeeId} IN (${sql.join(employeeIds.map(id => sql`${id}`), sql`, `)})`);
  }
  if (startDate) conditions.push(gte(tasks.date, startDate));
  if (endDate) conditions.push(lte(tasks.date, endDate));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const statusCounts = await db.select({
    status: tasks.status,
    count: count(tasks.id),
    totalHours: sql<string>`COALESCE(SUM(${tasks.actualHours}), 0)`,
  }).from(tasks).where(whereClause).groupBy(tasks.status);

  const tasksByStatus: Record<string, number> = {};
  let totalTasks = 0;
  let totalActualHours = 0;
  for (const row of statusCounts) {
    tasksByStatus[row.status] = row.count;
    totalTasks += row.count;
    totalActualHours += Number(row.totalHours) || 0;
  }

  return { tasksByStatus, totalTasks, totalActualHours };
}

// ---- Daily Report Functions ----

export async function getDailyReport(employeeId: number, date: string) {
  const db = await getDb();
  const result = await db.select({
    id: dailyReports.id, employeeId: dailyReports.employeeId, date: dailyReports.date,
    totalHours: dailyReports.totalHours, tasksCompleted: dailyReports.tasksCompleted,
    tasksInProgress: dailyReports.tasksInProgress, summary: dailyReports.summary,
    status: dailyReports.status, generatedAt: dailyReports.generatedAt,
    approvedBy: dailyReports.approvedBy, approvedAt: dailyReports.approvedAt,
    s3ReportUrl: dailyReports.s3ReportUrl, createdAt: dailyReports.createdAt,
    employeeName: employees.name,
  }).from(dailyReports)
    .leftJoin(employees, eq(dailyReports.employeeId, employees.id))
    .where(and(eq(dailyReports.employeeId, employeeId), eq(dailyReports.date, date)))
    .limit(1);
  return result[0] || null;
}

export async function getDailyReportsByDate(date: string) {
  const db = await getDb();
  return db.select({
    id: dailyReports.id, employeeId: dailyReports.employeeId, date: dailyReports.date,
    totalHours: dailyReports.totalHours, tasksCompleted: dailyReports.tasksCompleted,
    tasksInProgress: dailyReports.tasksInProgress, summary: dailyReports.summary,
    status: dailyReports.status, generatedAt: dailyReports.generatedAt,
    approvedBy: dailyReports.approvedBy, approvedAt: dailyReports.approvedAt,
    employeeName: employees.name, departmentName: departments.name,
  }).from(dailyReports)
    .leftJoin(employees, eq(dailyReports.employeeId, employees.id))
    .leftJoin(departments, eq(employees.departmentId, departments.id))
    .where(eq(dailyReports.date, date))
    .orderBy(desc(dailyReports.createdAt));
}

export async function getDailyReportsByEmployee(employeeId: number, startDate?: string, endDate?: string) {
  const db = await getDb();
  const conditions = [eq(dailyReports.employeeId, employeeId)];
  if (startDate) conditions.push(gte(dailyReports.date, startDate));
  if (endDate) conditions.push(lte(dailyReports.date, endDate));
  return db.select().from(dailyReports).where(and(...conditions)).orderBy(desc(dailyReports.date));
}

export async function createOrUpdateDailyReport(data: Omit<InsertDailyReport, 'id'>) {
  const db = await getDb();
  const existing = await getDailyReport(data.employeeId, data.date);
  if (existing) {
    await db.update(dailyReports).set({
      totalHours: data.totalHours, tasksCompleted: data.tasksCompleted,
      tasksInProgress: data.tasksInProgress, summary: data.summary,
      status: data.status, generatedAt: data.generatedAt, s3ReportUrl: data.s3ReportUrl,
    }).where(eq(dailyReports.id, existing.id));
    return { ...existing, ...data };
  } else {
    const result = await db.insert(dailyReports).values(data);
    return { id: result[0].insertId, ...data };
  }
}

export async function approveDailyReport(id: number, approvedBy: number) {
  const db = await getDb();
  await db.update(dailyReports).set({
    status: 'approved', approvedBy, approvedAt: new Date(),
  }).where(eq(dailyReports.id, id));
  return { success: true };
}

// ---- Trello Settings Functions ----

export async function getTrelloSettings() {
  const db = await getDb();
  const result = await db.select().from(trelloSettings).where(eq(trelloSettings.isActive, true)).limit(1);
  return result[0] || null;
}

export async function saveTrelloSettings(data: { apiKey: string; apiToken: string; isActive?: boolean }) {
  const db = await getDb();
  const existing = await getTrelloSettings();
  if (existing) {
    await db.update(trelloSettings).set({ apiKey: data.apiKey, apiToken: data.apiToken }).where(eq(trelloSettings.id, existing.id));
    return { ...existing, ...data };
  } else {
    const result = await db.insert(trelloSettings).values({ apiKey: data.apiKey, apiToken: data.apiToken, isActive: true });
    return { id: result[0].insertId, ...data };
  }
}

export async function updateLastSync() {
  const db = await getDb();
  const existing = await getTrelloSettings();
  if (existing) {
    await db.update(trelloSettings).set({ lastSyncAt: new Date() }).where(eq(trelloSettings.id, existing.id));
  }
}

// ---- Activity Log Functions ----

export async function logActivity(data: Omit<InsertActivityLog, 'id'>) {
  const db = await getDb();
  await db.insert(activityLog).values(data);
}

export async function getActivityByEmployee(employeeId: number, limit: number = 20) {
  const db = await getDb();
  return db.select().from(activityLog).where(eq(activityLog.employeeId, employeeId)).orderBy(desc(activityLog.timestamp)).limit(limit);
}

// ---- Alert Functions ----

export async function createAlert(data: Omit<InsertAlert, 'id'>) {
  const db = await getDb();
  await db.insert(alerts).values(data);
}

export async function getAlerts(filters?: { targetRole?: string; isRead?: boolean; type?: string }) {
  const db = await getDb();
  const conditions: any[] = [];
  if (filters?.targetRole) conditions.push(eq(alerts.targetRole, filters.targetRole));
  if (filters?.isRead !== undefined) conditions.push(eq(alerts.isRead, filters.isRead));
  if (filters?.type) conditions.push(eq(alerts.type, filters.type as any));
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
  return db.select().from(alerts).where(whereClause).orderBy(desc(alerts.createdAt));
}

export async function markAlertRead(id: number) {
  const db = await getDb();
  await db.update(alerts).set({ isRead: true }).where(eq(alerts.id, id));
  return { success: true };
}

export async function getUnreadAlertCount(targetRole?: string) {
  const db = await getDb();
  const conditions = [eq(alerts.isRead, false)];
  if (targetRole) conditions.push(eq(alerts.targetRole, targetRole));
  const result = await db.select({ count: count(alerts.id) }).from(alerts).where(and(...conditions));
  return result[0]?.count || 0;
}

// ---- Chat Message Functions ----

export async function saveChatMessage(data: Omit<InsertChatMessage, 'id'>) {
  const db = await getDb();
  await db.insert(chatMessages).values(data);
}

export async function getChatHistory(userId: number, limit: number = 50) {
  const db = await getDb();
  const result = await db.select().from(chatMessages).where(eq(chatMessages.userId, userId)).orderBy(desc(chatMessages.createdAt)).limit(limit);
  return result.reverse(); // Return in chronological order
}

// ---- User Management Functions ----

export async function getAllUsers() {
  const db = await getDb();
  return db.select().from(users).orderBy(desc(users.createdAt));
}

export async function updateUserRole(userId: number, role: string) {
  const db = await getDb();
  await db.update(users).set({ role: role as any }).where(eq(users.id, userId));
  return { success: true };
}

export async function linkUserToEmployee(userId: number, employeeId: number) {
  const db = await getDb();
  await db.update(employees).set({ userId }).where(eq(employees.id, employeeId));
  return { success: true };
}


// ---- Comments / Issues ----
export async function createComment(data: { userId: number; title?: string; content: string; type?: string; priority?: string }) {
  const db = await getDb();
  await db.insert(comments).values(data as any);
  return { success: true };
}

export async function getAllComments() {
  const db = await getDb();
  const rows = await db
    .select({
      id: comments.id,
      userId: comments.userId,
      title: comments.title,
      content: comments.content,
      type: comments.type,
      priority: comments.priority,
      status: comments.status,
      resolvedById: comments.resolvedById,
      resolvedAt: comments.resolvedAt,
      createdAt: comments.createdAt,
      userName: users.name,
    })
    .from(comments)
    .leftJoin(users, eq(comments.userId, users.id))
    .orderBy(desc(comments.createdAt));

  // Also get resolvedByName
  const result = [];
  for (const row of rows) {
    let resolvedByName = null;
    if (row.resolvedById) {
      const resolver = await db.select({ name: users.name }).from(users).where(eq(users.id, row.resolvedById)).limit(1);
      resolvedByName = resolver[0]?.name || null;
    }
    result.push({ ...row, resolvedByName });
  }
  return result;
}

export async function updateCommentStatus(id: number, status: string, resolvedById?: number) {
  const db = await getDb();
  const updateData: any = { status };
  if (status === 'resolved' && resolvedById) {
    updateData.resolvedById = resolvedById;
    updateData.resolvedAt = new Date();
  }
  await db.update(comments).set(updateData).where(eq(comments.id, id));
  return { success: true };
}

// ---- Activity Log (all entries) ----
export async function getAllActivityLogs(limit: number = 200) {
  const db = await getDb();
  const rows = await db
    .select({
      id: activityLog.id,
      employeeId: activityLog.employeeId,
      taskId: activityLog.taskId,
      action: activityLog.action,
      details: activityLog.details,
      trelloCardId: activityLog.trelloCardId,
      fromStatus: activityLog.fromStatus,
      toStatus: activityLog.toStatus,
      timestamp: activityLog.timestamp,
      employeeName: employees.name,
    })
    .from(activityLog)
    .leftJoin(employees, eq(activityLog.employeeId, employees.id))
    .orderBy(desc(activityLog.timestamp))
    .limit(limit);

  // Enrich with task title
  const result = [];
  for (const row of rows) {
    let taskTitle = null;
    if (row.taskId) {
      const task = await db.select({ title: tasks.title }).from(tasks).where(eq(tasks.id, row.taskId)).limit(1);
      taskTitle = task[0]?.title || null;
    }
    result.push({ ...row, taskTitle });
  }
  return result;
}
