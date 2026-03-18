# TOS - Tamiyouz Operating System
# COMPLETE TECHNICAL SPECIFICATIONS FOR CODE GENERATION

## PROJECT OVERVIEW

TOS (Tamiyouz Operating System) is an AI-powered Agency Operating System for Tamiyouz digital marketing agency. It replaces manual employee daily reporting (Google Sheets) with automated Trello-based task tracking and AI-generated reports.

- **Domain**: tos.tamiyouzplaform.com  
- **Slogan**: "التميز ليس مهارة بل موقف" (Excellence is not a skill but an attitude)  
- **Stack**: React 19 + Tailwind CSS 4 + Express 4 + tRPC 11 + Drizzle ORM + MySQL (TiDB)  
- **Auth**: Manus OAuth (already wired in template)  
- **LLM**: Built-in `invokeLLM` helper (server/_core/llm.ts) — OpenAI-compatible  
- **Storage**: S3 via `storagePut`/`storageGet` helpers (server/storage.ts)  

---

## EXISTING TEMPLATE FILES (DO NOT RECREATE — EXTEND ONLY)

These files already exist in the project and must be extended, not replaced:

| File | What it does |
|------|-------------|
| `drizzle/schema.ts` | Has `users` table with id, openId, name, email, loginMethod, role (enum user/admin), timestamps |
| `server/db.ts` | Has `getDb()`, `upsertUser()`, `getUserByOpenId()` |
| `server/routers.ts` | Has `appRouter` with `system` and `auth` routers |
| `server/_core/trpc.ts` | Has `publicProcedure`, `protectedProcedure`, `adminProcedure` |
| `server/_core/llm.ts` | Has `invokeLLM({ messages })` — returns `InvokeResult` |
| `server/_core/env.ts` | Has ENV object with forgeApiUrl, forgeApiKey, etc. |
| `server/_core/notification.ts` | Has `notifyOwner({ title, content })` |
| `server/storage.ts` | Has `storagePut(key, data, contentType)` and `storageGet(key)` |
| `client/src/App.tsx` | Has Router with Switch/Route, ThemeProvider, Toaster |
| `client/src/pages/Home.tsx` | Landing/dashboard page |
| `client/src/components/DashboardLayout.tsx` | Sidebar layout with auth check |
| `client/src/components/AIChatBox.tsx` | Reference chat UI component |
| `client/src/_core/hooks/useAuth.ts` | Has `useAuth()` returning user, loading, logout, isAuthenticated |
| `client/src/lib/trpc.ts` | Has `trpc` client |
| `client/src/lib/utils.ts` | Has `cn()` utility |
| `client/src/index.css` | Tailwind 4 theme with CSS variables in OKLCH |
| `client/index.html` | HTML shell (add Google Fonts here) |
| `shared/const.ts` | Has COOKIE_NAME, error messages |

### Available shadcn/ui components (import from @/components/ui/*):
accordion, alert, alert-dialog, avatar, badge, breadcrumb, button, button-group, calendar, card, carousel, chart, checkbox, collapsible, command, context-menu, dialog, drawer, dropdown-menu, empty, field, form, hover-card, input, input-group, input-otp, item, kbd, label, menubar, navigation-menu, pagination, popover, progress, radio-group, resizable, scroll-area, select, separator, sheet, sidebar, skeleton, slider, sonner, spinner, switch, table, tabs, textarea, toggle, toggle-group, tooltip

### Available libraries already installed:
react, wouter (routing), recharts (charts), framer-motion (animations), lucide-react (icons), date-fns, zod, react-hook-form, sonner (toasts), streamdown (markdown rendering), cmdk (command palette)

---

## 1. DATABASE SCHEMA

### MODIFY: users table — extend role enum
Change the role enum from `['user', 'admin']` to:
`['employee', 'team_leader', 'director', 'cmo', 'ceo', 'admin', 'super_admin']`

Default should be `'employee'`.

### NEW TABLE: departments
```
departments:
  id          INT AUTO_INCREMENT PRIMARY KEY
  name        VARCHAR(100) NOT NULL        -- e.g. "SEO", "Design", "Social Media", "Media Buying"
  nameAr      VARCHAR(100)                 -- Arabic name e.g. "تحسين محركات البحث"
  description TEXT
  createdAt   TIMESTAMP DEFAULT NOW()
  updatedAt   TIMESTAMP DEFAULT NOW() ON UPDATE
```

### NEW TABLE: employees
```
employees:
  id              INT AUTO_INCREMENT PRIMARY KEY
  userId          INT NULL                  -- FK to users.id (linked when user logs in)
  name            VARCHAR(255) NOT NULL
  nameAr          VARCHAR(255)              -- Arabic name
  email           VARCHAR(320)
  phone           VARCHAR(50)
  departmentId    INT NOT NULL              -- FK to departments.id
  position        VARCHAR(100)              -- job title
  trelloBoardId   VARCHAR(255)              -- Trello board ID for this employee
  trelloBoardUrl  VARCHAR(500)
  isActive        BOOLEAN DEFAULT TRUE
  createdAt       TIMESTAMP DEFAULT NOW()
  updatedAt       TIMESTAMP DEFAULT NOW() ON UPDATE
```

### NEW TABLE: clients
```
clients:
  id            INT AUTO_INCREMENT PRIMARY KEY
  name          VARCHAR(255) NOT NULL
  nameAr        VARCHAR(255)
  contactEmail  VARCHAR(320)
  contactPhone  VARCHAR(50)
  industry      VARCHAR(100)
  isActive      BOOLEAN DEFAULT TRUE
  createdAt     TIMESTAMP DEFAULT NOW()
  updatedAt     TIMESTAMP DEFAULT NOW() ON UPDATE
```

### NEW TABLE: tasks
```
tasks:
  id              INT AUTO_INCREMENT PRIMARY KEY
  employeeId      INT NOT NULL              -- FK to employees.id
  clientId        INT NULL                  -- FK to clients.id
  trelloCardId    VARCHAR(255)
  trelloCardUrl   VARCHAR(500)
  title           VARCHAR(500) NOT NULL
  description     TEXT
  status          ENUM('todo','in_progress','review','done') DEFAULT 'todo'
  startedAt       TIMESTAMP NULL
  completedAt     TIMESTAMP NULL
  estimatedHours  DECIMAL(5,2) NULL
  actualHours     DECIMAL(5,2) NULL
  date            DATE NOT NULL             -- which day this task belongs to
  createdAt       TIMESTAMP DEFAULT NOW()
  updatedAt       TIMESTAMP DEFAULT NOW() ON UPDATE
```

### NEW TABLE: daily_reports
```
daily_reports:
  id              INT AUTO_INCREMENT PRIMARY KEY
  employeeId      INT NOT NULL              -- FK to employees.id
  date            DATE NOT NULL
  totalHours      DECIMAL(5,2) DEFAULT 0
  tasksCompleted  INT DEFAULT 0
  tasksInProgress INT DEFAULT 0
  summary         TEXT                      -- AI-generated summary
  status          ENUM('draft','generated','approved') DEFAULT 'draft'
  generatedAt     TIMESTAMP NULL
  approvedBy      INT NULL                  -- FK to users.id
  approvedAt      TIMESTAMP NULL
  s3ReportUrl     VARCHAR(500)              -- stored PDF/Excel URL in S3
  createdAt       TIMESTAMP DEFAULT NOW()
  updatedAt       TIMESTAMP DEFAULT NOW() ON UPDATE
```

### NEW TABLE: trello_settings
```
trello_settings:
  id          INT AUTO_INCREMENT PRIMARY KEY
  apiKey      VARCHAR(255) NOT NULL
  apiToken    TEXT NOT NULL
  isActive    BOOLEAN DEFAULT TRUE
  lastSyncAt  TIMESTAMP NULL
  createdAt   TIMESTAMP DEFAULT NOW()
  updatedAt   TIMESTAMP DEFAULT NOW() ON UPDATE
```

### NEW TABLE: activity_log
```
activity_log:
  id            INT AUTO_INCREMENT PRIMARY KEY
  employeeId    INT NOT NULL                -- FK to employees.id
  taskId        INT NULL                    -- FK to tasks.id
  action        VARCHAR(100)                -- 'card_moved', 'card_created', 'card_completed'
  details       TEXT                        -- JSON string
  trelloCardId  VARCHAR(255)
  fromStatus    VARCHAR(50)
  toStatus      VARCHAR(50)
  timestamp     TIMESTAMP DEFAULT NOW()
```

### NEW TABLE: alerts
```
alerts:
  id          INT AUTO_INCREMENT PRIMARY KEY
  employeeId  INT NULL                      -- FK to employees.id
  type        ENUM('deadline_missed','overdue_task','low_productivity','system') DEFAULT 'system'
  title       VARCHAR(255) NOT NULL
  message     TEXT
  isRead      BOOLEAN DEFAULT FALSE
  severity    ENUM('info','warning','critical') DEFAULT 'info'
  targetRole  VARCHAR(50)                   -- which role should see this alert
  createdAt   TIMESTAMP DEFAULT NOW()
```

### NEW TABLE: chat_messages (for AI Chat history per session)
```
chat_messages:
  id          INT AUTO_INCREMENT PRIMARY KEY
  userId      INT NOT NULL                  -- FK to users.id
  role        ENUM('user','assistant') NOT NULL
  content     TEXT NOT NULL
  createdAt   TIMESTAMP DEFAULT NOW()
```

---

## 2. BACKEND — DATABASE HELPERS (server/db.ts)

Add ALL of these functions to the existing server/db.ts file (keep existing functions):

### Department functions:
- `getAllDepartments()` — SELECT * FROM departments ORDER BY name
- `getDepartmentById(id: number)` — SELECT by id
- `createDepartment(data: { name, nameAr?, description? })` — INSERT
- `updateDepartment(id: number, data)` — UPDATE
- `deleteDepartment(id: number)` — DELETE

### Employee functions:
- `getAllEmployees()` — SELECT with JOIN departments, ordered by name
- `getEmployeeById(id: number)` — SELECT with JOIN departments
- `getEmployeesByDepartment(departmentId: number)` — filtered list
- `getEmployeeByUserId(userId: number)` — find employee linked to user
- `createEmployee(data)` — INSERT
- `updateEmployee(id, data)` — UPDATE
- `deleteEmployee(id)` — UPDATE isActive=false (soft delete)
- `linkEmployeeToUser(employeeId, userId)` — UPDATE userId field

### Client functions:
- `getAllClients()` — SELECT active clients
- `getClientById(id)` — SELECT by id
- `createClient(data)` — INSERT
- `updateClient(id, data)` — UPDATE
- `deleteClient(id)` — soft delete

### Task functions:
- `getTasksByEmployee(employeeId, date?)` — filtered by employee and optional date
- `getTasksByDate(date)` — all tasks for a date with employee/client info
- `getTasksByDepartment(departmentId, date?)` — tasks for a department
- `createTask(data)` — INSERT
- `updateTask(id, data)` — UPDATE
- `updateTaskStatus(id, status, actualHours?)` — update status + set timestamps (startedAt when in_progress, completedAt when done)
- `getTaskStats(employeeId?, departmentId?, startDate?, endDate?)` — aggregated stats (count by status, total hours)

### Daily Report functions:
- `getDailyReport(employeeId, date)` — single report
- `getDailyReportsByDate(date)` — all reports for a date with employee info
- `getDailyReportsByEmployee(employeeId, startDate?, endDate?)` — range
- `createOrUpdateDailyReport(data)` — upsert by employeeId+date
- `approveDailyReport(id, approvedBy)` — set status=approved, approvedBy, approvedAt

### Trello Settings functions:
- `getTrelloSettings()` — get active settings
- `saveTrelloSettings(data)` — upsert
- `updateLastSync()` — update lastSyncAt

### Activity Log functions:
- `logActivity(data)` — INSERT
- `getActivityByEmployee(employeeId, limit?)` — recent activity

### Alert functions:
- `createAlert(data)` — INSERT
- `getAlerts(filters?: { targetRole?, isRead?, type? })` — filtered list
- `markAlertRead(id)` — UPDATE isRead=true
- `getUnreadAlertCount(targetRole)` — COUNT where isRead=false

### Chat Message functions:
- `saveChatMessage(data: { userId, role, content })` — INSERT
- `getChatHistory(userId, limit?)` — recent messages for user

---

## 3. BACKEND — tRPC ROUTERS (server/routers.ts)

### Custom Role Middleware
Create these in routers.ts (or a separate middleware file):

```typescript
// Helper to check role hierarchy
const ROLE_HIERARCHY = {
  super_admin: 7,
  admin: 6,
  ceo: 5,
  cmo: 4,
  director: 3,
  team_leader: 2,
  employee: 1,
};

// Middleware: requires at least team_leader level
const teamLeaderProcedure = protectedProcedure.use(({ ctx, next }) => {
  const level = ROLE_HIERARCHY[ctx.user.role] || 0;
  if (level < 2) throw new TRPCError({ code: 'FORBIDDEN' });
  return next({ ctx });
});

// Middleware: requires at least director level
const managementProcedure = protectedProcedure.use(({ ctx, next }) => {
  const level = ROLE_HIERARCHY[ctx.user.role] || 0;
  if (level < 3) throw new TRPCError({ code: 'FORBIDDEN' });
  return next({ ctx });
});

// Middleware: requires super_admin or admin
const superAdminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'super_admin' && ctx.user.role !== 'admin')
    throw new TRPCError({ code: 'FORBIDDEN' });
  return next({ ctx });
});
```

### Scope Filtering Helper
```typescript
// Returns which employees the current user can see
async function getVisibleEmployeeIds(user: User): Promise<number[] | 'all'> {
  if (['super_admin', 'admin', 'ceo'].includes(user.role)) return 'all';
  const employee = await getEmployeeByUserId(user.id);
  if (!employee) return [];
  if (user.role === 'cmo') {
    // CMO sees all departments
    return 'all';
  }
  if (user.role === 'director' || user.role === 'team_leader') {
    // See their department
    const deptEmployees = await getEmployeesByDepartment(employee.departmentId);
    return deptEmployees.map(e => e.id);
  }
  // Employee sees only self
  return [employee.id];
}
```

### Router definitions:

**departments router:**
- `list` (publicProcedure) — getAllDepartments()
- `create` (superAdminProcedure) — input: { name, nameAr?, description? }
- `update` (superAdminProcedure) — input: { id, name?, nameAr?, description? }
- `delete` (superAdminProcedure) — input: { id }

**employees router:**
- `list` (protectedProcedure) — getAllEmployees() then filter by scope
- `getById` (protectedProcedure) — check scope before returning
- `getMe` (protectedProcedure) — getEmployeeByUserId(ctx.user.id)
- `create` (superAdminProcedure) — input: { name, nameAr?, email?, phone?, departmentId, position?, trelloBoardId?, trelloBoardUrl? }
- `update` (superAdminProcedure) — input: { id, ...fields }
- `delete` (superAdminProcedure) — input: { id }
- `linkToUser` (superAdminProcedure) — input: { employeeId, userId }

**clients router:**
- `list` (protectedProcedure) — getAllClients()
- `create` (managementProcedure) — input fields
- `update` (managementProcedure) — input fields
- `delete` (superAdminProcedure) — input: { id }

**tasks router:**
- `listByEmployee` (protectedProcedure) — input: { employeeId, date? } — check scope
- `listByDate` (teamLeaderProcedure) — input: { date } — filter by scope
- `create` (teamLeaderProcedure) — input: { employeeId, clientId?, title, description?, status?, date, estimatedHours? }
- `update` (protectedProcedure) — check ownership or scope
- `updateStatus` (protectedProcedure) — input: { id, status, actualHours? }
- `stats` (protectedProcedure) — input: { employeeId?, departmentId?, startDate?, endDate? } — scope filtered

**reports router:**
- `daily` (protectedProcedure) — input: { employeeId, date } — scope check
- `dailyAll` (teamLeaderProcedure) — input: { date } — scope filtered
- `byEmployee` (protectedProcedure) — input: { employeeId, startDate?, endDate? } — scope check
- `approve` (managementProcedure) — input: { id }
- `generate` (managementProcedure) — input: { employeeId, date } — calls AI agent
- `generateAll` (managementProcedure) — input: { date } — generate for all employees

**trelloSettings router:**
- `get` (superAdminProcedure) — getTrelloSettings()
- `save` (superAdminProcedure) — input: { apiKey, apiToken }
- `testConnection` (superAdminProcedure) — try fetching boards
- `syncNow` (superAdminProcedure) — trigger full sync

**trello router:**
- `getBoards` (superAdminProcedure) — fetch boards from Trello API
- `getBoardLists` (superAdminProcedure) — input: { boardId }
- `syncEmployee` (managementProcedure) — input: { employeeId }

**alerts router:**
- `list` (protectedProcedure) — scope filtered
- `markRead` (protectedProcedure) — input: { id }
- `unreadCount` (protectedProcedure)

**analytics router:**
- `employeeStats` (protectedProcedure) — input: { employeeId, startDate?, endDate? } — scope check
- `departmentStats` (managementProcedure) — input: { departmentId?, startDate?, endDate? }
- `overview` (managementProcedure) — company-wide KPIs
- `aiAnalysis` (managementProcedure) — input: { type: 'employee'|'department'|'company', targetId?, startDate?, endDate? } — calls LLM

**aiChat router:**
- `send` (protectedProcedure) — input: { message: string } — THE AI CHAT ASSISTANT
- `history` (protectedProcedure) — input: { limit?: number } — get chat history

**userManagement router:**
- `list` (superAdminProcedure) — all users
- `updateRole` (superAdminProcedure) — input: { userId, role }
- `linkEmployee` (superAdminProcedure) — input: { userId, employeeId }

---

## 4. TRELLO INTEGRATION (server/trello.ts)

Create a `TrelloService` class:

```typescript
class TrelloService {
  private apiKey: string;
  private apiToken: string;
  
  constructor(apiKey: string, apiToken: string) { ... }
  
  // Base fetch helper
  private async trelloFetch(endpoint: string, params?: Record<string,string>): Promise<any> {
    const url = new URL(`https://api.trello.com/1${endpoint}`);
    url.searchParams.set('key', this.apiKey);
    url.searchParams.set('token', this.apiToken);
    if (params) Object.entries(params).forEach(([k,v]) => url.searchParams.set(k,v));
    const res = await fetch(url.toString());
    if (!res.ok) throw new Error(`Trello API error: ${res.status}`);
    return res.json();
  }
  
  async getBoards(): Promise<TrelloBoard[]> {
    return this.trelloFetch('/members/me/boards', { fields: 'name,url,closed' });
  }
  
  async getBoardLists(boardId: string): Promise<TrelloList[]> {
    return this.trelloFetch(`/boards/${boardId}/lists`);
  }
  
  async getCardsInBoard(boardId: string): Promise<TrelloCard[]> {
    return this.trelloFetch(`/boards/${boardId}/cards`, { 
      fields: 'name,desc,url,idList,dateLastActivity,due,labels',
      members: 'true'
    });
  }
  
  async getCardActions(cardId: string): Promise<TrelloAction[]> {
    return this.trelloFetch(`/cards/${cardId}/actions`, {
      filter: 'updateCard:idList,createCard',
      limit: '50'
    });
  }
  
  async testConnection(): Promise<boolean> {
    try {
      await this.trelloFetch('/members/me');
      return true;
    } catch { return false; }
  }
}
```

### Sync Logic (syncEmployeeBoard):
1. Get employee's trelloBoardId from DB
2. Fetch all lists in the board → map list names to statuses:
   - Lists containing "To Do" / "Backlog" → 'todo'
   - Lists containing "In Progress" / "Doing" → 'in_progress'  
   - Lists containing "Review" / "Testing" → 'review'
   - Lists containing "Done" / "Complete" → 'done'
3. Fetch all cards in the board
4. For each card:
   - Check if task exists in DB (by trelloCardId)
   - If not, create new task
   - If exists, update status based on current list
   - Fetch card actions to calculate time:
     - Find when card moved to "In Progress" list → startedAt
     - Find when card moved to "Done" list → completedAt
     - actualHours = (completedAt - startedAt) in hours
5. Log all changes to activity_log
6. Update lastSyncAt in trello_settings

### Helper function:
```typescript
async function getTrelloService(): Promise<TrelloService> {
  const settings = await getTrelloSettings();
  if (!settings) throw new Error('Trello not configured');
  return new TrelloService(settings.apiKey, settings.apiToken);
}
```

---

## 5. AI AGENT (server/ai-agent.ts)

### generateDailyReport(employeeId, date):
```typescript
async function generateDailyReport(employeeId: number, date: string) {
  // 1. Get employee info
  const employee = await getEmployeeById(employeeId);
  // 2. Get tasks for this date
  const tasks = await getTasksByEmployee(employeeId, date);
  // 3. Get activity log
  const activities = await getActivityByEmployee(employeeId, 20);
  
  // 4. Build prompt
  const prompt = `Generate a daily work report for ${employee.name} on ${date}.
  
Tasks completed today:
${tasks.filter(t => t.status === 'done').map(t => `- ${t.title} (${t.actualHours || 0}h) - Client: ${t.clientName || 'N/A'}`).join('\n')}

Tasks in progress:
${tasks.filter(t => t.status === 'in_progress').map(t => `- ${t.title}`).join('\n')}

Format the report as:
Date | Client | Task Description | Hours Spent

Also provide a brief summary of the day's work.`;

  // 5. Call LLM
  const result = await invokeLLM({
    messages: [
      { role: 'system', content: 'You are a professional work report generator for Tamiyouz digital marketing agency. Generate concise, professional daily reports. Respond in the same language as the data (Arabic names stay Arabic, English stays English).' },
      { role: 'user', content: prompt }
    ]
  });
  
  const summary = result.choices[0].message.content as string;
  
  // 6. Calculate totals
  const totalHours = tasks.reduce((sum, t) => sum + (Number(t.actualHours) || 0), 0);
  const tasksCompleted = tasks.filter(t => t.status === 'done').length;
  const tasksInProgress = tasks.filter(t => t.status === 'in_progress').length;
  
  // 7. Save report
  await createOrUpdateDailyReport({
    employeeId, date, totalHours, tasksCompleted, tasksInProgress,
    summary, status: 'generated', generatedAt: new Date()
  });
  
  return { summary, totalHours, tasksCompleted, tasksInProgress };
}
```

### analyzePerformance(params):
Uses LLM to analyze employee/department/company performance over a date range. Fetches relevant data, builds context, asks LLM for insights.

### checkDeadlines():
Queries overdue tasks, creates alerts for management.

---

## 6. AI CHAT ASSISTANT

### Backend (in aiChat router):

The `send` procedure:
```typescript
aiChat: router({
  send: protectedProcedure
    .input(z.object({ message: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const user = ctx.user;
      
      // 1. Determine user scope and fetch relevant data
      let dataContext = '';
      const employee = await getEmployeeByUserId(user.id);
      
      if (['super_admin', 'admin', 'ceo'].includes(user.role)) {
        // Full company data
        const allEmployees = await getAllEmployees();
        const todayTasks = await getTasksByDate(new Date().toISOString().split('T')[0]);
        const stats = await getTaskStats();
        dataContext = `Company Overview:
- Total employees: ${allEmployees.length}
- Tasks today: ${todayTasks.length}
- Completed: ${todayTasks.filter(t=>t.status==='done').length}
- Total hours today: ${todayTasks.reduce((s,t)=>s+(Number(t.actualHours)||0),0)}
Employee list: ${allEmployees.map(e=>`${e.name} (${e.departmentName})`).join(', ')}`;
      } else if (['cmo', 'director', 'team_leader'].includes(user.role) && employee) {
        // Department data
        const deptEmployees = await getEmployeesByDepartment(employee.departmentId);
        const deptTasks = await getTasksByDepartment(employee.departmentId);
        dataContext = `Department data:
- Team members: ${deptEmployees.map(e=>e.name).join(', ')}
- Tasks today: ${deptTasks.length}
- Completed: ${deptTasks.filter(t=>t.status==='done').length}`;
      } else if (employee) {
        // Own data only
        const myTasks = await getTasksByEmployee(employee.id);
        dataContext = `Your tasks:
${myTasks.map(t=>`- ${t.title}: ${t.status} (${t.actualHours||0}h)`).join('\n')}`;
      }
      
      // 2. Get recent chat history
      const history = await getChatHistory(user.id, 10);
      
      // 3. Build messages
      const messages = [
        { role: 'system' as const, content: `You are the TOS AI Assistant for Tamiyouz digital marketing agency ("التميز ليس مهارة بل موقف"). You help users understand their work data, reports, and performance. Answer in the same language the user asks in (Arabic or English). Be concise, helpful, and data-driven.

Current user: ${user.name} (Role: ${user.role})
${dataContext}

IMPORTANT: Only share data the user is authorized to see based on their role.` },
        ...history.map(m => ({ role: m.role as 'user'|'assistant', content: m.content })),
        { role: 'user' as const, content: input.message }
      ];
      
      // 4. Call LLM
      const result = await invokeLLM({ messages });
      const response = result.choices[0].message.content as string;
      
      // 5. Save messages
      await saveChatMessage({ userId: user.id, role: 'user', content: input.message });
      await saveChatMessage({ userId: user.id, role: 'assistant', content: response });
      
      return { response };
    }),
    
  history: protectedProcedure
    .input(z.object({ limit: z.number().optional().default(50) }))
    .query(async ({ ctx, input }) => {
      return getChatHistory(ctx.user.id, input.limit);
    }),
}),
```

### Frontend Component: AIChatSidebar

A collapsible chat panel on the right side of the dashboard:

- **Toggle button**: Fixed at bottom-right corner, purple circle with sparkle/chat icon
- **Panel**: Slides in from right, ~400px wide on desktop, full-screen on mobile
- **Header**: "TOS AI Assistant" with Tamiyouz branding, close button
- **Messages area**: Scrollable, user messages right-aligned (purple bg), AI messages left-aligned (gray bg)
- **AI responses**: Rendered with `<Streamdown>` for markdown support
- **Input**: Text input at bottom with send button
- **Loading**: Spinner/dots animation while AI is thinking
- **History**: Loads previous messages on open via `trpc.aiChat.history.useQuery()`
- **Send**: Uses `trpc.aiChat.send.useMutation()`

This component is placed INSIDE DashboardLayout so it appears on every page.

---

## 7. FRONTEND — THEMING & BRANDING

### index.html — Add Google Fonts:
```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
```

### index.css — Tamiyouz Theme (OKLCH colors):
```css
:root {
  --primary: oklch(0.49 0.27 293);           /* Tamiyouz Purple #7C3AED */
  --primary-foreground: oklch(0.98 0.01 293); /* Light on purple */
  --accent: oklch(0.79 0.17 80);              /* Gold #F59E0B */
  --accent-foreground: oklch(0.25 0.02 80);
  --sidebar: oklch(0.25 0.05 293);            /* Dark purple sidebar */
  --sidebar-foreground: oklch(0.92 0.01 293);
  --sidebar-primary: oklch(0.55 0.27 293);
  --sidebar-primary-foreground: oklch(0.98 0.01 293);
  --sidebar-accent: oklch(0.35 0.08 293);
  --sidebar-accent-foreground: oklch(0.95 0.01 293);
  /* Keep other variables similar to existing but adjust to match purple theme */
}

body {
  font-family: 'Inter', 'Cairo', sans-serif;
}

/* RTL support */
[dir="rtl"] {
  font-family: 'Cairo', 'Inter', sans-serif;
}
```

### Logo:
Use `import.meta.env.VITE_APP_LOGO` for the logo URL. Display in sidebar header.

---

## 8. FRONTEND — PAGES & ROUTING

### App.tsx Routes:
```
/                    → Dashboard (Home.tsx) — role-based content
/employees           → EmployeesPage.tsx — list/manage employees
/employees/:id       → EmployeeDetailPage.tsx — employee detail
/clients             → ClientsPage.tsx — list/manage clients
/departments         → DepartmentsPage.tsx — manage departments
/reports             → DailyReportsPage.tsx — view/generate reports
/reports/:id         → ReportDetailPage.tsx — single report detail
/analytics           → AnalyticsPage.tsx — charts and AI analysis
/my-tasks            → MyTasksPage.tsx — employee's own tasks
/my-reports          → MyReportsPage.tsx — employee's own reports
/settings/trello     → TrelloSettingsPage.tsx — admin Trello config
/settings/users      → UserManagementPage.tsx — admin user management
/alerts              → AlertsPage.tsx — notifications/alerts
```

All pages wrapped in DashboardLayout.

### DashboardLayout Modifications:
- Sidebar header: Logo + "TOS" title + slogan in small text
- Menu items change based on `user.role`:
  - super_admin/admin: ALL menu items
  - ceo/cmo: Dashboard, Employees, Reports, Analytics, Alerts
  - director/team_leader: Dashboard, My Team, Reports, Analytics, Alerts
  - employee: My Dashboard, My Tasks, My Reports
- AIChatSidebar component included at bottom-right

### Page Descriptions:

**Dashboard (Home.tsx):**
- KPI cards at top: Total Employees, Tasks Today, Hours Logged, Reports Generated
- Charts row: Tasks by Status (donut/pie), Hours by Department (bar), Weekly Trend (line)
- Recent Reports table
- Recent Alerts list
- For employee role: show personal KPIs instead

**EmployeesPage.tsx:**
- DataTable with columns: Name, Department, Role, Email, Status, Actions
- Department filter dropdown
- Search input
- Add Employee button (admin only) → opens dialog with form
- Click row → navigate to detail

**EmployeeDetailPage.tsx:**
- Info card with employee details
- Tabs: Tasks | Reports | Activity | Performance
- Tasks tab: table of tasks with date filter
- Reports tab: list of daily reports
- Performance tab: charts (hours over time, completion rate)

**ClientsPage.tsx:**
- DataTable with CRUD
- Search and filter

**DepartmentsPage.tsx:**
- Cards grid: each department shows name, employee count, team leader name
- Add/Edit department dialog

**DailyReportsPage.tsx:**
- Date picker at top
- Employee dropdown selector (filtered by role scope)
- Report table: Date | Client | Task | Hours | Status
- "Generate Report" button → calls AI
- "Approve" button (management)
- "Export" button

**AnalyticsPage.tsx:**
- Employee selector dropdown
- Date range picker
- Charts: Productivity trend, Task completion rate, Hours distribution
- "AI Analysis" button → calls LLM, shows analysis in a card with Streamdown
- Department comparison (for management)

**TrelloSettingsPage.tsx (admin only):**
- Form: API Key input, API Token input
- "Test Connection" button
- "Save" button
- "Sync Now" button
- Last sync timestamp display
- Table: Employee → Board assignment

**UserManagementPage.tsx (admin only):**
- Table of all users: Name, Email, Role, Linked Employee, Actions
- Change role dropdown
- Link to employee record button

**AlertsPage.tsx:**
- List of alerts with severity color coding (info=blue, warning=yellow, critical=red)
- Mark as read button
- Filter by type dropdown

**MyTasksPage.tsx (employee):**
- Today's tasks with status badges
- Date picker for history
- Task cards with time tracking info

**MyReportsPage.tsx (employee):**
- Calendar view of reports
- Click date → view report detail

---

## 9. IMPORTANT NOTES FOR CODE GENERATION

1. Use `import { z } from 'zod'` for all input validation in tRPC
2. Use `import { TRPCError } from '@trpc/server'` for errors
3. Use `import { eq, and, between, desc, sql, count } from 'drizzle-orm'` for queries
4. Use `import { invokeLLM } from './_core/llm'` for AI features
5. Use `import { storagePut } from './storage'` for S3 uploads
6. Frontend: use `trpc.routerName.procedureName.useQuery()` / `.useMutation()`
7. Frontend: use `useAuth()` from `@/_core/hooks/useAuth`
8. Frontend: use `cn()` from `@/lib/utils` for class merging
9. Frontend: use shadcn/ui components from `@/components/ui/*`
10. Frontend: use `lucide-react` for icons
11. Frontend: use `recharts` for charts
12. Frontend: use `date-fns` for date formatting
13. Frontend: use `sonner` toast via `import { toast } from 'sonner'`
14. Frontend: use `wouter` for routing: `import { useLocation, useRoute, Link } from 'wouter'`
15. All timestamps stored as UTC, displayed in user's local timezone
16. The `decimal` type in Drizzle for MySQL uses string representation — cast to Number when needed
17. For the Drizzle schema, use imports from `drizzle-orm/mysql-core`
