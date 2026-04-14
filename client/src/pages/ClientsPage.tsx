import { useMemo, useState } from "react";
import { Link } from "wouter";
import { Search, Pencil, Trash2, MoreHorizontal } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { AddClientDialog } from "@/components/clients/AddClientDialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function ClientsPage() {
  const [search, setSearch] = useState("");
  const [industry, setIndustry] = useState("");
  const [status, setStatus] = useState<"all" | "active" | "inactive">("all");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [editClient, setEditClient] = useState<any>(null);
  const [editForm, setEditForm] = useState({ name: "", nameAr: "", contactEmail: "", contactPhone: "", industry: "", isActive: true, services: [] as string[] });

  const queryInput = useMemo(
    () => ({
      search: search || undefined,
      industry: industry || undefined,
      status: status === "all" ? undefined : status,
    }),
    [industry, search, status],
  );

  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.clients.list.useQuery(queryInput);

  const deleteMutation = trpc.clients.delete.useMutation({
    onSuccess: () => {
      toast.success("Client deleted successfully");
      utils.clients.list.invalidate();
      setDeleteId(null);
    },
    onError: (err) => toast.error(err.message),
  });

  const updateMutation = trpc.clients.update.useMutation({
    onSuccess: () => {
      toast.success("Client updated successfully");
      utils.clients.list.invalidate();
      setEditClient(null);
    },
    onError: (err) => toast.error(err.message),
  });

  const industries = useMemo(() => {
    const values = new Set<string>();
    for (const client of data ?? []) {
      if (client.industry) values.add(client.industry);
    }
    return Array.from(values).sort();
  }, [data]);

  const handleEdit = (client: any) => {
    setEditClient(client);
    setEditForm({
      name: client.name || "",
      nameAr: client.nameAr || "",
      contactEmail: client.contactEmail || "",
      contactPhone: client.contactPhone || "",
      industry: client.industry || "",
      isActive: client.isActive ?? true,
      services: client.service ? [client.service] : [],
    });
  };

  const handleUpdate = () => {
    if (!editClient) return;
    updateMutation.mutate({
      id: editClient.id,
      name: editForm.name,
      nameAr: editForm.nameAr || undefined,
      contactEmail: editForm.contactEmail || undefined,
      contactPhone: editForm.contactPhone || undefined,
      industry: editForm.industry,
      isActive: editForm.isActive,
      services: editForm.services,
    });
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Clients</h1>
          <p className="text-sm text-muted-foreground">Track accounts, teams, integrations, and results.</p>
        </div>
        <AddClientDialog />
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <div className="relative md:col-span-2">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by client name or email" className="pl-9" />
        </div>
        <select className="h-10 rounded-md border bg-background px-3" value={industry} onChange={(e) => setIndustry(e.target.value)}>
          <option value="">All industries</option>
          {industries.map((ind) => (
            <option key={ind} value={ind}>{ind}</option>
          ))}
        </select>
        <select className="h-10 rounded-md border bg-background px-3" value={status} onChange={(e) => setStatus(e.target.value as any)}>
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-32">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {data?.map((client) => (
            <Card key={client.id} className="group relative hover:border-primary/30 transition-colors">
              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEdit(client)}>
                      <Pencil className="h-4 w-4 mr-2" />Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-red-600" onClick={() => setDeleteId(client.id)}>
                      <Trash2 className="h-4 w-4 mr-2" />Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <Link href={`/clients/${client.id}`}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between pr-8">
                    <CardTitle className="text-base">{client.name}</CardTitle>
                    <Badge variant={client.isActive ? "default" : "secondary"}>
                      {client.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  {client.nameAr && <p className="text-sm text-muted-foreground">{client.nameAr}</p>}
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground space-y-1">
                  {client.industry && <p>{client.industry}</p>}
                  {client.contactEmail && <p>{client.contactEmail}</p>}
                  {client.contactPhone && <p>{client.contactPhone}</p>}
                  {client.service && (
                    <Badge variant="outline" className="mt-1">{client.service}</Badge>
                  )}
                </CardContent>
              </Link>
            </Card>
          ))}
          {(!data || data.length === 0) && (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              <p>No clients found.</p>
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Client</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Are you sure you want to delete this client? This action cannot be undone.</p>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button variant="destructive" onClick={() => deleteId && deleteMutation.mutate({ id: deleteId })} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Client Dialog */}
      <Dialog open={editClient !== null} onOpenChange={() => setEditClient(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Client</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Name (Arabic)</Label>
                <Input value={editForm.nameAr} onChange={e => setEditForm(p => ({ ...p, nameAr: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={editForm.contactEmail} onChange={e => setEditForm(p => ({ ...p, contactEmail: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={editForm.contactPhone} onChange={e => setEditForm(p => ({ ...p, contactPhone: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Industry</Label>
                <Input value={editForm.industry} onChange={e => setEditForm(p => ({ ...p, industry: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={editForm.isActive ? "active" : "inactive"} onValueChange={v => setEditForm(p => ({ ...p, isActive: v === "active" }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button onClick={handleUpdate} disabled={!editForm.name.trim() || updateMutation.isPending}>
              {updateMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
