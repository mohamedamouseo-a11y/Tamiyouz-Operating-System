import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, ListChecks } from "lucide-react";
import { toast } from "sonner";

export default function MyTasksPage() {
  const { data: employee, isLoading: empLoading } = trpc.employees.getMe.useQuery();
  const { data: tasks, isLoading: tasksLoading, refetch } = trpc.tasks.listByEmployee.useQuery(
    { employeeId: employee?.id || 0 },
    { enabled: !!employee?.id }
  );
  const updateStatusMutation = trpc.tasks.updateStatus.useMutation({
    onSuccess: () => { toast.success("Task updated"); refetch(); },
    onError: (err) => toast.error(err.message),
  });

  if (empLoading || tasksLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!employee) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <ListChecks className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
        <p>Your employee profile has not been linked yet.</p>
        <p className="text-sm">Please contact your administrator.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Tasks</h1>
        <p className="text-muted-foreground">{tasks?.length || 0} tasks</p>
      </div>
      <div className="space-y-3">
        {tasks?.map(task => (
          <Card key={task.id}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{task.title}</CardTitle>
                <Badge variant={task.status === 'done' ? 'default' : task.status === 'in_progress' ? 'secondary' : 'outline'}>
                  {task.status.replace('_', ' ')}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <div className="flex items-center justify-between">
                <div>
                  <p>{task.clientName || "No client"} - {task.date}</p>
                  {task.description && <p className="mt-1">{task.description}</p>}
                  {task.actualHours && <p className="mt-1">Hours: {task.actualHours}h</p>}
                </div>
                <div className="flex gap-2">
                  {task.status === 'todo' && (
                    <Button size="sm" variant="outline" onClick={() => updateStatusMutation.mutate({ id: task.id, status: 'in_progress' })} disabled={updateStatusMutation.isPending}>
                      Start
                    </Button>
                  )}
                  {task.status === 'in_progress' && (
                    <Button size="sm" variant="outline" onClick={() => updateStatusMutation.mutate({ id: task.id, status: 'done' })} disabled={updateStatusMutation.isPending}>
                      Complete
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {(!tasks || tasks.length === 0) && (
          <div className="text-center py-12 text-muted-foreground">
            <ListChecks className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
            <p>No tasks assigned yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
