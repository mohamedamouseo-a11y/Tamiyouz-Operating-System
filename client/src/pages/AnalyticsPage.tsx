import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2, BarChart, Brain } from "lucide-react";
import { toast } from "sonner";
import { Streamdown } from "streamdown";

export default function AnalyticsPage() {
  const [selectedEmployee, setSelectedEmployee] = useState<string>("all");
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);

  const { data: employees } = trpc.employees.list.useQuery();
  const { data: departments } = trpc.departments.list.useQuery();
  const { data: overview, isLoading } = trpc.analytics.overview.useQuery();

  const aiAnalysisMutation = trpc.analytics.aiAnalysis.useMutation({
    onSuccess: (data) => setAnalysisResult(data || "No analysis available."),
    onError: (err) => toast.error(err.message),
  });

  const handleAnalyze = () => {
    if (selectedEmployee === "all") {
      aiAnalysisMutation.mutate({ type: "company" });
    } else {
      aiAnalysisMutation.mutate({ type: "employee", targetId: parseInt(selectedEmployee) });
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">Performance metrics and AI analysis</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select employee" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Employees</SelectItem>
              {employees?.map(emp => (
                <SelectItem key={emp.id} value={String(emp.id)}>{emp.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleAnalyze} disabled={aiAnalysisMutation.isPending}>
            {aiAnalysisMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Brain className="h-4 w-4 mr-2" />}
            AI Analysis
          </Button>
        </div>
      </div>

      {overview && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Employees</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold">{overview.totalEmployees}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Tasks Today</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold">{overview.tasksToday}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Hours Today</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold">{overview.hoursToday.toFixed(1)}h</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Reports</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold">{overview.reportsToday}</div></CardContent>
          </Card>
        </div>
      )}

      {overview?.tasksByStatus && (
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium">Tasks by Status</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4">
              {Object.entries(overview.tasksByStatus).map(([status, count]) => (
                <div key={status} className="text-center p-3 rounded-lg bg-muted/50">
                  <p className="text-2xl font-bold">{count as number}</p>
                  <p className="text-xs text-muted-foreground capitalize">{status.replace('_', ' ')}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {analysisResult && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Brain className="h-4 w-4 text-primary" /> AI Performance Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Streamdown>{analysisResult}</Streamdown>
          </CardContent>
        </Card>
      )}

      {departments && departments.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium">Departments</CardTitle></CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2">
              {departments.map(dept => (
                <div key={dept.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <p className="font-medium">{dept.name}</p>
                    {dept.nameAr && <p className="text-xs text-muted-foreground" dir="rtl">{dept.nameAr}</p>}
                  </div>
                  <BarChart className="h-4 w-4 text-muted-foreground" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
