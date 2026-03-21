import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Activity, ArrowRight, User, CheckCircle2, Plus, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";

const ACTION_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  card_moved: { label: "Task Moved", color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950/30" },
  card_created: { label: "Task Created", color: "text-green-600", bg: "bg-green-50 dark:bg-green-950/30" },
  card_completed: { label: "Task Done", color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/30" },
  card_updated: { label: "Task Updated", color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950/30" },
  sync: { label: "Sync", color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-950/30" },
};

const STATUS_COLORS: Record<string, string> = {
  todo: "#94a3b8", in_progress: "#3b82f6", review: "#f59e0b", done: "#22c55e",
};

export default function ActivityLogPage() {
  const { data: logs, isLoading, refetch } = trpc.activityLogs.list.useQuery({ limit: 200 });

  const grouped = (logs || []).reduce((acc: Record<string, any[]>, log) => {
    const date = format(new Date(log.timestamp), "yyyy-MM-dd");
    if (!acc[date]) acc[date] = [];
    acc[date].push(log);
    return acc;
  }, {});

  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Activity Log</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            System-wide activity · {logs?.length || 0} entries
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading} className="gap-2">
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : logs?.length === 0 ? (
        <Card className="shadow-none border-dashed border-border/60">
          <CardContent className="py-14 flex flex-col items-center text-center gap-3">
            <Activity className="h-10 w-10 text-muted-foreground/30" />
            <p className="text-muted-foreground">No activity recorded yet</p>
            <p className="text-sm text-muted-foreground/60">Activity is logged automatically when tasks are synced from Trello</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {sortedDates.map(date => (
            <div key={date}>
              {/* Date divider */}
              <div className="flex items-center gap-3 mb-3">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs font-semibold text-muted-foreground px-2 py-0.5 rounded-full bg-muted">
                  {format(new Date(date + "T12:00:00"), "EEEE, MMMM d yyyy")}
                </span>
                <div className="h-px flex-1 bg-border" />
              </div>

              {/* Log entries for this date */}
              <div className="space-y-2">
                {grouped[date].map((log: any) => {
                  const cfg = ACTION_CONFIG[log.action] || { label: log.action, color: "text-muted-foreground", bg: "bg-muted/30" };
                  let details: any = {};
                  try { details = JSON.parse(log.details || "{}"); } catch {}

                  return (
                    <Card key={log.id} className="shadow-none border-border/50 hover:border-border transition-colors">
                      <CardContent className="py-3 px-4">
                        <div className="flex items-start gap-3">
                          {/* Action icon */}
                          <div className={`h-8 w-8 rounded-lg ${cfg.bg} flex items-center justify-center shrink-0`}>
                            {log.action === "card_completed" ? (
                              <CheckCircle2 className={`h-4 w-4 ${cfg.color}`} />
                            ) : log.action === "card_created" ? (
                              <Plus className={`h-4 w-4 ${cfg.color}`} />
                            ) : (
                              <Activity className={`h-4 w-4 ${cfg.color}`} />
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge variant="outline" className={`text-[10px] h-4 px-1.5 border-0 ${cfg.bg} ${cfg.color}`}>
                                {cfg.label}
                              </Badge>
                              {log.taskTitle && (
                                <span className="text-sm font-medium truncate">{log.taskTitle}</span>
                              )}
                            </div>

                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              {/* Employee */}
                              {log.employeeName && (
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <User className="h-3 w-3" />
                                  {log.employeeName}
                                </div>
                              )}

                              {/* Status transition */}
                              {log.fromStatus && log.toStatus && (
                                <div className="flex items-center gap-1 text-xs">
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                                    style={{ background: STATUS_COLORS[log.fromStatus] + "20", color: STATUS_COLORS[log.fromStatus] }}>
                                    {log.fromStatus?.replace("_", " ")}
                                  </span>
                                  <ArrowRight className="h-3 w-3 text-muted-foreground" />
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                                    style={{ background: STATUS_COLORS[log.toStatus] + "20", color: STATUS_COLORS[log.toStatus] }}>
                                    {log.toStatus?.replace("_", " ")}
                                  </span>
                                </div>
                              )}

                              {/* Timestamp */}
                              <span className="text-[10px] text-muted-foreground ml-auto">
                                {format(new Date(log.timestamp), "HH:mm")}
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
