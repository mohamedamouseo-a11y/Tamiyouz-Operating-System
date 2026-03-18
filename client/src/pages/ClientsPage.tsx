import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

export default function ClientsPage() {
  const { data: clients, isLoading } = trpc.clients.list.useQuery();

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Clients</h1>
          <p className="text-muted-foreground">{clients?.length || 0} clients</p>
        </div>
        <Button onClick={() => toast.info("Feature coming soon")}><Plus className="h-4 w-4 mr-2" />Add Client</Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {clients?.map(client => (
          <Card key={client.id}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{client.name}</CardTitle>
                <Badge variant={client.isActive ? "default" : "secondary"}>{client.isActive ? "Active" : "Inactive"}</Badge>
              </div>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-1">
              {client.nameAr && <p dir="rtl">{client.nameAr}</p>}
              {client.industry && <p>Industry: {client.industry}</p>}
              {client.contactEmail && <p>{client.contactEmail}</p>}
            </CardContent>
          </Card>
        ))}
        {(!clients || clients.length === 0) && (
          <div className="col-span-full text-center py-12 text-muted-foreground">No clients found.</div>
        )}
      </div>
    </div>
  );
}
