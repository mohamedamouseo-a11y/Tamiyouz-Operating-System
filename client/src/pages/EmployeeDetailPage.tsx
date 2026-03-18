import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft } from "lucide-react";
import { useLocation, useParams } from "wouter";

export default function EmployeeDetailPage() {
  const params = useParams<{ id: string }>();
  const empId = parseInt(params.id || "0");
  const [, setLocation] = useLocation();
  const { data: employee, isLoading } = trpc.employees.getById.useQuery({ id: empId }, { enabled: empId > 0 });
  const { data: tasks } = trpc.tasks.listByEmployee.useQuery({ employeeId: empId }, { enabled: empId > 0 });

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!employee) {
    return <div className="text-center py-12 text-muted-foreground">Employee not found.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/employees")}><ArrowLeft className="h-4 w-4" /></Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{employee.name}</h1>
          <p className="text-muted-foreground">{employee.departmentName} - {employee.position || "N/A"}</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium">Employee Info</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            {employee.nameAr && <p><span className="text-muted-foreground">Arabic Name:</span> {employee.nameAr}</p>}
            <p><span className="text-muted-foreground">Email:</span> {employee.email || "N/A"}</p>
            <p><span className="text-muted-foreground">Phone:</span> {employee.phone || "N/A"}</p>
            <p><span className="text-muted-foreground">Status:</span> <Badge variant={employee.isActive ? "default" : "secondary"}>{employee.isActive ? "Active" : "Inactive"}</Badge></p>
            {employee.trelloBoardUrl && <p><span className="text-muted-foreground">Trello:</span> <a href={employee.trelloBoardUrl} target="_blank" rel="noopener" className="text-primary underline">View Board</a></p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm font-medium">Recent Tasks ({tasks?.length || 0})</CardTitle></CardHeader>
          <CardContent>
            {tasks && tasks.length > 0 ? (
              <div className="space-y-2">
                {tasks.slice(0, 10).map(task => (
                  <div key={task.id} className="flex items-center justify-between text-sm border-b pb-2 last:border-0">
                    <div>
                      <p className="font-medium">{task.title}</p>
                      <p className="text-xs text-muted-foreground">{task.clientName || "No client"} - {task.date}</p>
                    </div>
                    <Badge variant={task.status === 'done' ? 'default' : task.status === 'in_progress' ? 'secondary' : 'outline'}>
                      {task.status.replace('_', ' ')}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">No tasks found.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
