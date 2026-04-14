import { useMemo } from "react";
import { useLocation } from "wouter";
import {
  AlertCircle,
  ArrowRight,
  BellRing,
  Briefcase,
  Building2,
  CheckCircle2,
  Clock,
  FileText,
  LayoutDashboard,
  ListChecks,
  Loader2,
  ShieldAlert,
  UserCircle2,
  Users,
  Wrench,
} from "lucide-react";
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { toast } from "sonner";

import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

const ROLE_HIERARCHY: Record<string, number> = {
  super_admin: 7,
  admin: 6,
  ceo: 5,
  cmo: 4,
  director: 3,
  team_leader: 2,
  employee: 1,
};

const TASK_STATUS_COLORS: Record<string, string> = {
  todo: "#f59e0b",
  in_progress: "#3b82f6",
  review: "#a855f7",
  done: "#22c55e",
};

function getRoleLevel(role?: string) {
  if (!role) return 0;
  return ROLE_HIERARCHY[role] ?? 0;
}

function getTodayString() {
  return new Date().toISOString().split("T")[0];
}

function getWeekStartString() {
  const today = new Date();
  const day = today.getDay();
  const diff = day === 0 ? 6 : day - 1;
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - diff);
  return weekStart.toISOString().split("T")[0];
}

function formatStatusLabel(status?: string | null) {
  switch (status) {
    case "in_progress":
      return "In Progress";
    case "todo":
      return "To Do";
    case "review":
      return "Review";
    case "done":
      return "Done";
    default:
      return status || "Unknown";
  }
}

function getStatusBadgeClass(status?: string | null) {
  switch (status) {
    case "done":
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
    case "review":
      return "border-purple-500/30 bg-purple-500/10 text-purple-300";
    case "in_progress":
      return "border-blue-500/30 bg-blue-500/10 text-blue-300";
    case "todo":
    default:
      return "border-amber-500/30 bg-amber-500/10 text-amber-300";
  }
}

function getSeverityBadgeClass(severity?: string | null) {
  switch (severity) {
    case "critical":
      return "border-red-500/30 bg-red-500/10 text-red-300";
    case "warning":
      return "border-amber-500/30 bg-amber-500/10 text-amber-300";
    case "info":
    default:
      return "border-blue-500/30 bg-blue-500/10 text-blue-300";
  }
}

function formatDateTime(value?: string | null) {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString();
}

function formatHours(value: unknown) {
  const parsed = Number(value ?? 0);
  if (Number.isNaN(parsed)) return "0.00";
  return parsed.toFixed(2);
}

function percentage(done: number, total: number) {
  if (!total) return 0;
  return Math.round((done / total) * 100);
}

function getNextTaskStatus(status?: string | null) {
  switch (status) {
    case "todo":
      return "in_progress";
    case "in_progress":
      return "review";
    case "review":
      return "done";
    case "done":
    default:
      return null;
  }
}

function getEmployeeNameFromTask(task: any) {
  return (
    task.employeeName ||
    task.employee?.name ||
    task.assigneeName ||
    task.assignedToName ||
    task.employee?.fullName ||
    "Unassigned"
  );
}

function DashboardShell({ children }: { children: React.ReactNode }) {
  return <div className="space-y-6">{children}</div>;
}

function SectionHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

function ManagementDashboard() {
  const [, setLocation] = useLocation();
  const today = getTodayString();

  const overviewQuery = trpc.analytics.overview.useQuery();
  const alertsQuery = trpc.alerts.list.useQuery({ isRead: false });
  const tasksTodayQuery = trpc.tasks.listByDate.useQuery({ date: today });
  const clientsQuery = trpc.clients.list.useQuery({});

  const overview = overviewQuery.data;
  const unreadAlerts = useMemo(() => {
    const alerts = Array.isArray(alertsQuery.data) ? alertsQuery.data : [];
    return [...alerts].slice(0, 5);
  }, [alertsQuery.data]);

  const pieData = useMemo(() => {
    const byStatus = overview?.tasksByStatus;
    return [
      { name: "To Do", value: Number(byStatus?.todo ?? 0), key: "todo" },
      { name: "In Progress", value: Number(byStatus?.in_progress ?? 0), key: "in_progress" },
      { name: "Review", value: Number(byStatus?.review ?? 0), key: "review" },
      { name: "Done", value: Number(byStatus?.done ?? 0), key: "done" },
    ];
  }, [overview]);

  const totalTasksToday = pieData.reduce((sum, item) => sum + item.value, 0);
  const completedTasksToday = Number(overview?.tasksByStatus?.done ?? 0);

  const teamActivity = useMemo(() => {
    const tasks = Array.isArray(tasksTodayQuery.data) ? tasksTodayQuery.data : [];
    const grouped = new Map<
      string,
      {
        employeeName: string;
        total: number;
        done: number;
        inProgress: number;
      }
    >();

    tasks.forEach((task: any) => {
      const employeeName = getEmployeeNameFromTask(task);
      const current = grouped.get(employeeName) ?? {
        employeeName,
        total: 0,
        done: 0,
        inProgress: 0,
      };

      current.total += 1;
      if (task.status === "done") current.done += 1;
      if (task.status === "in_progress") current.inProgress += 1;
      grouped.set(employeeName, current);
    });

    return Array.from(grouped.values())
      .sort((a, b) => b.total - a.total || b.done - a.done)
      .slice(0, 10)
      .map((item) => ({
        ...item,
        completionRate: percentage(item.done, item.total),
      }));
  }, [tasksTodayQuery.data]);

  const clientSummary = useMemo(() => {
    const clients = Array.isArray(clientsQuery.data) ? clientsQuery.data : [];
    const activeCount = clients.filter((client: any) => client.isActive).length;
    const inactiveCount = clients.length - activeCount;
    const topClients = clients.slice(0, 5);

    return {
      activeCount,
      inactiveCount,
      topClients,
    };
  }, [clientsQuery.data]);

  const quickActions = [
    { label: "View Employees", href: "/employees", icon: Users },
    { label: "View Clients", href: "/clients", icon: Building2 },
    { label: "Daily Reports", href: "/reports", icon: FileText },
    { label: "Analytics", href: "/analytics", icon: LayoutDashboard },
    { label: "Manage Issues", href: "/issues", icon: Wrench },
  ];

  return (
    <DashboardShell>
      <div className="rounded-2xl border border-border bg-card/70 p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-yellow-500/20 bg-yellow-500/10 px-3 py-1 text-xs font-medium text-yellow-200">
              <LayoutDashboard className="h-3.5 w-3.5" />
              Management Dashboard
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Team performance at a glance</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Monitor tasks, productivity, alerts, and client activity for today.
            </p>
          </div>

          {alertsQuery.isLoading ? (
            <Skeleton className="h-12 w-44" />
          ) : (
            <Button variant="outline" onClick={() => setLocation("/alerts")}>
              <BellRing className="mr-2 h-4 w-4" />
              {unreadAlerts.length} Unread Alerts
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="border-border bg-card/70 shadow-sm">
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <Users className="h-4 w-4 text-yellow-300" />
              Total Employees
            </CardDescription>
            {overviewQuery.isLoading ? <Skeleton className="h-10 w-20" /> : <CardTitle className="text-3xl">{overview?.totalEmployees ?? 0}</CardTitle>}
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">All active and inactive employee records.</p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card/70 shadow-sm">
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <ListChecks className="h-4 w-4 text-blue-300" />
              Tasks Today
            </CardDescription>
            {overviewQuery.isLoading ? <Skeleton className="h-10 w-24" /> : <CardTitle className="text-3xl">{totalTasksToday}</CardTitle>}
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {overviewQuery.isLoading ? "Loading today’s tasks..." : `${completedTasksToday} done / ${totalTasksToday} total`}
            </p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card/70 shadow-sm">
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-emerald-300" />
              Hours Logged Today
            </CardDescription>
            {overviewQuery.isLoading ? <Skeleton className="h-10 w-24" /> : <CardTitle className="text-3xl">{formatHours(overview?.hoursToday)}</CardTitle>}
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Tracked actual hours across the team today.</p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card/70 shadow-sm">
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-purple-300" />
              Reports Submitted Today
            </CardDescription>
            {overviewQuery.isLoading ? <Skeleton className="h-10 w-24" /> : <CardTitle className="text-3xl">{overview?.reportsToday ?? 0}</CardTitle>}
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Daily reports submitted by the team.</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="border-border bg-card/70 shadow-sm">
          <CardHeader>
            <CardTitle>Tasks Status Chart</CardTitle>
            <CardDescription>Distribution of today’s tasks by current status.</CardDescription>
          </CardHeader>
          <CardContent>
            {overviewQuery.isLoading ? (
              <div className="flex h-[320px] items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : totalTasksToday === 0 ? (
              <div className="flex h-[320px] items-center justify-center rounded-xl border border-dashed border-border bg-background/20 text-sm text-muted-foreground">
                No tasks found for today.
              </div>
            ) : (
              <div className="h-[320px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={75}
                      outerRadius={110}
                      paddingAngle={3}
                    >
                      {pieData.map((entry) => (
                        <Cell key={entry.key} fill={TASK_STATUS_COLORS[entry.key]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#111827",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: 12,
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border bg-card/70 shadow-sm">
          <CardHeader>
            <SectionHeader
              title="Recent Alerts"
              description="Last 5 unread alerts that may need attention."
              action={
                <Button variant="ghost" size="sm" onClick={() => setLocation("/alerts")}>
                  View All
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              }
            />
          </CardHeader>
          <CardContent className="space-y-3">
            {alertsQuery.isLoading ? (
              Array.from({ length: 5 }).map((_, index) => <Skeleton key={index} className="h-20 w-full rounded-xl" />)
            ) : unreadAlerts.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-background/20 p-6 text-center text-sm text-muted-foreground">
                No unread alerts right now.
              </div>
            ) : (
              unreadAlerts.map((alert: any) => (
                <div key={alert.id} className="rounded-xl border border-border bg-background/30 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{alert.title}</p>
                        <Badge className={getSeverityBadgeClass(alert.severity)}>{alert.severity || "info"}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{alert.message}</p>
                    </div>
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground">{formatDateTime(alert.createdAt)}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="border-border bg-card/70 shadow-sm">
          <CardHeader>
            <SectionHeader
              title="Today’s Team Activity"
              description="Top employees by task volume and completion progress."
              action={
                <Button variant="ghost" size="sm" onClick={() => setLocation("/reports")}>
                  View All
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              }
            />
          </CardHeader>
          <CardContent className="space-y-4">
            {tasksTodayQuery.isLoading ? (
              Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="h-16 w-full rounded-xl" />)
            ) : teamActivity.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-background/20 p-6 text-center text-sm text-muted-foreground">
                No team activity recorded for today yet.
              </div>
            ) : (
              teamActivity.map((member) => (
                <div key={member.employeeName} className="space-y-2 rounded-xl border border-border bg-background/30 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium">{member.employeeName}</p>
                      <p className="text-xs text-muted-foreground">
                        {member.done} done / {member.total} tasks
                      </p>
                    </div>
                    <Badge variant="outline">{member.completionRate}%</Badge>
                  </div>
                  <Progress value={member.completionRate} className="h-2" />
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="border-border bg-card/70 shadow-sm">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Jump straight into the most common management areas.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Button
                  key={action.href}
                  variant="outline"
                  className="h-auto justify-start rounded-xl border-border bg-background/30 px-4 py-4 text-left transition-all hover:border-yellow-500/30 hover:bg-yellow-500/5"
                  onClick={() => setLocation(action.href)}
                >
                  <Icon className="mr-3 h-4 w-4 text-yellow-300" />
                  {action.label}
                </Button>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <Card className="border-border bg-card/70 shadow-sm">
        <CardHeader>
          <CardTitle>Client Overview</CardTitle>
          <CardDescription>High-level snapshot of client activity and service coverage.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {clientsQuery.isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className="h-32 w-full rounded-xl" />
              ))}
            </div>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                  <p className="text-sm text-muted-foreground">Active Clients</p>
                  <p className="mt-2 text-3xl font-bold text-emerald-300">{clientSummary.activeCount}</p>
                </div>
                <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
                  <p className="text-sm text-muted-foreground">Inactive Clients</p>
                  <p className="mt-2 text-3xl font-bold text-red-300">{clientSummary.inactiveCount}</p>
                </div>
              </div>

              {clientSummary.topClients.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border bg-background/20 p-6 text-center text-sm text-muted-foreground">
                  No clients available yet.
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                  {clientSummary.topClients.map((client: any) => (
                    <div key={client.id} className="rounded-xl border border-border bg-background/30 p-4">
                      <div className="mb-3 flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium">{client.name}</p>
                          <p className="text-xs text-muted-foreground">{client.industry || "No industry"}</p>
                        </div>
                        <Badge className={client.isActive ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" : "border-red-500/30 bg-red-500/10 text-red-300"}>
                          {client.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {Array.isArray(client.services) && client.services.length > 0 ? (
                          client.services.slice(0, 3).map((service: string, index: number) => (
                            <Badge key={`${client.id}-${service}-${index}`} variant="outline">
                              {service}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground">No services listed</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </DashboardShell>
  );
}

function EmployeeDashboard() {
  const today = getTodayString();
  const weekStart = getWeekStartString();
  const [, setLocation] = useLocation();

  const myEmployeeQuery = trpc.employees.getMe.useQuery();
  const myEmployee = myEmployeeQuery.data;

  const myTasksQuery = trpc.tasks.listByEmployee.useQuery(
    {
      employeeId: myEmployee?.id ?? 0,
      date: today,
    },
    { enabled: Boolean(myEmployee?.id) }
  );

  const myWeeklyStatsQuery = trpc.tasks.stats.useQuery(
    {
      employeeId: myEmployee?.id ?? 0,
      startDate: weekStart,
      endDate: today,
    },
    { enabled: Boolean(myEmployee?.id) }
  );

  const myReportsQuery = trpc.reports.byEmployee.useQuery(
    {
      employeeId: myEmployee?.id ?? 0,
      startDate: weekStart,
      endDate: today,
    },
    { enabled: Boolean(myEmployee?.id) }
  );

  const alertsQuery = trpc.alerts.list.useQuery({ isRead: false });
  const utils = trpc.useUtils();

  const updateTaskStatusMutation = trpc.tasks.updateStatus.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.tasks.listByEmployee.invalidate({ employeeId: myEmployee?.id ?? 0, date: today }),
        utils.tasks.stats.invalidate({ employeeId: myEmployee?.id ?? 0, startDate: weekStart, endDate: today }),
      ]);
      toast.success("Task status updated successfully.");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update task status.");
    },
  });

  const myTasks = useMemo(() => {
    return Array.isArray(myTasksQuery.data) ? myTasksQuery.data : [];
  }, [myTasksQuery.data]);

  const recentAlerts = useMemo(() => {
    const alerts = Array.isArray(alertsQuery.data) ? alertsQuery.data : [];
    return alerts.slice(0, 3);
  }, [alertsQuery.data]);

  const tasksTodayCount = myTasks.length;
  const hoursToday = myTasks.reduce((sum: number, task: any) => sum + Number(task.actualHours ?? 0), 0);
  const reportsThisWeek = Array.isArray(myReportsQuery.data) ? myReportsQuery.data.length : 0;

  const weeklyStats = myWeeklyStatsQuery.data as any;
  const weeklyTotalTasks = Number(weeklyStats?.totalTasks ?? 0);
  const weeklyHours = Number(weeklyStats?.totalActualHours ?? 0);
  const weeklyDone = Number(weeklyStats?.tasksByStatus?.done ?? 0);
  const weeklyCompletionRate = percentage(weeklyDone, weeklyTotalTasks);

  const handleAdvanceTask = (task: any) => {
    const nextStatus = getNextTaskStatus(task.status);

    if (!nextStatus) {
      toast.info("This task is already marked as done.");
      return;
    }

    updateTaskStatusMutation.mutate({
      id: task.id,
      status: nextStatus,
    });
  };

  return (
    <DashboardShell>
      <Card className="border-border bg-card/70 shadow-sm">
        <CardHeader>
          <CardTitle className="text-2xl">
            {myEmployeeQuery.isLoading ? "Welcome back" : `Welcome back, ${myEmployee?.name || "there"}`}
          </CardTitle>
          <CardDescription>
            {myEmployeeQuery.isLoading
              ? "Loading your profile..."
              : `${myEmployee?.departmentName || "Department"} • ${myEmployee?.position || "Employee"}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {myEmployeeQuery.isLoading ? (
            <div className="grid gap-4 md:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-24 w-full rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-border bg-background/30 p-4">
                <p className="text-sm text-muted-foreground">My Tasks Today</p>
                <p className="mt-2 text-3xl font-bold">{tasksTodayCount}</p>
              </div>
              <div className="rounded-xl border border-border bg-background/30 p-4">
                <p className="text-sm text-muted-foreground">My Hours Today</p>
                <p className="mt-2 text-3xl font-bold text-blue-300">{formatHours(hoursToday)}</p>
              </div>
              <div className="rounded-xl border border-border bg-background/30 p-4">
                <p className="text-sm text-muted-foreground">My Reports This Week</p>
                <p className="mt-2 text-3xl font-bold text-emerald-300">{reportsThisWeek}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-border bg-card/70 shadow-sm">
        <CardHeader>
          <CardTitle>My Tasks Today</CardTitle>
          <CardDescription>Keep your daily work moving forward with quick status updates.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {myTasksQuery.isLoading ? (
            Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-28 w-full rounded-xl" />)
          ) : myTasks.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-background/20 p-8 text-center text-sm text-muted-foreground">
              You have no tasks assigned for today.
            </div>
          ) : (
            myTasks.map((task: any) => {
              const nextStatus = getNextTaskStatus(task.status);

              return (
                <div key={task.id} className="rounded-xl border border-border bg-background/30 p-4">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium">{task.title}</p>
                        <Badge className={getStatusBadgeClass(task.status)}>{formatStatusLabel(task.status)}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{task.description || "No description provided."}</p>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <Briefcase className="h-3.5 w-3.5" />
                          {task.clientName || "No client"}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          Estimated: {formatHours(task.estimatedHours)}h
                        </span>
                      </div>
                    </div>

                    <Button
                      variant={nextStatus ? "default" : "outline"}
                      disabled={!nextStatus || updateTaskStatusMutation.isPending}
                      onClick={() => handleAdvanceTask(task)}
                    >
                      {updateTaskStatusMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Updating...
                        </>
                      ) : nextStatus ? (
                        <>
                          Move to {formatStatusLabel(nextStatus)}
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Completed
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <Card className="border-border bg-card/70 shadow-sm">
          <CardHeader>
            <CardTitle>My Weekly Summary</CardTitle>
            <CardDescription>From {weekStart} to {today}</CardDescription>
          </CardHeader>
          <CardContent>
            {myWeeklyStatsQuery.isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-24 w-full rounded-xl" />
                <Skeleton className="h-24 w-full rounded-xl" />
              </div>
            ) : (
              <div className="space-y-5">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-xl border border-border bg-background/30 p-4">
                    <p className="text-sm text-muted-foreground">Total Tasks</p>
                    <p className="mt-2 text-3xl font-bold">{weeklyTotalTasks}</p>
                  </div>
                  <div className="rounded-xl border border-border bg-background/30 p-4">
                    <p className="text-sm text-muted-foreground">Hours This Week</p>
                    <p className="mt-2 text-3xl font-bold text-blue-300">{formatHours(weeklyHours)}</p>
                  </div>
                  <div className="rounded-xl border border-border bg-background/30 p-4">
                    <p className="text-sm text-muted-foreground">Completion Rate</p>
                    <p className="mt-2 text-3xl font-bold text-emerald-300">{weeklyCompletionRate}%</p>
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-background/30 p-4">
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Weekly Progress</span>
                    <span className="font-medium">{weeklyDone} of {weeklyTotalTasks} done</span>
                  </div>
                  <Progress value={weeklyCompletionRate} className="h-3" />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border bg-card/70 shadow-sm">
          <CardHeader>
            <SectionHeader
              title="My Recent Alerts"
              description="Last 3 unread alerts for your attention."
              action={
                <Button variant="ghost" size="sm" onClick={() => setLocation("/alerts")}>
                  View All
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              }
            />
          </CardHeader>
          <CardContent className="space-y-3">
            {alertsQuery.isLoading ? (
              Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-20 w-full rounded-xl" />)
            ) : recentAlerts.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-background/20 p-6 text-center text-sm text-muted-foreground">
                No unread alerts. You’re all caught up.
              </div>
            ) : (
              recentAlerts.map((alert: any) => (
                <div key={alert.id} className="rounded-xl border border-border bg-background/30 p-4">
                  <div className="flex items-start gap-3">
                    {alert.severity === "critical" ? (
                      <ShieldAlert className="mt-0.5 h-4 w-4 text-red-300" />
                    ) : alert.severity === "warning" ? (
                      <AlertCircle className="mt-0.5 h-4 w-4 text-amber-300" />
                    ) : (
                      <BellRing className="mt-0.5 h-4 w-4 text-blue-300" />
                    )}
                    <div>
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <p className="font-medium">{alert.title}</p>
                        <Badge className={getSeverityBadgeClass(alert.severity)}>{alert.severity || "info"}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{alert.message}</p>
                      <p className="mt-2 text-xs text-muted-foreground">{formatDateTime(alert.createdAt)}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}

export default function Home() {
  const { user } = useAuth();
  const roleLevel = getRoleLevel(user?.role);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Home</h1>
          <p className="text-sm text-muted-foreground">
            {roleLevel >= 2 ? "Operational overview for today" : "Your daily workspace overview"}
          </p>
        </div>

        <div className="inline-flex items-center gap-2 rounded-full border border-yellow-500/20 bg-yellow-500/10 px-3 py-1 text-xs font-medium text-yellow-200">
          <UserCircle2 className="h-3.5 w-3.5" />
          {user?.role?.replaceAll("_", " ") || "User"}
        </div>
      </div>

      <Separator />

      {roleLevel >= 2 ? <ManagementDashboard /> : <EmployeeDashboard />}
    </div>
  );
}
