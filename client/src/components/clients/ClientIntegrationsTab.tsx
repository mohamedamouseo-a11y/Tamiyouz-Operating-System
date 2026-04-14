import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { ClientIntegrationsDialog } from "@/components/clients/ClientIntegrationsDialog";
import { useState } from "react";

export function ClientIntegrationsTab({ clientId }: { clientId: number }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { data: clientData } = trpc.clients.getById.useQuery({ id: clientId });
  const { data, isLoading } = trpc.clientIntegrations.list.useQuery({ clientId });

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading integrations...</div>;
  }

  const clientObj = clientData
    ? { id: clientData.id, name: clientData.name, services: clientData.services ?? [] }
    : { id: clientId, name: "", services: [] };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setDialogOpen(true)}>Add Integration</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {(data ?? []).map((integration) => (
          <Card key={integration.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{integration.displayName}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div><span className="font-medium">Service:</span> {integration.service}</div>
              <div><span className="font-medium">Type:</span> {integration.integrationType}</div>
              <div><span className="font-medium">Status:</span> {integration.status}</div>
              {integration.externalId ? <div><span className="font-medium">External ID:</span> {integration.externalId}</div> : null}
            </CardContent>
          </Card>
        ))}
      </div>

      <ClientIntegrationsDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        client={clientObj}
        canEdit={true}
      />
    </div>
  );
}
