import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, FileText, RefreshCw, CheckCircle, Sparkles, Calendar, ArrowDownToLine, ChevronDown, ChevronRight, Users, Clock, TrendingUp, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface StructuredReport {
  version: number;
  stats: {
    total: number;
    done: number;
    inProgress: number;
    review: number;
    todo: number;
    completionRate: number;
    totalHours: number;
  };
  insight: string;
  tasks: Array<{
    title: string;
    client: string;
    hours: number;
    status: string;
  }>;
  clientBreakdown: Array<{
    client: string;
    done: number;
    inProgress: number;
    pending: number;
    hours: number;
  }>;
  remainingTasks: number;
}

function parseReport(summary: string | null): StructuredReport | null {
  if (!summary) return null;
  try {
    const data = JSON.parse(summary);
    if (data.version === 2) return data;
    return null;
  } catch {
    return null;
  }
}

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  done: { label: "Done", color: "text-green-700", bg: "bg-green-100" },
  in_progress: { label: "In Progress", color: "text-blue-700", bg: "bg-blue-100" },
  review: { label: "Review", color: "text-amber-700", bg: "bg-amber-100" },
  todo: { label: "To Do", color: "text-gray-700", bg: "bg-gray-100" },
};

function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] || { label: status, color: "text-gray-700", bg: "bg-gray-100" };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${config.color} ${config.bg}`}>
      {config.label}
    </span>
  );
}

function ReportCard({ report, selectedDate, onSync, onRegenerate, onApprove, syncPending, genPending, approvePending }: {
  report: any;
  selectedDate: string;
  onSync: () => void;
  onRegenerate: () => void;
  onApprove: () => void;
  syncPending: boolean;
  genPending: boolean;
  approvePending: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const structured = parseReport(report.summary);

  // Fallback for old-format reports
  if (!structured) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-primary" />
              <div>
                <CardTitle className="text-base">{report.employeeName}</CardTitle>
                <p className="text-xs text-muted-foreground">{report.departmentName}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={report.status === 'approved' ? 'default' : 'secondary'}>{report.status}</Badge>
              <span className="text-sm font-medium">{report.totalHours}h</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="text-sm">
          <div className="grid grid-cols-2 gap-2 text-muted-foreground mb-3">
            <p>Tasks Completed: <span className="font-medium text-foreground">{report.tasksCompleted}</span></p>
            <p>Tasks In Progress: <span className="font-medium text-foreground">{report.tasksInProgress}</span></p>
          </div>
          <p className="text-xs text-muted-foreground italic">Click Regenerate to get the new structured format.</p>
          <div className="flex gap-2 mt-3 justify-end">
            <Button size="sm" variant="outline" onClick={onSync} disabled={syncPending}>
              {syncPending ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <ArrowDownToLine className="h-3 w-3 mr-1" />}Sync
            </Button>
            <Button size="sm" variant="outline" onClick={onRegenerate} disabled={genPending}>
              {genPending ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Sparkles className="h-3 w-3 mr-1" />}Regenerate
            </Button>
            {report.status === 'generated' && (
              <Button size="sm" onClick={onApprove} disabled={approvePending}>
                {approvePending ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <CheckCircle className="h-3 w-3 mr-1" />}Approve
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  const { stats, insight, tasks, clientBreakdown, remainingTasks } = structured;
  const progressColor = stats.completionRate >= 80 ? "bg-green-500" : stats.completionRate >= 50 ? "bg-blue-500" : stats.completionRate > 0 ? "bg-amber-500" : "bg-gray-400";

  return (
    <Card className="overflow-hidden">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CollapsibleTrigger className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity flex-1 text-left">
              <div className="flex items-center gap-3 flex-1">
                {isOpen ? <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base truncate">{report.employeeName}</CardTitle>
                    <Badge variant="outline" className="text-xs shrink-0">{report.departmentName}</Badge>
                  </div>
                  {/* Mini stats row */}
                  <div className="flex items-center gap-4 mt-1.5">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="flex-1 max-w-[200px]">
                        <Progress value={stats.completionRate} className={`h-2 [&>div]:${progressColor}`} />
                      </div>
                      <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap">{stats.completionRate}%</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><CheckCircle className="h-3 w-3 text-green-500" />{stats.done}</span>
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3 text-blue-500" />{stats.inProgress}</span>
                      <span className="flex items-center gap-1"><AlertCircle className="h-3 w-3 text-gray-400" />{stats.todo}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CollapsibleTrigger>
            <div className="flex items-center gap-2 ml-3 shrink-0">
              <Badge variant={report.status === 'approved' ? 'default' : report.status === 'generated' ? 'secondary' : 'outline'}>
                {report.status}
              </Badge>
              <span className="text-sm font-medium tabular-nums">{stats.totalHours}h</span>
            </div>
          </div>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="pt-0 space-y-4">
            {/* Insight banner */}
            {insight && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 border">
                <TrendingUp className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                <p className="text-sm text-muted-foreground">{insight}</p>
              </div>
            )}

            {/* Stats grid */}
            <div className="grid grid-cols-5 gap-2">
              {[
                { label: "Total", value: stats.total, color: "text-foreground" },
                { label: "Done", value: stats.done, color: "text-green-600" },
                { label: "In Progress", value: stats.inProgress, color: "text-blue-600" },
                { label: "Review", value: stats.review, color: "text-amber-600" },
                { label: "To Do", value: stats.todo, color: "text-gray-500" },
              ].map(s => (
                <div key={s.label} className="text-center p-2 rounded-lg bg-muted/30">
                  <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Tasks table */}
            {tasks.length > 0 && (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="w-[40%]">Task</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead className="text-center">Hours</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tasks.map((task, i) => (
                      <TableRow key={i} className="hover:bg-muted/30">
                        <TableCell className="font-medium text-sm max-w-[300px] truncate">{task.title}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{task.client}</TableCell>
                        <TableCell className="text-center text-sm tabular-nums">{task.hours}h</TableCell>
                        <TableCell className="text-center"><StatusBadge status={task.status} /></TableCell>
                      </TableRow>
                    ))}
                    {remainingTasks > 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-xs text-muted-foreground italic py-2">
                          ... and {remainingTasks} more tasks
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Client breakdown */}
            {clientBreakdown.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5" /> Client Breakdown
                </h4>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead>Client</TableHead>
                        <TableHead className="text-center">Done</TableHead>
                        <TableHead className="text-center">In Progress</TableHead>
                        <TableHead className="text-center">Pending</TableHead>
                        <TableHead className="text-center">Hours</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {clientBreakdown.map((cb, i) => (
                        <TableRow key={i} className="hover:bg-muted/30">
                          <TableCell className="font-medium text-sm">{cb.client}</TableCell>
                          <TableCell className="text-center text-sm text-green-600 font-medium">{cb.done}</TableCell>
                          <TableCell className="text-center text-sm text-blue-600 font-medium">{cb.inProgress}</TableCell>
                          <TableCell className="text-center text-sm text-gray-500">{cb.pending}</TableCell>
                          <TableCell className="text-center text-sm tabular-nums">{cb.hours}h</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>

        {/* Action buttons - always visible */}
        <div className="flex gap-2 px-6 pb-4 justify-end">
          <Button size="sm" variant="outline" onClick={onSync} disabled={syncPending}>
            {syncPending ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <ArrowDownToLine className="h-3 w-3 mr-1" />}Sync
          </Button>
          {report.status !== 'approved' && (
            <Button size="sm" variant="outline" onClick={onRegenerate} disabled={genPending}>
              {genPending ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Sparkles className="h-3 w-3 mr-1" />}Regenerate
            </Button>
          )}
          {report.status === 'generated' && (
            <Button size="sm" onClick={onApprove} disabled={approvePending}>
              {approvePending ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <CheckCircle className="h-3 w-3 mr-1" />}Approve
            </Button>
          )}
        </div>
      </Collapsible>
    </Card>
  );
}

export default function DailyReportsPage() {
  const [selectedDate, setSelectedDate] = useState(() => format(new Date(), "yyyy-MM-dd"));
  const [selectedEmployee, setSelectedEmployee] = useState<string>("all");

  const { data: reports, isLoading, refetch } = trpc.reports.dailyAll.useQuery({ date: selectedDate });
  const { data: employees } = trpc.employees.list.useQuery();

  const generateAllMutation = trpc.reports.generateAll.useMutation({
    onSuccess: (data) => {
      toast.success(`Generated ${data.generated} reports${data.failed ? `, ${data.failed} failed` : ""}`);
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const generateMutation = trpc.reports.generate.useMutation({
    onSuccess: () => { toast.success("Report generated successfully"); refetch(); },
    onError: (err) => toast.error(err.message),
  });

  const approveMutation = trpc.reports.approve.useMutation({
    onSuccess: () => { toast.success("Report approved"); refetch(); },
    onError: (err) => toast.error(err.message),
  });

  const syncAllMutation = trpc.trelloSettings.syncNow.useMutation({
    onSuccess: (data) => {
      toast.success(`Synced ${data.synced} employee boards from Trello`);
      refetch();
    },
    onError: (err) => toast.error(err.message || "Failed to sync from Trello"),
  });

  const syncEmployeeMutation = trpc.trello.syncEmployee.useMutation({
    onSuccess: (data) => {
      toast.success(`Synced ${data.synced} cards (${data.created} new, ${data.updated} updated)`);
      refetch();
    },
    onError: (err) => toast.error(err.message || "Failed to sync employee"),
  });

  const filteredReports = useMemo(() => {
    if (!reports) return [];
    if (selectedEmployee === "all") return reports;
    return reports.filter(r => r.employeeId === parseInt(selectedEmployee));
  }, [reports, selectedEmployee]);

  // Aggregate stats
  const aggregateStats = useMemo(() => {
    let totalDone = 0, totalInProgress = 0, totalTodo = 0, totalTasks = 0;
    for (const r of filteredReports) {
      const parsed = parseReport(r.summary);
      if (parsed) {
        totalDone += parsed.stats.done;
        totalInProgress += parsed.stats.inProgress;
        totalTodo += parsed.stats.todo + parsed.stats.review;
        totalTasks += parsed.stats.total;
      } else {
        totalDone += r.tasksCompleted || 0;
        totalInProgress += r.tasksInProgress || 0;
      }
    }
    return { totalDone, totalInProgress, totalTodo, totalTasks };
  }, [filteredReports]);

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Daily Reports</h1>
          <p className="text-muted-foreground">Manage and review daily employee reports</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="pl-9 w-[180px]"
            />
          </div>
          <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by employee" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Employees</SelectItem>
              {employees?.map(emp => (
                <SelectItem key={emp.id} value={String(emp.id)}>{emp.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />Refresh
          </Button>
          <Button
            variant="outline"
            onClick={() => syncAllMutation.mutate()}
            disabled={syncAllMutation.isPending}
          >
            {syncAllMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ArrowDownToLine className="h-4 w-4 mr-2" />}
            Sync All
          </Button>
          <Button
            onClick={() => generateAllMutation.mutate({ date: selectedDate })}
            disabled={generateAllMutation.isPending}
          >
            {generateAllMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
            Generate All
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{filteredReports.length}</p>
            <p className="text-xs text-muted-foreground">Reports</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{filteredReports.filter(r => r.status === 'approved').length}</p>
            <p className="text-xs text-muted-foreground">Approved</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{aggregateStats.totalDone}</p>
            <p className="text-xs text-muted-foreground">Tasks Done</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{aggregateStats.totalInProgress}</p>
            <p className="text-xs text-muted-foreground">In Progress</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-gray-500">{aggregateStats.totalTodo}</p>
            <p className="text-xs text-muted-foreground">Pending</p>
          </CardContent>
        </Card>
      </div>

      {/* Reports list */}
      <div className="space-y-3">
        {filteredReports.map(report => (
          <ReportCard
            key={report.id}
            report={report}
            selectedDate={selectedDate}
            onSync={() => syncEmployeeMutation.mutate({ employeeId: report.employeeId })}
            onRegenerate={() => generateMutation.mutate({ employeeId: report.employeeId, date: selectedDate })}
            onApprove={() => approveMutation.mutate({ id: report.id })}
            syncPending={syncEmployeeMutation.isPending}
            genPending={generateMutation.isPending}
            approvePending={approveMutation.isPending}
          />
        ))}
        {filteredReports.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <FileText className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
            <p>No reports found for {selectedDate}.</p>
            <Button
              className="mt-4"
              onClick={() => generateAllMutation.mutate({ date: selectedDate })}
              disabled={generateAllMutation.isPending}
            >
              {generateAllMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
              Generate Reports for All Employees
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
