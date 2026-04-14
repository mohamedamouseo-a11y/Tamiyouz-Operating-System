import { useMemo, useState } from "react";
import { useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClientIntegrationsTab } from "@/components/clients/ClientIntegrationsTab";
import { ClientKpisTab } from "@/components/clients/ClientKpisTab";
import { ClientNotesTab } from "@/components/clients/ClientNotesTab";
import { ClientTeamTab } from "@/components/clients/ClientTeamTab";

export default function ClientDetailPage() {
  const [match, params] = useRoute("/clients/:id");
  const clientId = useMemo(() => Number(params?.id), [params?.id]);
  const { data, isLoading, error } = trpc.clients.getById.useQuery(
    { id: clientId },
    { enabled: match && Number.isFinite(clientId) },
  );

  if (!match) return null;
  if (isLoading) return <div className="p-6 text-sm text-muted-foreground">Loading client...</div>;
  if (error) return <div className="p-6 text-sm text-red-600">{error.message}</div>;
  if (!data) return <div className="p-6 text-sm text-muted-foreground">Client not found.</div>;

  return (
    <div className="space-y-6 p-6">
      <Card>
        <CardContent className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold">{data.name}</h1>
            <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
              <span>{data.industry}</span>
              {data.contactEmail ? <span>• {data.contactEmail}</span> : null}
              {data.contactPhone ? <span>• {data.contactPhone}</span> : null}
            </div>
          </div>
          <span
            className={`w-fit rounded-full px-3 py-1 text-sm font-medium ${
              data.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-700"
            }`}
          >
            {data.isActive ? "Active" : "Inactive"}
          </span>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="flex flex-wrap justify-start gap-2">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
          <TabsTrigger value="kpis">Results / KPIs</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardContent className="space-y-4 p-6">
              <div>
                <div className="mb-2 text-sm font-medium">Basic Info</div>
                <div className="grid gap-3 text-sm md:grid-cols-2">
                  <div><span className="font-medium">Client Name:</span> {data.name}</div>
                  <div><span className="font-medium">Industry:</span> {data.industry}</div>
                  <div><span className="font-medium">Email:</span> {data.contactEmail || "-"}</div>
                  <div><span className="font-medium">Phone:</span> {data.contactPhone || "-"}</div>
                </div>
              </div>

              <div>
                <div className="mb-2 text-sm font-medium">Active Services</div>
                <div className="flex flex-wrap gap-2">
                  {(data.services ?? []).length ? (
                    data.services.map((service: string) => (
                      <span key={service} className="rounded-full border px-3 py-1 text-xs">
                        {service}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">No services assigned.</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations">
          <ClientIntegrationsTab clientId={clientId} />
        </TabsContent>

        <TabsContent value="team">
          <ClientTeamTab clientId={clientId} />
        </TabsContent>

        <TabsContent value="notes">
          <ClientNotesTab clientId={clientId} />
        </TabsContent>

        <TabsContent value="kpis">
          <ClientKpisTab clientId={clientId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
