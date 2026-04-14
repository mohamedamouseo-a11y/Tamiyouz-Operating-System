import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { KPI_SUGGESTIONS } from "@/lib/clientOptions";
import { toast } from "sonner";

export function ClientKpisTab({ clientId }: { clientId: number }) {
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.clientKpis.list.useQuery({ clientId });
  const [metricName, setMetricName] = useState(KPI_SUGGESTIONS[0]);
  const [metricValue, setMetricValue] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  const createKpi = trpc.clientKpis.create.useMutation({
    onSuccess: async () => {
      await utils.clientKpis.list.invalidate({ clientId });
      setMetricValue("");
      toast.success("KPI recorded");
    },
    onError: (error) => toast.error(error.message),
  });

  const deleteKpi = trpc.clientKpis.delete.useMutation({
    onSuccess: async () => {
      await utils.clientKpis.list.invalidate({ clientId });
      toast.success("KPI deleted");
    },
    onError: (error) => toast.error(error.message),
  });

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="grid gap-4 p-4 md:grid-cols-4">
          <div className="grid gap-2">
            <Label>Metric</Label>
            <select
              className="h-10 rounded-md border bg-background px-3"
              value={metricName}
              onChange={(e) => setMetricName(e.target.value)}
            >
              {KPI_SUGGESTIONS.map((metric) => (
                <option key={metric} value={metric}>
                  {metric}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-2">
            <Label>Value</Label>
            <Input value={metricValue} onChange={(e) => setMetricValue(e.target.value)} type="number" />
          </div>
          <div className="grid gap-2">
            <Label>Date</Label>
            <Input value={date} onChange={(e) => setDate(e.target.value)} type="date" />
          </div>
          <div className="flex items-end">
            <Button
              className="w-full"
              disabled={!metricValue || createKpi.isPending}
              onClick={() =>
                createKpi.mutate({
                  clientId,
                  metricName,
                  metricValue: Number(metricValue),
                  date,
                })
              }
            >
              Log KPI
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3">
        {isLoading ? (
          <div className="text-sm text-muted-foreground">Loading KPIs...</div>
        ) : (data ?? []).length === 0 ? (
          <div className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
            No KPI entries yet.
          </div>
        ) : (
          (data ?? []).map((kpi) => (
            <Card key={kpi.id}>
              <CardContent className="flex items-center justify-between gap-4 p-4">
                <div className="space-y-1 text-sm">
                  <div className="font-medium">{kpi.metricName}</div>
                  <div>Value: {kpi.metricValue}</div>
                  <div className="text-muted-foreground">{String(kpi.date)}</div>
                </div>
                <Button variant="destructive" size="sm" onClick={() => deleteKpi.mutate({ id: kpi.id })}>
                  Delete
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
