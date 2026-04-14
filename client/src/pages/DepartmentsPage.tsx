import { useEffect, useMemo, useState } from "react";
import {
  Building,
  CheckCircle2,
  Edit3,
  ExternalLink,
  Loader2,
  Plus,
  RefreshCw,
  Save,
  ShieldCheck,
  Trash2,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useLocation } from "wouter";

type DepartmentFormState = {
  id?: number;
  name: string;
  nameAr: string;
  description: string;
};

type WorkspaceFormState = {
  id?: number;
  departmentId: string;
  name: string;
  trelloWorkspaceId: string;
  apiKey: string;
  apiToken: string;
  isActive: boolean;
};

const EMPTY_DEPARTMENT_FORM: DepartmentFormState = {
  name: "",
  nameAr: "",
  description: "",
};

const EMPTY_WORKSPACE_FORM: WorkspaceFormState = {
  departmentId: "",
  name: "",
  trelloWorkspaceId: "",
  apiKey: "",
  apiToken: "",
  isActive: true,
};

export default function DepartmentsPage() {
  const utils = trpc.useUtils();
  const [, setLocation] = useLocation();
  const { data: departments = [], isLoading: departmentsLoading } = trpc.departments.list.useQuery();
  const { data: allWorkspaces = [], isLoading: workspacesLoading } = trpc.departmentWorkspaces.listAll.useQuery();
  const { data: employees = [] } = trpc.employees.list.useQuery();

  const [selectedDepartmentId, setSelectedDepartmentId] = useState<number | null>(null);
  const [departmentForm, setDepartmentForm] = useState<DepartmentFormState>(EMPTY_DEPARTMENT_FORM);
  const [workspaceForm, setWorkspaceForm] = useState<WorkspaceFormState>(EMPTY_WORKSPACE_FORM);
  const [workspaceBoards, setWorkspaceBoards] = useState<Record<number, Array<{ id: string; name: string }>>>({});

  useEffect(() => {
    if (!departments.length) {
      setSelectedDepartmentId(null);
      setWorkspaceForm((current) => ({ ...current, departmentId: "" }));
      return;
    }

    setSelectedDepartmentId((current) => {
      if (current && departments.some((department) => department.id === current)) {
        return current;
      }
      return departments[0]?.id ?? null;
    });
  }, [departments]);

  useEffect(() => {
    if (!selectedDepartmentId) {
      setWorkspaceForm((current) => ({ ...current, departmentId: "" }));
      return;
    }

    if (!workspaceForm.id) {
      setWorkspaceForm((current) => ({
        ...current,
        departmentId: String(selectedDepartmentId),
      }));
    }
  }, [selectedDepartmentId, workspaceForm.id]);

  const selectedDepartment = useMemo(
    () => departments.find((department) => department.id === selectedDepartmentId) ?? null,
    [departments, selectedDepartmentId],
  );

  const workspaceCounts = useMemo(() => {
    const counts = new Map<number, number>();
    allWorkspaces.forEach((workspace) => {
      if (!workspace.departmentId) return;
      counts.set(workspace.departmentId, (counts.get(workspace.departmentId) ?? 0) + 1);
    });
    return counts;
  }, [allWorkspaces]);

  const employeeCounts = useMemo(() => {
    const counts = new Map<number, number>();
    employees.forEach((employee) => {
      if (!employee.departmentId) return;
      counts.set(employee.departmentId, (counts.get(employee.departmentId) ?? 0) + 1);
    });
    return counts;
  }, [employees]);

  const selectedDepartmentWorkspaces = useMemo(() => {
    if (!selectedDepartmentId) return [];
    return allWorkspaces
      .filter((workspace) => workspace.departmentId === selectedDepartmentId)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [allWorkspaces, selectedDepartmentId]);

  const createDepartmentMutation = trpc.departments.create.useMutation({
    onSuccess: async (created) => {
      await utils.departments.list.invalidate();
      toast.success("Department created.");
      setDepartmentForm(EMPTY_DEPARTMENT_FORM);
      if (created?.id) {
        setSelectedDepartmentId(created.id);
        setWorkspaceForm((current) => ({ ...current, departmentId: String(created.id) }));
      }
    },
    onError: (error) => toast.error(error.message || "Failed to create department."),
  });

  const updateDepartmentMutation = trpc.departments.update.useMutation({
    onSuccess: async () => {
      await utils.departments.list.invalidate();
      toast.success("Department updated.");
      setDepartmentForm(EMPTY_DEPARTMENT_FORM);
    },
    onError: (error) => toast.error(error.message || "Failed to update department."),
  });

  const deleteDepartmentMutation = trpc.departments.delete.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.departments.list.invalidate(),
        utils.departmentWorkspaces.listAll.invalidate(),
        utils.employees.list.invalidate(),
      ]);
      toast.success("Department deleted.");
      setDepartmentForm(EMPTY_DEPARTMENT_FORM);
    },
    onError: (error) => toast.error(error.message || "Failed to delete department."),
  });

  const createWorkspaceMutation = trpc.departmentWorkspaces.create.useMutation({
    onSuccess: async () => {
      await utils.departmentWorkspaces.listAll.invalidate();
      toast.success("Workspace created.");
      setWorkspaceForm({
        ...EMPTY_WORKSPACE_FORM,
        departmentId: selectedDepartmentId ? String(selectedDepartmentId) : "",
      });
    },
    onError: (error) => toast.error(error.message || "Failed to create workspace."),
  });

  const updateWorkspaceMutation = trpc.departmentWorkspaces.update.useMutation({
    onSuccess: async () => {
      await utils.departmentWorkspaces.listAll.invalidate();
      toast.success("Workspace updated.");
      setWorkspaceForm({
        ...EMPTY_WORKSPACE_FORM,
        departmentId: selectedDepartmentId ? String(selectedDepartmentId) : "",
      });
    },
    onError: (error) => toast.error(error.message || "Failed to update workspace."),
  });

  const deleteWorkspaceMutation = trpc.departmentWorkspaces.delete.useMutation({
    onSuccess: async (_, variables) => {
      await utils.departmentWorkspaces.listAll.invalidate();
      toast.success("Workspace deleted.");
      setWorkspaceBoards((current) => {
        const next = { ...current };
        delete next[variables.id];
        return next;
      });
      setWorkspaceForm({
        ...EMPTY_WORKSPACE_FORM,
        departmentId: selectedDepartmentId ? String(selectedDepartmentId) : "",
      });
    },
    onError: (error) => toast.error(error.message || "Failed to delete workspace."),
  });

  const testWorkspaceMutation = trpc.departmentWorkspaces.testConnection.useMutation({
    onSuccess: (result) => {
      if (result.success) {
        toast.success(`Workspace connected${result.memberName ? ` as ${result.memberName}` : ""}.`);
      } else {
        toast.error("Connection failed.");
      }
    },
    onError: (error) => toast.error(error.message || "Failed to test workspace."),
  });

  const getBoardsMutation = trpc.departmentWorkspaces.getBoards.useMutation({
    onSuccess: (boards, variables) => {
      setWorkspaceBoards((current) => ({
        ...current,
        [variables.id]: boards,
      }));
      toast.success(`Loaded ${boards.length} board${boards.length === 1 ? "" : "s"}.`);
    },
    onError: (error) => toast.error(error.message || "Failed to load boards."),
  });

  const handleDepartmentSubmit = () => {
    if (!departmentForm.name.trim()) {
      toast.error("Department name is required.");
      return;
    }

    const payload = {
      name: departmentForm.name.trim(),
      nameAr: departmentForm.nameAr.trim() || undefined,
      description: departmentForm.description.trim() || undefined,
    };

    if (departmentForm.id) {
      updateDepartmentMutation.mutate({
        id: departmentForm.id,
        ...payload,
      });
      return;
    }

    createDepartmentMutation.mutate(payload);
  };

  const handleDepartmentEdit = (department: (typeof departments)[number]) => {
    setSelectedDepartmentId(department.id);
    setDepartmentForm({
      id: department.id,
      name: department.name ?? "",
      nameAr: department.nameAr ?? "",
      description: department.description ?? "",
    });
    setWorkspaceForm((current) => ({
      ...EMPTY_WORKSPACE_FORM,
      departmentId: String(department.id),
      isActive: current.isActive,
    }));
  };

  const handleDepartmentDelete = (departmentId: number) => {
    const linkedEmployees = employeeCounts.get(departmentId) ?? 0;
    if (linkedEmployees > 0) {
      toast.error("Move or deactivate department employees before deleting this department.");
      return;
    }

    const linkedWorkspaces = workspaceCounts.get(departmentId) ?? 0;
    if (linkedWorkspaces > 0) {
      toast.error("Delete or move linked workspaces before deleting this department.");
      return;
    }

    if (!window.confirm("Delete this department? This action cannot be undone.")) {
      return;
    }

    deleteDepartmentMutation.mutate({ id: departmentId });
  };

  const handleWorkspaceSubmit = () => {
    if (!selectedDepartmentId && !workspaceForm.departmentId) {
      toast.error("Select a department first.");
      return;
    }

    if (!workspaceForm.name.trim()) {
      toast.error("Workspace name is required.");
      return;
    }

    if (!workspaceForm.apiKey.trim() || !workspaceForm.apiToken.trim()) {
      toast.error("API key and token are required.");
      return;
    }

    const payload = {
      departmentId: Number(workspaceForm.departmentId || selectedDepartmentId),
      name: workspaceForm.name.trim(),
      trelloWorkspaceId: workspaceForm.trelloWorkspaceId.trim() || undefined,
      apiKey: workspaceForm.apiKey.trim(),
      apiToken: workspaceForm.apiToken.trim(),
      isActive: workspaceForm.isActive,
    };

    if (workspaceForm.id) {
      updateWorkspaceMutation.mutate({
        id: workspaceForm.id,
        data: payload,
      });
      return;
    }

    createWorkspaceMutation.mutate(payload);
  };

  const handleWorkspaceEdit = (workspace: (typeof allWorkspaces)[number]) => {
    setSelectedDepartmentId(workspace.departmentId ?? null);
    setWorkspaceForm({
      id: workspace.id,
      departmentId: workspace.departmentId ? String(workspace.departmentId) : "",
      name: workspace.name ?? "",
      trelloWorkspaceId: workspace.trelloWorkspaceId ?? "",
      apiKey: workspace.apiKey ?? "",
      apiToken: workspace.apiToken ?? "",
      isActive: Boolean(workspace.isActive),
    });
  };

  const handleWorkspaceDelete = (workspaceId: number) => {
    if (!window.confirm("Delete this workspace? Employee workspace links will need to be reassigned.")) {
      return;
    }
    deleteWorkspaceMutation.mutate({ id: workspaceId });
  };

  if (departmentsLoading || workspacesLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Departments</h1>
          <p className="text-muted-foreground">
            Manage departments and their linked workspace-level Trello credentials from one admin area.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setLocation("/settings/workspaces")}> 
            <ExternalLink className="mr-2 h-4 w-4" />
            Open Workspaces Page
          </Button>
          <Button
            onClick={() => {
              setDepartmentForm(EMPTY_DEPARTMENT_FORM);
              setWorkspaceForm({
                ...EMPTY_WORKSPACE_FORM,
                departmentId: selectedDepartmentId ? String(selectedDepartmentId) : "",
              });
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Department
          </Button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              {departmentForm.id ? <Edit3 className="h-5 w-5" /> : <Building className="h-5 w-5" />}
              {departmentForm.id ? "Edit Department" : "Create Department"}
            </CardTitle>
            <CardDescription>
              Remove the old placeholder flow and manage the real department structure here.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Department Name</Label>
              <Input
                value={departmentForm.name}
                onChange={(event) => setDepartmentForm((current) => ({ ...current, name: event.target.value }))}
                placeholder="SEO"
              />
            </div>
            <div className="space-y-2">
              <Label>Arabic Name</Label>
              <Input
                value={departmentForm.nameAr}
                onChange={(event) => setDepartmentForm((current) => ({ ...current, nameAr: event.target.value }))}
                placeholder="تحسين محركات البحث"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={departmentForm.description}
                onChange={(event) =>
                  setDepartmentForm((current) => ({ ...current, description: event.target.value }))
                }
                placeholder="Short department summary"
                className="min-h-[120px]"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={handleDepartmentSubmit}
                disabled={createDepartmentMutation.isPending || updateDepartmentMutation.isPending}
              >
                {createDepartmentMutation.isPending || updateDepartmentMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    {departmentForm.id ? "Save Changes" : "Create Department"}
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => setDepartmentForm(EMPTY_DEPARTMENT_FORM)}
                disabled={createDepartmentMutation.isPending || updateDepartmentMutation.isPending}
              >
                Reset
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          {departments.map((department) => {
            const isSelected = department.id === selectedDepartmentId;
            const linkedWorkspaceCount = workspaceCounts.get(department.id) ?? 0;
            const linkedEmployeeCount = employeeCounts.get(department.id) ?? 0;

            return (
              <Card
                key={department.id}
                className={isSelected ? "border-primary/40 shadow-sm" : undefined}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <CardTitle className="text-base">{department.name}</CardTitle>
                      {department.nameAr ? (
                        <p className="text-sm text-muted-foreground" dir="rtl">
                          {department.nameAr}
                        </p>
                      ) : null}
                    </div>
                    {isSelected ? <Badge>Selected</Badge> : null}
                  </div>
                  <CardDescription>{department.description || "No description yet."}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">
                      <Users className="mr-1 h-3 w-3" />
                      {linkedEmployeeCount} employee{linkedEmployeeCount === 1 ? "" : "s"}
                    </Badge>
                    <Badge variant="outline">
                      <ShieldCheck className="mr-1 h-3 w-3" />
                      {linkedWorkspaceCount} workspace{linkedWorkspaceCount === 1 ? "" : "s"}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={() => setSelectedDepartmentId(department.id)}>
                      Manage Workspaces
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDepartmentEdit(department)}>
                      <Edit3 className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDepartmentDelete(department.id)}
                      disabled={deleteDepartmentMutation.isPending}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {departments.length === 0 ? (
            <Card className="md:col-span-2">
              <CardContent className="py-12 text-center text-muted-foreground">
                No departments found.
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="h-5 w-5" />
              {workspaceForm.id ? "Edit Workspace Credentials" : "Department Workspace Credentials"}
            </CardTitle>
            <CardDescription>
              API key and token live at the workspace level, not inside the employee form.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Department</Label>
              <Input value={selectedDepartment?.name || "No department selected"} disabled />
            </div>
            <div className="space-y-2">
              <Label>Workspace Name</Label>
              <Input
                value={workspaceForm.name}
                onChange={(event) => setWorkspaceForm((current) => ({ ...current, name: event.target.value }))}
                placeholder="SEO Legion 1"
              />
            </div>
            <div className="space-y-2">
              <Label>Trello Workspace ID</Label>
              <Input
                value={workspaceForm.trelloWorkspaceId}
                onChange={(event) =>
                  setWorkspaceForm((current) => ({ ...current, trelloWorkspaceId: event.target.value }))
                }
                placeholder="Optional workspace id"
              />
            </div>
            <div className="space-y-2">
              <Label>API Key</Label>
              <Input
                value={workspaceForm.apiKey}
                onChange={(event) => setWorkspaceForm((current) => ({ ...current, apiKey: event.target.value }))}
                placeholder="Workspace-level Trello API key"
              />
            </div>
            <div className="space-y-2">
              <Label>API Token</Label>
              <Input
                value={workspaceForm.apiToken}
                onChange={(event) => setWorkspaceForm((current) => ({ ...current, apiToken: event.target.value }))}
                placeholder="Workspace-level Trello API token"
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <p className="font-medium">Workspace status</p>
                <p className="text-sm text-muted-foreground">Inactive workspaces will not be used for Trello sync.</p>
              </div>
              <Button
                type="button"
                variant={workspaceForm.isActive ? "default" : "outline"}
                onClick={() =>
                  setWorkspaceForm((current) => ({
                    ...current,
                    isActive: !current.isActive,
                  }))
                }
              >
                {workspaceForm.isActive ? "Active" : "Inactive"}
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={handleWorkspaceSubmit}
                disabled={createWorkspaceMutation.isPending || updateWorkspaceMutation.isPending}
              >
                {createWorkspaceMutation.isPending || updateWorkspaceMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    {workspaceForm.id ? "Save Workspace" : "Create Workspace"}
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  setWorkspaceForm({
                    ...EMPTY_WORKSPACE_FORM,
                    departmentId: selectedDepartmentId ? String(selectedDepartmentId) : "",
                  })
                }
              >
                Reset
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">
              {selectedDepartment ? `${selectedDepartment.name} Workspaces` : "Department Workspaces"}
            </h2>
            <p className="text-sm text-muted-foreground">
              Use this section to test credentials and verify which Trello boards are reachable.
            </p>
          </div>

          {selectedDepartmentWorkspaces.map((workspace) => {
            const boards = workspaceBoards[workspace.id] ?? [];
            return (
              <Card key={workspace.id}>
                <CardHeader>
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <CardTitle className="text-base">{workspace.name}</CardTitle>
                      <CardDescription>
                        {workspace.departmentName || "No department linked"}
                        {workspace.trelloWorkspaceId ? ` • Workspace ID: ${workspace.trelloWorkspaceId}` : ""}
                      </CardDescription>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant={workspace.isActive ? "default" : "secondary"}>
                        {workspace.isActive ? "Active" : "Inactive"}
                      </Badge>
                      <Badge variant="outline">Key: {workspace.apiKey ? `${workspace.apiKey.slice(0, 6)}...` : "—"}</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleWorkspaceEdit(workspace)}>
                      <Edit3 className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => testWorkspaceMutation.mutate({ id: workspace.id })}
                      disabled={testWorkspaceMutation.isPending}
                    >
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Test Connection
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => getBoardsMutation.mutate({ id: workspace.id })}
                      disabled={getBoardsMutation.isPending}
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Load Boards
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleWorkspaceDelete(workspace.id)}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                  </div>

                  {boards.length ? (
                    <div className="rounded-xl border border-border bg-background/40 p-4">
                      <p className="mb-3 text-sm font-medium">Available Boards</p>
                      <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                        {boards.slice(0, 12).map((board) => (
                          <div key={board.id} className="rounded-lg border border-border p-3 text-sm">
                            <p className="font-medium">{board.name}</p>
                            <p className="mt-1 text-xs text-muted-foreground">{board.id}</p>
                          </div>
                        ))}
                      </div>
                      {boards.length > 12 ? (
                        <p className="mt-3 text-xs text-muted-foreground">
                          Showing 12 of {boards.length} boards.
                        </p>
                      ) : null}
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            );
          })}

          {!selectedDepartmentWorkspaces.length ? (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">
                {selectedDepartment
                  ? "No workspaces linked to this department yet. Create one from the form on the left."
                  : "Select a department to manage its workspaces."}
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}
