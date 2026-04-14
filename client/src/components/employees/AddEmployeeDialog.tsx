import { useEffect, useMemo, useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type AddEmployeeDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type FormState = {
  name: string;
  nameAr: string;
  email: string;
  phone: string;
  departmentId: string;
  position: string;
  departmentWorkspaceId: string;
  trelloBoardId: string;
  trelloBoardUrl: string;
};

const INITIAL_FORM: FormState = {
  name: "",
  nameAr: "",
  email: "",
  phone: "",
  departmentId: "",
  position: "",
  departmentWorkspaceId: "none",
  trelloBoardId: "",
  trelloBoardUrl: "",
};

export default function AddEmployeeDialog({ open, onOpenChange }: AddEmployeeDialogProps) {
  const utils = trpc.useUtils();
  const { data: departments = [], isLoading: departmentsLoading } = trpc.departments.list.useQuery();
  const { data: workspaces = [] } = trpc.departmentWorkspaces.listAll.useQuery(undefined, {
    enabled: open,
  });
  const [form, setForm] = useState<FormState>(INITIAL_FORM);

  useEffect(() => {
    if (!open) setForm(INITIAL_FORM);
  }, [open]);

  const sortedDepartments = useMemo(
    () => [...departments].sort((a, b) => a.name.localeCompare(b.name)),
    [departments],
  );

  const filteredWorkspaces = useMemo(() => {
    if (!form.departmentId) return workspaces;
    return workspaces.filter(
      (workspace) => !workspace.departmentId || String(workspace.departmentId) === form.departmentId,
    );
  }, [form.departmentId, workspaces]);

  const createEmployeeMutation = trpc.employees.create.useMutation({
    onSuccess: async () => {
      await utils.employees.list.invalidate();
      toast.success("Employee created successfully.");
      setForm(INITIAL_FORM);
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create employee.");
    },
  });

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.name.trim()) return toast.error("Employee name is required.");
    if (!form.departmentId) return toast.error("Please select a department.");

    createEmployeeMutation.mutate({
      name: form.name.trim(),
      nameAr: form.nameAr.trim() || undefined,
      email: form.email.trim() || undefined,
      phone: form.phone.trim() || undefined,
      departmentId: Number(form.departmentId),
      position: form.position.trim() || undefined,
      departmentWorkspaceId:
        form.departmentWorkspaceId !== "none" ? Number(form.departmentWorkspaceId) : null,
      trelloBoardId: form.trelloBoardId.trim() || undefined,
      trelloBoardUrl: form.trelloBoardUrl.trim() || undefined,
    });
  };

  const updateField = (key: keyof FormState, value: string) => {
    setForm((current) => {
      const next = { ...current, [key]: value };
      if (key === "departmentId") {
        const currentWorkspace = workspaces.find(
          (workspace) => String(workspace.id) === current.departmentWorkspaceId,
        );
        if (
          current.departmentWorkspaceId !== "none" &&
          currentWorkspace &&
          currentWorkspace.departmentId &&
          String(currentWorkspace.departmentId) !== value
        ) {
          next.departmentWorkspaceId = "none";
        }
      }
      return next;
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-border bg-background text-foreground sm:max-w-[720px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Add Employee</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="employee-name">Name</Label>
              <Input id="employee-name" value={form.name} onChange={(e) => updateField("name", e.target.value)} disabled={createEmployeeMutation.isPending} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="employee-name-ar">Arabic Name</Label>
              <Input id="employee-name-ar" value={form.nameAr} onChange={(e) => updateField("nameAr", e.target.value)} disabled={createEmployeeMutation.isPending} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="employee-email">Email</Label>
              <Input id="employee-email" type="email" value={form.email} onChange={(e) => updateField("email", e.target.value)} disabled={createEmployeeMutation.isPending} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="employee-phone">Phone</Label>
              <Input id="employee-phone" value={form.phone} onChange={(e) => updateField("phone", e.target.value)} disabled={createEmployeeMutation.isPending} />
            </div>
            <div className="space-y-2">
              <Label>Department</Label>
              <Select value={form.departmentId} onValueChange={(value) => updateField("departmentId", value)} disabled={departmentsLoading || createEmployeeMutation.isPending}>
                <SelectTrigger>
                  <SelectValue placeholder={departmentsLoading ? "Loading departments..." : "Select department"} />
                </SelectTrigger>
                <SelectContent>
                  {sortedDepartments.map((department) => (
                    <SelectItem key={department.id} value={String(department.id)}>{department.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="employee-position">Position</Label>
              <Input id="employee-position" value={form.position} onChange={(e) => updateField("position", e.target.value)} disabled={createEmployeeMutation.isPending} />
            </div>
            <div className="space-y-2">
              <Label>Workspace</Label>
              <Select value={form.departmentWorkspaceId} onValueChange={(value) => updateField("departmentWorkspaceId", value)} disabled={createEmployeeMutation.isPending}>
                <SelectTrigger>
                  <SelectValue placeholder="Select workspace" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No workspace</SelectItem>
                  {filteredWorkspaces.map((workspace) => (
                    <SelectItem key={workspace.id} value={String(workspace.id)}>
                      {workspace.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="employee-trello-board-id">Trello Board ID</Label>
              <Input id="employee-trello-board-id" value={form.trelloBoardId} onChange={(e) => updateField("trelloBoardId", e.target.value)} disabled={createEmployeeMutation.isPending} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="employee-trello-board-url">Trello Board URL</Label>
            <Input id="employee-trello-board-url" value={form.trelloBoardUrl} onChange={(e) => updateField("trelloBoardUrl", e.target.value)} disabled={createEmployeeMutation.isPending} />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={createEmployeeMutation.isPending}>Cancel</Button>
            <Button type="submit" disabled={createEmployeeMutation.isPending}>
              {createEmployeeMutation.isPending ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating...</>
              ) : (
                <><Plus className="mr-2 h-4 w-4" />Create Employee</>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
