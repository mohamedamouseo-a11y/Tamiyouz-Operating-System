import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, FileText, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export default function DailyReportsPage() {
  const [selectedDate] = useState(() => format(new Date(), "yyyy-MM-dd"));
  const [selectedEmployee, setSelectedEmployee] = useState<string>("all");

  const { data: reports, isLoading, refetch } = trpc.reports.dailyAll.useQuery({ date: selectedDate });
  const { data: employees } = trpc.employees.list.useQuery();
  const generateMutation = trpc.reports.generateAll.useMutation({
    onSuccess: () => { toast.success("Report generated successfully"); refetch(); },
    onError: (err) => toast.error(err.message),
  });

  const filteredReports = useMemo(() => {
    if (!reports) return [];
    if (selectedEmployee === "all") return reports;
    return reports.filter(r => r.employeeId === parseInt(selectedEmployee));
  }, [reports, selectedEmployee]);

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Daily Reports</h1>
          <p className="text-muted-foreground">{selectedDate}</p>
        </div>
        <div className="flex items-center gap-3">
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
          <Button variant="outline" onClick={() => refetch()}><RefreshCw className="h-4 w-4 mr-2" />Refresh</Button>
        </div>
      </div>

      <div className="space-y-4">
        {filteredReports.map(report => (
          <Card key={report.id}>
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
                  <Badge variant={report.status === 'approved' ? 'default' : report.status === 'generated' ? 'secondary' : 'outline'}>
                    {report.status}
                  </Badge>
                  <span className="text-sm font-medium">{report.totalHours}h</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="text-sm">
              <div className="grid grid-cols-2 gap-2 text-muted-foreground">
                <p>Tasks Completed: <span className="font-medium text-foreground">{report.tasksCompleted}</span></p>
                <p>Tasks In Progress: <span className="font-medium text-foreground">{report.tasksInProgress}</span></p>
              </div>
              {report.summary && <p className="mt-2 text-muted-foreground">{report.summary}</p>}
            </CardContent>
          </Card>
        ))}
        {filteredReports.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <FileText className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
            <p>No reports found for this date.</p>
            <Button className="mt-4" onClick={() => generateMutation.mutate({ date: selectedDate })} disabled={generateMutation.isPending}>
              {generateMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Generate Reports
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
