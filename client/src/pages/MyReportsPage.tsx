import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, FileText } from "lucide-react";

export default function MyReportsPage() {
  const { data: employee, isLoading: empLoading } = trpc.employees.getMe.useQuery();
  const { data: reports, isLoading: reportsLoading } = trpc.reports.byEmployee.useQuery(
    { employeeId: employee?.id || 0 },
    { enabled: !!employee?.id }
  );

  if (empLoading || reportsLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!employee) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <FileText className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
        <p>Your employee profile has not been linked yet.</p>
        <p className="text-sm">Please contact your administrator.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Reports</h1>
        <p className="text-muted-foreground">{reports?.length || 0} reports</p>
      </div>
      <div className="space-y-3">
        {reports?.map(report => (
          <Card key={report.id}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{report.date}</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant={report.status === 'approved' ? 'default' : report.status === 'generated' ? 'secondary' : 'outline'}>
                    {report.status}
                  </Badge>
                  <span className="text-sm font-medium">{report.totalHours}h</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <div className="grid grid-cols-2 gap-2">
                <p>Tasks Completed: <span className="font-medium text-foreground">{report.tasksCompleted}</span></p>
                <p>Tasks In Progress: <span className="font-medium text-foreground">{report.tasksInProgress}</span></p>
              </div>
              {report.summary && <p className="mt-2">{report.summary}</p>}
            </CardContent>
          </Card>
        ))}
        {(!reports || reports.length === 0) && (
          <div className="text-center py-12 text-muted-foreground">
            <FileText className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
            <p>No reports generated yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
