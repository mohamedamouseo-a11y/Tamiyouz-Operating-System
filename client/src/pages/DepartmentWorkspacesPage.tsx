import { useMemo, useState } from "react";
import { CheckCircle2, Link2, Loader2, Plus, RefreshCw, Trash2, Users } from "lucide-react";
import { toast } from "sonner";

import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type WorkspaceFormState = {
  id?: number;
  name: string;
  departmentId: string;
  trelloWorkspaceId: string;
  apiKey: string;
  apiToken: string;
  isActive: boolean;
};

const EMPTY_FORM: WorkspaceFormState = {
  name: "",
  departmentId: "none",
  trelloWorkspaceId: "",
  apiKey: "",
  apiToken: "",
  isActive: true,
};

export default function DepartmentWorkspacesPage() {
  const utils = trpc.useUtils();
  const { data: departments = [] } = trpc.departments.list.useQuery();
  const { data: workspaces = [], isLoading } = trpc.departmentWorkspaces.listAll.useQuery();
  const [form, setForm] = useState<WorkspaceFormState>(EMPTY_FORM);
  const [boardCounts, setBoardCounts] = useState<Record<number, number>>({});

  const saveMutation = trpc.departmentWorkspaces.create.useMutation({
    onSuccess: async () => {
      await utils.departmentWorkspaces.listAll.invalidate();
      toast.success("Workspace created.");
      setForm(EMPTY_FORM);
    },
    onError: (error) => toast.error(error.message || "Failed to create workspace."),
  });

  const updateMutation = trpc.departmentWorkspaces.update.useMutation({
    onSuccess: async () => {
      await utils.departmentWorkspaces.listAll.invalidate();
      toast.success("Workspace updated.");
      setForm(EMPTY_FORM);
    },
    onError: (error) => toast.error(error.message || "Failed to update workspace."),
  });

  const deleteMutation = trpc.departmentWorkspaces.delete.useMutation({
    onSuccess: async () => {
      await utils.departmentWorkspaces.listAll.invalidate();
      toast.success("Workspace deleted.");
      setForm(EMPTY_FORM);
    },
    onError: (error) => toast.error(error.message || "Failed to delete workspace."),
  });

  const testMutation = trpc.departmentWorkspaces.testConnection.useMutation({
    onSuccess: (result) => {
      if (result.success) toast.success(`Connected${result.memberName ? ` as ${result.memberName}` : ""}.`);
      else toast.error("Connection failed.");
    },
    onError: (error) => toast.error(error.message || "Failed to test workspace."),
  });

  const boardMutation = trpc.departmentWorkspaces.getBoards.useMutation({
    onSuccess: (boards, variables) => {
      setBoardCounts((prev) => ({ ...prev, [variables.id]: boards.length }));
      toast.success(`Found ${boards.length} boards for this workspace.`);
    },
    onError: (error) => toast.error(error.message || "Failed to load boards."),
  });

  const autoLinkMutation = trpc.departmentWorkspaces.autoLinkWorkspaceId.useMutation({
    onSuccess: async (result) => {
      await utils.departmentWorkspaces.listAll.invalidate();
      toast.success(`Linked to Trello organization: ${result.organizationName} (${result.organizationId})`);
    },
    onError: (error) => toast.error(error.message || "Failed to auto-link workspace."),
  });

  const sortedWorkspaces = useMemo(() => [...workspaces].sort((a, b) => a.name.localeCompare(b.name)), [workspaces]);

  const handleSubmit = () => {
    if (!form.name.trim() || !form.apiKey.trim() || !form.apiToken.trim()) {
      return toast.error("Name, API key, and API token are required.");
    }

    const payload = {
      departmentId: form.departmentId === "none" ? null : Number(form.departmentId),
      name: form.name.trim(),
      trelloWorkspaceId: form.trelloWorkspaceId.trim() || undefined,
      apiKey: form.apiKey.trim(),
      apiToken: form.apiToken.trim(),
      isActive: form.isActive,
    };

    if (form.id) {
      updateMutation.mutate({ id: form.id, data: payload });
    } else {
      saveMutation.mutate(payload);
    }
  };

  if (isLoading) {
    return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Department Workspaces</h1>
        <p className="text-muted-foreground">Manage workspace-level Trello credentials and link them to departments.</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Plus className="h-5 w-5" />{form.id ? "Edit Workspace" : "Add Workspace"}</CardTitle>
            <CardDescription>Use this settings area instead of keeping all Trello access on one global key.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2"><Label>Name</Label><Input value={form.name} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} /></div>
            <div className="space-y-2">
              <Label>Department</Label>
              <Select value={form.departmentId} onValueChange={(value) => setForm((s) => ({ ...s, departmentId: value }))}>
                <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Unassigned</SelectItem>
                  {departments.map((department) => <SelectItem key={department.id} value={String(department.id)}>{department.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Trello Workspace ID</Label><Input value={form.trelloWorkspaceId} onChange={(e) => setForm((s) => ({ ...s, trelloWorkspaceId: e.target.value }))} /></div>
            <div className="space-y-2"><Label>API Key</Label><Input value={form.apiKey} onChange={(e) => setForm((s) => ({ ...s, apiKey: e.target.value }))} /></div>
            <div className="space-y-2"><Label>API Token</Label><Input type="password" value={form.apiToken} onChange={(e) => setForm((s) => ({ ...s, apiToken: e.target.value }))} /></div>
            <div className="flex items-center gap-2">
              <Button onClick={handleSubmit} disabled={saveMutation.isPending || updateMutation.isPending}>{form.id ? "Save Changes" : "Create Workspace"}</Button>
              <Button variant="outline" onClick={() => setForm(EMPTY_FORM)}>Reset</Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {sortedWorkspaces.map((workspace) => (
            <Card key={workspace.id}>
              <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-base">{workspace.name}</CardTitle>
                    <CardDescription>{workspace.departmentName || "No department linked"}</CardDescription>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={workspace.isActive ? "default" : "secondary"}>{workspace.isActive ? "Active" : "Inactive"}</Badge>
                    <Button variant="outline" size="sm" onClick={() => setForm({
                      id: workspace.id,
                      name: workspace.name,
                      departmentId: workspace.departmentId ? String(workspace.departmentId) : "none",
                      trelloWorkspaceId: workspace.trelloWorkspaceId || "",
                      apiKey: workspace.apiKey || "",
                      apiToken: workspace.apiToken || "",
                      isActive: !!workspace.isActive,
                    })}>Edit</Button>
                    <Button variant="outline" size="sm" onClick={() => testMutation.mutate({ id: workspace.id })}><CheckCircle2 className="mr-2 h-4 w-4" />Test</Button>
                    {!workspace.trelloWorkspaceId && (
                      <Button variant="outline" size="sm" onClick={() => autoLinkMutation.mutate({ id: workspace.id })} disabled={autoLinkMutation.isPending}>
                        <Link2 className="mr-2 h-4 w-4" />Auto-Link
                      </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={() => boardMutation.mutate({ id: workspace.id })} disabled={boardMutation.isPending}>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Boards{boardCounts[workspace.id] !== undefined ? ` (${boardCounts[workspace.id]})` : ""}
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => deleteMutation.mutate({ id: workspace.id })}><Trash2 className="mr-2 h-4 w-4" />Delete</Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-3">
                <div className="rounded-xl border p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Workspace ID</p>
                  <p className="mt-1 text-sm font-medium font-mono">
                    {workspace.trelloWorkspaceId ? `${workspace.trelloWorkspaceId.slice(0, 8)}...` : "—"}
                  </p>
                </div>
                <div className="rounded-xl border p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">API Key</p>
                  <p className="mt-1 text-sm font-medium">
                    {workspace.apiKey ? `${workspace.apiKey.slice(0, 6)}••••` : "—"}
                  </p>
                </div>
                <div className="rounded-xl border p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Linked Department</p>
                  <p className="mt-1 text-sm font-medium">
                    {workspace.departmentName || "Unassigned"}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}

          {sortedWorkspaces.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center gap-3 py-12 text-center text-muted-foreground">
                <Users className="h-8 w-8" />
                <p>No workspaces found.</p>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}
