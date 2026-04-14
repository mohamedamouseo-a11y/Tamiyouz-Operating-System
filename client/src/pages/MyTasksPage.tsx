import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Loader2, ListChecks, Plus, Clock, Filter } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export default function MyTasksPage() {
  const { data: employee, isLoading: empLoading } = trpc.employees.getMe.useQuery();
  const { data: tasks, isLoading: tasksLoading, refetch } = trpc.tasks.listByEmployee.useQuery(
    { employeeId: employee?.id || 0 },
    { enabled: !!employee?.id }
  );
  const { data: clientsList } = trpc.clients.list.useQuery({});

  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    clientId: "",
    date: format(new Date(), "yyyy-MM-dd"),
    estimatedHours: "",
    status: "todo" as "todo" | "in_progress" | "review" | "done",
  });
  const [hoursDialogOpen, setHoursDialogOpen] = useState(false);
  const [completingTaskId, setCompletingTaskId] = useState<number | null>(null);
  const [actualHours, setActualHours] = useState("");

  const createMutation = trpc.tasks.create.useMutation({
    onSuccess: () => {
      toast.success("Task created successfully");
      refetch();
      setCreateOpen(false);
      setNewTask({ title: "", description: "", clientId: "", date: format(new Date(), "yyyy-MM-dd"), estimatedHours: "", status: "todo" });
    },
    onError: (err) => toast.error(err.message),
  });

  const updateStatusMutation = trpc.tasks.updateStatus.useMutation({
    onSuccess: () => { toast.success("Task updated"); refetch(); },
    onError: (err) => toast.error(err.message),
  });

  const handleCreate = () => {
    if (!employee?.id || !newTask.title.trim()) return;
    createMutation.mutate({
      employeeId: employee.id,
      title: newTask.title,
      description: newTask.description || undefined,
      clientId: newTask.clientId ? parseInt(newTask.clientId) : undefined,
      date: newTask.date,
      estimatedHours: newTask.estimatedHours || undefined,
      status: newTask.status,
    });
  };

  const handleComplete = (taskId: number) => {
    setCompletingTaskId(taskId);
    setActualHours("");
    setHoursDialogOpen(true);
  };

  const confirmComplete = () => {
    if (completingTaskId) {
      updateStatusMutation.mutate({
        id: completingTaskId,
        status: "done",
        actualHours: actualHours ? parseFloat(actualHours) : undefined,
      });
    }
    setHoursDialogOpen(false);
  };

  const filteredTasks = tasks?.filter(t => statusFilter === "all" || t.status === statusFilter) || [];

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

  const statusCounts = {
    all: tasks?.length || 0,
    todo: tasks?.filter(t => t.status === "todo").length || 0,
    in_progress: tasks?.filter(t => t.status === "in_progress").length || 0,
    review: tasks?.filter(t => t.status === "review").length || 0,
    done: tasks?.filter(t => t.status === "done").length || 0,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Tasks</h1>
          <p className="text-muted-foreground">{tasks?.length || 0} tasks total</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All ({statusCounts.all})</SelectItem>
              <SelectItem value="todo">To Do ({statusCounts.todo})</SelectItem>
              <SelectItem value="in_progress">In Progress ({statusCounts.in_progress})</SelectItem>
              <SelectItem value="review">Review ({statusCounts.review})</SelectItem>
              <SelectItem value="done">Done ({statusCounts.done})</SelectItem>
            </SelectContent>
          </Select>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" />New Task</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Task</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input id="title" value={newTask.title} onChange={e => setNewTask(p => ({ ...p, title: e.target.value }))} placeholder="Task title" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input id="description" value={newTask.description} onChange={e => setNewTask(p => ({ ...p, description: e.target.value }))} placeholder="Task description" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date">Date</Label>
                    <Input id="date" type="date" value={newTask.date} onChange={e => setNewTask(p => ({ ...p, date: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hours">Estimated Hours</Label>
                    <Input id="hours" type="number" step="0.5" value={newTask.estimatedHours} onChange={e => setNewTask(p => ({ ...p, estimatedHours: e.target.value }))} placeholder="e.g. 2.5" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Client</Label>
                    <Select value={newTask.clientId} onValueChange={v => setNewTask(p => ({ ...p, clientId: v }))}>
                      <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">No client</SelectItem>
                        {clientsList?.map(c => (
                          <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select value={newTask.status} onValueChange={v => setNewTask(p => ({ ...p, status: v as any }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todo">To Do</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                <Button onClick={handleCreate} disabled={!newTask.title.trim() || createMutation.isPending}>
                  {createMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  Create Task
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Status summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setStatusFilter("todo")}>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-gray-600">{statusCounts.todo}</p>
            <p className="text-xs text-muted-foreground">To Do</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setStatusFilter("in_progress")}>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{statusCounts.in_progress}</p>
            <p className="text-xs text-muted-foreground">In Progress</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setStatusFilter("review")}>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-yellow-600">{statusCounts.review}</p>
            <p className="text-xs text-muted-foreground">Review</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setStatusFilter("done")}>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{statusCounts.done}</p>
            <p className="text-xs text-muted-foreground">Done</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-3">
        {filteredTasks.map(task => (
          <Card key={task.id}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{task.title}</CardTitle>
                <Badge variant={task.status === 'done' ? 'default' : task.status === 'in_progress' ? 'secondary' : task.status === 'review' ? 'outline' : 'outline'}>
                  {task.status.replace('_', ' ')}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <div className="flex items-center justify-between">
                <div>
                  <p>{task.clientName || "No client"} &middot; {task.date}</p>
                  {task.description && <p className="mt-1">{task.description}</p>}
                  <div className="flex gap-4 mt-1">
                    {task.estimatedHours && <span className="flex items-center gap-1"><Clock className="h-3 w-3" />Est: {task.estimatedHours}h</span>}
                    {task.actualHours && <span className="flex items-center gap-1"><Clock className="h-3 w-3" />Actual: {task.actualHours}h</span>}
                  </div>
                  {task.trelloCardUrl && (
                    <a href={task.trelloCardUrl} target="_blank" rel="noopener" className="text-primary underline text-xs mt-1 inline-block">
                      View on Trello
                    </a>
                  )}
                </div>
                <div className="flex gap-2">
                  {task.status === 'todo' && (
                    <Button size="sm" variant="outline" onClick={() => updateStatusMutation.mutate({ id: task.id, status: 'in_progress' })} disabled={updateStatusMutation.isPending}>
                      Start
                    </Button>
                  )}
                  {task.status === 'in_progress' && (
                    <>
                      <Button size="sm" variant="outline" onClick={() => updateStatusMutation.mutate({ id: task.id, status: 'review' })} disabled={updateStatusMutation.isPending}>
                        Submit for Review
                      </Button>
                      <Button size="sm" onClick={() => handleComplete(task.id)} disabled={updateStatusMutation.isPending}>
                        Complete
                      </Button>
                    </>
                  )}
                  {task.status === 'review' && (
                    <Button size="sm" onClick={() => handleComplete(task.id)} disabled={updateStatusMutation.isPending}>
                      Mark Done
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {filteredTasks.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <ListChecks className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
            <p>{statusFilter === "all" ? "No tasks assigned yet." : `No ${statusFilter.replace('_', ' ')} tasks.`}</p>
          </div>
        )}
      </div>

      {/* Hours Dialog */}
      <Dialog open={hoursDialogOpen} onOpenChange={setHoursDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="actualHours">Actual Hours Spent</Label>
              <Input id="actualHours" type="number" step="0.5" value={actualHours} onChange={e => setActualHours(e.target.value)} placeholder="e.g. 3.5" />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button onClick={confirmComplete}>
              Complete Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
