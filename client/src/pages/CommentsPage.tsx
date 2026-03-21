import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { Loader2, Plus, MessageSquare, AlertTriangle, Lightbulb, CheckCircle2, Clock, CircleDot, Filter } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const ROLE_LEVEL: Record<string, number> = {
  super_admin: 7, admin: 6, ceo: 5, cmo: 4, director: 3, team_leader: 2, employee: 1,
};

const TYPE_CONFIG = {
  issue: { label: "Issue", icon: AlertTriangle, color: "text-red-500", bg: "bg-red-50 dark:bg-red-950/30", badge: "destructive" as const },
  comment: { label: "Comment", icon: MessageSquare, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-950/30", badge: "secondary" as const },
  feedback: { label: "Feedback", icon: Lightbulb, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-950/30", badge: "outline" as const },
};

const PRIORITY_CONFIG = {
  high: { label: "High", class: "text-red-600 bg-red-50 border-red-200 dark:bg-red-950/30" },
  medium: { label: "Medium", class: "text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-950/30" },
  low: { label: "Low", class: "text-green-600 bg-green-50 border-green-200 dark:bg-green-950/30" },
};

const STATUS_CONFIG = {
  open: { label: "Open", icon: CircleDot, class: "text-red-500" },
  in_progress: { label: "In Progress", icon: Clock, class: "text-amber-500" },
  resolved: { label: "Resolved", icon: CheckCircle2, class: "text-green-500" },
};

function NewCommentDialog({ onSuccess }: { onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState<"comment" | "issue" | "feedback">("comment");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");

  const createMutation = trpc.comments.create.useMutation({
    onSuccess: () => {
      toast.success("Submitted successfully");
      setOpen(false);
      setTitle(""); setContent(""); setType("comment"); setPriority("medium");
      onSuccess();
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <Plus className="h-4 w-4" /> New Entry
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Submit Comment / Issue</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Type</label>
              <Select value={type} onValueChange={(v: any) => setType(v)}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="comment">💬 Comment</SelectItem>
                  <SelectItem value="issue">🔴 Issue</SelectItem>
                  <SelectItem value="feedback">💡 Feedback</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Priority</label>
              <Select value={priority} onValueChange={(v: any) => setPriority(v)}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">🟢 Low</SelectItem>
                  <SelectItem value="medium">🟡 Medium</SelectItem>
                  <SelectItem value="high">🔴 High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Title <span className="text-muted-foreground font-normal">(optional)</span></label>
            <input
              value={title} onChange={e => setTitle(e.target.value)}
              placeholder="Brief title..."
              className="w-full h-9 px-3 rounded-md border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Details <span className="text-red-500">*</span></label>
            <textarea
              value={content} onChange={e => setContent(e.target.value)}
              placeholder="Describe the issue or comment in detail..."
              rows={4}
              className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary resize-none"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            onClick={() => createMutation.mutate({ title: title || undefined, content, type, priority })}
            disabled={!content.trim() || createMutation.isPending}
          >
            {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Submit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function CommentsPage() {
  const { user } = useAuth();
  const roleLevel = ROLE_LEVEL[user?.role || "employee"] || 1;
  const isManager = roleLevel >= 2;

  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");

  const { data: comments, isLoading, refetch } = trpc.comments.list.useQuery();
  const updateStatusMutation = trpc.comments.updateStatus.useMutation({
    onSuccess: () => { toast.success("Status updated"); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const filtered = (comments || []).filter(c => {
    if (filterStatus !== "all" && c.status !== filterStatus) return false;
    if (filterType !== "all" && c.type !== filterType) return false;
    if (filterPriority !== "all" && c.priority !== filterPriority) return false;
    return true;
  });

  const counts = {
    open: (comments || []).filter(c => c.status === "open").length,
    in_progress: (comments || []).filter(c => c.status === "in_progress").length,
    resolved: (comments || []).filter(c => c.status === "resolved").length,
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Comments & Issues</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isManager ? "All team submissions" : "Your submissions"} · {comments?.length || 0} total
          </p>
        </div>
        <NewCommentDialog onSuccess={refetch} />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        {(Object.entries(counts) as [string, number][]).map(([status, count]) => {
          const cfg = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG];
          const Icon = cfg.icon;
          return (
            <Card key={status} className="shadow-none border-border/60 cursor-pointer hover:border-border transition-colors"
              onClick={() => setFilterStatus(filterStatus === status ? "all" : status)}>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">{cfg.label}</p>
                    <p className="text-2xl font-bold mt-0.5">{count}</p>
                  </div>
                  <Icon className={`h-6 w-6 ${cfg.class}`} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filter Bar */}
      <Card className="shadow-none border-border/60">
        <CardContent className="pt-3 pb-3">
          <div className="flex flex-wrap items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="h-8 w-[130px] text-xs">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="h-8 w-[120px] text-xs">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="issue">Issues</SelectItem>
                <SelectItem value="comment">Comments</SelectItem>
                <SelectItem value="feedback">Feedback</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger className="h-8 w-[120px] text-xs">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
            {(filterStatus !== "all" || filterType !== "all" || filterPriority !== "all") && (
              <Button variant="ghost" size="sm" className="h-8 text-xs"
                onClick={() => { setFilterStatus("all"); setFilterType("all"); setFilterPriority("all"); }}>
                Clear filters
              </Button>
            )}
            <span className="ml-auto text-xs text-muted-foreground">{filtered.length} results</span>
          </div>
        </CardContent>
      </Card>

      {/* List */}
      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <Card className="shadow-none border-dashed border-border/60">
          <CardContent className="py-14 flex flex-col items-center text-center gap-3">
            <MessageSquare className="h-10 w-10 text-muted-foreground/30" />
            <p className="text-muted-foreground">No entries found</p>
            <NewCommentDialog onSuccess={refetch} />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(c => {
            const typeCfg = TYPE_CONFIG[c.type as keyof typeof TYPE_CONFIG] || TYPE_CONFIG.comment;
            const priorityCfg = PRIORITY_CONFIG[c.priority as keyof typeof PRIORITY_CONFIG] || PRIORITY_CONFIG.medium;
            const statusCfg = STATUS_CONFIG[c.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.open;
            const TypeIcon = typeCfg.icon;
            const StatusIcon = statusCfg.icon;

            return (
              <Card key={c.id} className={`shadow-none border-border/60 ${c.status === "resolved" ? "opacity-70" : ""}`}>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start gap-3">
                    {/* Type Icon */}
                    <div className={`h-9 w-9 rounded-lg ${typeCfg.bg} flex items-center justify-center shrink-0`}>
                      <TypeIcon className={`h-4 w-4 ${typeCfg.color}`} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div className="min-w-0">
                          {c.title && <p className="font-semibold text-sm truncate">{c.title}</p>}
                          <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">{c.content}</p>
                        </div>
                        {/* Status selector for managers */}
                        {isManager && c.status !== "resolved" && (
                          <Select
                            value={c.status}
                            onValueChange={(v: any) => updateStatusMutation.mutate({ id: c.id, status: v })}
                          >
                            <SelectTrigger className="h-7 w-[120px] text-xs shrink-0">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="open">Open</SelectItem>
                              <SelectItem value="in_progress">In Progress</SelectItem>
                              <SelectItem value="resolved">Resolved</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      </div>

                      {/* Meta row */}
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <Badge variant={typeCfg.badge} className="text-[10px] h-4 px-1.5">
                          {typeCfg.label}
                        </Badge>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${priorityCfg.class}`}>
                          {priorityCfg.label}
                        </span>
                        <div className={`flex items-center gap-1 text-[10px] font-medium ${statusCfg.class}`}>
                          <StatusIcon className="h-3 w-3" />
                          {statusCfg.label}
                        </div>
                        <span className="text-[10px] text-muted-foreground ml-auto">
                          {isManager && c.userName && <span className="mr-2 font-medium">{c.userName}</span>}
                          {format(new Date(c.createdAt), "MMM d, yyyy · HH:mm")}
                        </span>
                      </div>

                      {c.status === "resolved" && c.resolvedByName && (
                        <p className="text-[10px] text-green-600 mt-1">
                          ✓ Resolved by {c.resolvedByName}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
