import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Bell, CheckCircle } from "lucide-react";
import { toast } from "sonner";

export default function AlertsPage() {
  const { data: alerts, isLoading, refetch } = trpc.alerts.list.useQuery();
  const markReadMutation = trpc.alerts.markRead.useMutation({
    onSuccess: () => { toast.success("Alert marked as read"); refetch(); },
    onError: (err) => toast.error(err.message),
  });

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Alerts</h1>
        <p className="text-muted-foreground">{alerts?.filter(a => !a.isRead).length || 0} unread alerts</p>
      </div>
      <div className="space-y-3">
        {alerts?.map(alert => (
          <Card key={alert.id} className={alert.isRead ? "opacity-60" : ""}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Bell className={`h-5 w-5 ${alert.severity === 'critical' ? 'text-destructive' : alert.severity === 'warning' ? 'text-yellow-500' : 'text-muted-foreground'}`} />
                  <CardTitle className="text-base">{alert.title}</CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={alert.severity === 'critical' ? 'destructive' : alert.severity === 'warning' ? 'secondary' : 'outline'}>
                    {alert.severity}
                  </Badge>
                  <Badge variant="outline">{alert.type.replace('_', ' ')}</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <div className="flex items-center justify-between">
                <div>
                  {alert.message && <p>{alert.message}</p>}
                  <p className="text-xs mt-1">{new Date(alert.createdAt).toLocaleString()}</p>
                </div>
                {!alert.isRead && (
                  <Button size="sm" variant="ghost" onClick={() => markReadMutation.mutate({ id: alert.id })} disabled={markReadMutation.isPending}>
                    <CheckCircle className="h-4 w-4 mr-1" /> Mark Read
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        {(!alerts || alerts.length === 0) && (
          <div className="text-center py-12 text-muted-foreground">
            <Bell className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
            <p>No alerts.</p>
          </div>
        )}
      </div>
    </div>
  );
}
