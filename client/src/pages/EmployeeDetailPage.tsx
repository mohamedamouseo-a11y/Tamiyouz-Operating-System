import { useState } from "react";
import {
  ArrowLeft,
  BarChart3,
  Briefcase,
  Building2,
  CheckCircle2,
  ClipboardList,
  Link2,
  Mail,
  Pencil,
  Phone,
  Power,
  Trash2,
  UserCircle2,
  Users,
} from "lucide-react";
import { useLocation, useParams } from "wouter";
import { toast } from "sonner";

import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import EditEmployeeDialog from "@/components/employees/EditEmployeeDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const ROLE_HIERARCHY: Record<string, number> = {
  super_admin: 7,
  admin: 6,
  ceo: 5,
  cmo: 4,
  director: 3,
  team_leader: 2,
  employee: 1,
};

function hasMinRole(role: string | undefined, minRole: keyof typeof ROLE_HIERARCHY) {
  if (!role) return false;
  return (ROLE_HIERARCHY[role] ?? 0) >= ROLE_HIERARCHY[minRole];
}

function statusBadgeClass(isActive?: boolean | null) {
  return isActive
    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
    : "border-red-500/30 bg-red-500/10 text-red-300";
}

function taskBadgeClass(status?: string | null) {
  switch (status) {
    case "done":
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
    case "review":
      return "border-amber-500/30 bg-amber-500/10 text-amber-300";
    case "in_progress":
      return "border-sky-500/30 bg-sky-500/10 text-sky-300";
    default:
      return "border-slate-500/30 bg-slate-500/10 text-slate-300";
  }
}

function reportBadgeClass(status?: string | null) {
  switch (status) {
    case "approved":
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
    case "generated":
      return "border-sky-500/30 bg-sky-500/10 text-sky-300";
    default:
      return "border-amber-500/30 bg-amber-500/10 text-amber-300";
  }
}

export default function EmployeeDetailPage() {
  const params = useParams<{ id: string }>();
  const empId = Number(params.id);
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const utils = trpc.useUtils();

  const canManageEmployee = hasMinRole(user?.role, "admin");
  const canApproveReports = hasMinRole(user?.role, "director");

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [tasksDate, setTasksDate] = useState("");
  const [performanceStartDate, setPerformanceStartDate] = useState("");
  const [performanceEndDate, setPerformanceEndDate] = useState("");

  const employeeQuery = trpc.employees.getById.useQuery({ id: empId }, { enabled: empId > 0 });
  const tasksQuery = trpc.tasks.listByEmployee.useQuery({ employeeId: empId, date: tasksDate || undefined }, { enabled: empId > 0 });
  const reportsQuery = trpc.reports.byEmployee.useQuery({ employeeId: empId }, { enabled: empId > 0 });
  const assignedClientsQuery = trpc.clientAssignments.listByEmployee.useQuery({ employeeId: empId }, { enabled: empId > 0 });
  const performanceQuery = trpc.analytics.employeePerformance.useQuery({ employeeId: empId, startDate: performanceStartDate || undefined, endDate: performanceEndDate || undefined }, { enabled: empId > 0 });

  const updateEmployeeMutation = trpc.employees.update.useMutation({
    onSuccess: async () => {
      await Promise.all([utils.employees.getById.invalidate({ id: empId }), utils.employees.list.invalidate()]);
      toast.success("Employee updated successfully.");
    },
    onError: (error) => toast.error(error.message || "Failed to update employee."),
  });

  const deleteEmployeeMutation = trpc.employees.delete.useMutation({
    onSuccess: async () => {
      await utils.employees.list.invalidate();
      toast.success("Employee deleted successfully.");
      setLocation("/employees");
    },
    onError: (error) => toast.error(error.message || "Failed to delete employee."),
  });

  const updateTaskStatusMutation = trpc.tasks.updateStatus.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.tasks.listByEmployee.invalidate({ employeeId: empId, date: tasksDate || undefined }),
        utils.analytics.employeePerformance.invalidate({ employeeId: empId, startDate: performanceStartDate || undefined, endDate: performanceEndDate || undefined }),
      ]);
      toast.success("Task status updated successfully.");
    },
    onError: (error) => toast.error(error.message || "Failed to update task status."),
  });

  const approveReportMutation = trpc.reports.approve.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.reports.byEmployee.invalidate({ employeeId: empId }),
        utils.analytics.employeePerformance.invalidate({ employeeId: empId, startDate: performanceStartDate || undefined, endDate: performanceEndDate || undefined }),
      ]);
      toast.success("Report approved successfully.");
    },
    onError: (error) => toast.error(error.message || "Failed to approve report."),
  });

  const employee = employeeQuery.data;
  const tasks = tasksQuery.data ?? [];
  const reports = reportsQuery.data ?? [];
  const assignedClients = assignedClientsQuery.data ?? [];
  const performance = performanceQuery.data;

  if (employeeQuery.isLoading) {
    return <Card className="border-border bg-card/60 p-6">Loading employee...</Card>;
  }

  if (!employee) {
    return (
      <Card className="border-border bg-card/60 p-10 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-border bg-background/60"><UserCircle2 className="h-6 w-6 text-muted-foreground" /></div>
        <h2 className="text-xl font-semibold">Employee not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">This employee may not exist or you may not have permission to view it.</p>
        <div className="mt-5"><Button variant="outline" onClick={() => setLocation("/employees")}><ArrowLeft className="mr-2 h-4 w-4" />Back to Employees</Button></div>
      </Card>
    );
  }

  const handleToggleActive = () => updateEmployeeMutation.mutate({ id: employee.id, isActive: !employee.isActive });
  const handleDelete = () => deleteEmployeeMutation.mutate({ id: employee.id });

  return (
    <div className="space-y-6">
      <Card className="border-border bg-card/60 p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full border border-yellow-500/20 bg-yellow-500/10 text-2xl font-semibold text-yellow-200">{employee.name?.slice(0, 1)?.toUpperCase() || "E"}</div>
            <div className="space-y-2">
              <Button variant="ghost" className="h-auto px-0 text-muted-foreground hover:text-foreground" onClick={() => setLocation("/employees")}><ArrowLeft className="mr-2 h-4 w-4" />Back to Employees</Button>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">{employee.name}</h1>
                <p className="text-sm text-muted-foreground">{employee.nameAr || employee.position || "Employee Profile"}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge className={statusBadgeClass(employee.isActive)}>{employee.isActive ? "Active" : "Inactive"}</Badge>
                <Badge className="border-yellow-500/30 bg-yellow-500/10 text-yellow-200">{employee.departmentName}</Badge>
                {employee.departmentWorkspaceName ? <Badge variant="outline">{employee.departmentWorkspaceName}</Badge> : null}
                {employee.position ? <Badge variant="outline">{employee.position}</Badge> : null}
              </div>
            </div>
          </div>
          {canManageEmployee ? (
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(true)}><Pencil className="mr-2 h-4 w-4" />Edit Employee</Button>
              <Button variant={employee.isActive ? "outline" : "default"} onClick={handleToggleActive} disabled={updateEmployeeMutation.isPending}><Power className="mr-2 h-4 w-4" />{employee.isActive ? "Set Inactive" : "Set Active"}</Button>
              <Button variant="destructive" onClick={() => setIsDeleteDialogOpen(true)} disabled={deleteEmployeeMutation.isPending}><Trash2 className="mr-2 h-4 w-4" />Delete Employee</Button>
            </div>
          ) : null}
        </div>
      </Card>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid h-auto w-full grid-cols-2 gap-2 rounded-xl bg-card/70 p-2 md:grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="clients">Assigned Clients</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card className="border-border bg-card/60 p-6">
            <div className="mb-4 flex items-center gap-2"><UserCircle2 className="h-5 w-5 text-yellow-300" /><h2 className="text-lg font-semibold">Employee Information</h2></div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-border bg-background/40 p-4"><p className="text-xs uppercase tracking-wide text-muted-foreground">Full Name</p><p className="mt-1 font-medium">{employee.name}</p></div>
              <div className="rounded-xl border border-border bg-background/40 p-4"><p className="text-xs uppercase tracking-wide text-muted-foreground">Arabic Name</p><p className="mt-1 font-medium">{employee.nameAr || "—"}</p></div>
              <div className="rounded-xl border border-border bg-background/40 p-4"><p className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">Email</p><div className="flex items-center gap-2 font-medium"><Mail className="h-4 w-4 text-muted-foreground" /><span>{employee.email || "—"}</span></div></div>
              <div className="rounded-xl border border-border bg-background/40 p-4"><p className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">Phone</p><div className="flex items-center gap-2 font-medium"><Phone className="h-4 w-4 text-muted-foreground" /><span>{employee.phone || "—"}</span></div></div>
              <div className="rounded-xl border border-border bg-background/40 p-4"><p className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">Department</p><div className="flex items-center gap-2 font-medium"><Building2 className="h-4 w-4 text-muted-foreground" /><span>{employee.departmentName || "—"}</span></div></div>
              <div className="rounded-xl border border-border bg-background/40 p-4"><p className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">Position</p><div className="flex items-center gap-2 font-medium"><Briefcase className="h-4 w-4 text-muted-foreground" /><span>{employee.position || "—"}</span></div></div>
              <div className="rounded-xl border border-border bg-background/40 p-4"><p className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">Workspace</p><div className="flex items-center gap-2 font-medium"><Users className="h-4 w-4 text-muted-foreground" /><span>{employee.departmentWorkspaceName || "No workspace linked"}</span></div></div>
              <div className="rounded-xl border border-border bg-background/40 p-4"><p className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">Trello Board</p>{employee.trelloBoardUrl ? <a href={employee.trelloBoardUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 font-medium text-yellow-200 hover:text-yellow-100"><Link2 className="h-4 w-4" />Open Trello Board</a> : <span className="text-sm text-muted-foreground">No Trello board linked.</span>}</div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="tasks" className="space-y-4">
          <Card className="border-border bg-card/60 p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div><div className="mb-2 flex items-center gap-2"><ClipboardList className="h-5 w-5 text-yellow-300" /><h2 className="text-lg font-semibold">Tasks</h2></div><p className="text-sm text-muted-foreground">Filter tasks by date and update their current status.</p></div>
              <div className="w-full max-w-xs space-y-2"><Label htmlFor="tasks-date-filter">Date</Label><Input id="tasks-date-filter" type="date" value={tasksDate} onChange={(e) => setTasksDate(e.target.value)} /></div>
            </div>
            <Separator className="my-5" />
            {tasks.length === 0 ? <div className="rounded-xl border border-dashed border-border bg-background/20 p-8 text-center"><p className="font-medium">No tasks found</p></div> : <div className="space-y-3">{tasks.map((task) => <div key={task.id} className="rounded-xl border border-border bg-background/40 p-4"><div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"><div className="space-y-2"><div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold">{task.title}</h3><Badge className={taskBadgeClass(task.status)}>{task.status}</Badge></div><p className="text-sm text-muted-foreground">{task.description || "No description"}</p></div><div className="min-w-[180px] space-y-2"><Label>Status</Label><select value={task.status || "todo"} onChange={(e) => updateTaskStatusMutation.mutate({ id: task.id, status: e.target.value as any })} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"><option value="todo">To Do</option><option value="in_progress">In Progress</option><option value="review">Review</option><option value="done">Done</option></select></div></div></div>)}</div>}
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card className="border-border bg-card/60 p-6">
            <div className="mb-4 flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-yellow-300" /><h2 className="text-lg font-semibold">Reports</h2></div>
            {reports.length === 0 ? <div className="rounded-xl border border-dashed border-border bg-background/20 p-8 text-center"><p className="font-medium">No reports yet</p></div> : <div className="space-y-3">{reports.map((report) => <div key={report.id} className="rounded-xl border border-border bg-background/40 p-4"><div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"><div className="space-y-1"><div className="flex items-center gap-2"><h3 className="font-semibold">{report.date}</h3><Badge className={reportBadgeClass(report.status)}>{report.status}</Badge></div><p className="text-sm text-muted-foreground">Hours: {report.totalHours || 0} • Completed: {report.tasksCompleted || 0} • In Progress: {report.tasksInProgress || 0}</p><p className="text-sm text-muted-foreground">{report.summary || "No summary"}</p></div>{canApproveReports && report.status !== "approved" ? <Button onClick={() => approveReportMutation.mutate({ id: report.id })} disabled={approveReportMutation.isPending}>Approve</Button> : null}</div></div>)}</div>}
          </Card>
        </TabsContent>

        <TabsContent value="clients" className="space-y-4">
          <Card className="border-border bg-card/60 p-6">
            <div className="mb-4 flex items-center gap-2"><Users className="h-5 w-5 text-yellow-300" /><h2 className="text-lg font-semibold">Assigned Clients</h2></div>
            {assignedClients.length === 0 ? <div className="rounded-xl border border-dashed border-border bg-background/20 p-8 text-center"><p className="font-medium">No assigned clients</p></div> : <div className="grid gap-3 md:grid-cols-2">{assignedClients.map((client) => <button key={client.id} type="button" className="rounded-xl border border-border bg-background/40 p-4 text-left transition hover:border-yellow-500/30" onClick={() => setLocation(`/clients/${client.clientId}`)}><div className="flex items-center justify-between gap-3"><h3 className="font-semibold">{client.clientName}</h3><Badge className={client.clientIsActive ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" : "border-red-500/30 bg-red-500/10 text-red-300"}>{client.clientIsActive ? "Active" : "Inactive"}</Badge></div><p className="mt-2 text-sm text-muted-foreground">{client.clientIndustry || "—"}</p></button>)}</div>}
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card className="border-border bg-card/60 p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div><div className="mb-2 flex items-center gap-2"><BarChart3 className="h-5 w-5 text-yellow-300" /><h2 className="text-lg font-semibold">Performance</h2></div><p className="text-sm text-muted-foreground">Track productivity, reporting rhythm, and client load.</p></div>
              <div className="grid gap-3 sm:grid-cols-2"><div className="space-y-2"><Label>Start Date</Label><Input type="date" value={performanceStartDate} onChange={(e) => setPerformanceStartDate(e.target.value)} /></div><div className="space-y-2"><Label>End Date</Label><Input type="date" value={performanceEndDate} onChange={(e) => setPerformanceEndDate(e.target.value)} /></div></div>
            </div>
            <Separator className="my-5" />
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <Card className="border-border bg-background/40 p-4"><p className="text-xs uppercase tracking-wide text-muted-foreground">Total Tasks</p><p className="mt-2 text-2xl font-bold">{performance?.totalTasks || 0}</p></Card>
              <Card className="border-border bg-background/40 p-4"><p className="text-xs uppercase tracking-wide text-muted-foreground">Completion Rate</p><p className="mt-2 text-2xl font-bold">{performance?.completionRate || 0}%</p></Card>
              <Card className="border-border bg-background/40 p-4"><p className="text-xs uppercase tracking-wide text-muted-foreground">Assigned Clients</p><p className="mt-2 text-2xl font-bold">{performance?.clientCount || 0}</p></Card>
              <Card className="border-border bg-background/40 p-4"><p className="text-xs uppercase tracking-wide text-muted-foreground">Avg Report Hours</p><p className="mt-2 text-2xl font-bold">{Number(performance?.avgReportHours || 0).toFixed(1)}</p></Card>
              <Card className="border-border bg-background/40 p-4"><p className="text-xs uppercase tracking-wide text-muted-foreground">Reports Submitted</p><p className="mt-2 text-2xl font-bold">{performance?.reportCount || 0}</p></Card>
              <Card className="border-border bg-background/40 p-4"><p className="text-xs uppercase tracking-wide text-muted-foreground">Approval Rate</p><p className="mt-2 text-2xl font-bold">{performance?.approvalRate || 0}%</p></Card>
              <Card className="border-border bg-background/40 p-4"><p className="text-xs uppercase tracking-wide text-muted-foreground">Active Days</p><p className="mt-2 text-2xl font-bold">{performance?.activeDays || 0}</p></Card>
              <Card className="border-border bg-background/40 p-4"><p className="text-xs uppercase tracking-wide text-muted-foreground">Last Report</p><p className="mt-2 text-lg font-semibold">{performance?.lastReportDate || "—"}</p><p className="text-sm text-muted-foreground">{performance?.lastReportStatus || "No report yet"}</p></Card>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      <EditEmployeeDialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen} employee={employee} />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete employee?</AlertDialogTitle>
            <AlertDialogDescription>
              This will soft-delete the employee by setting them inactive. Tasks and reports will stay in the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete Employee</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
