import { useEffect, useMemo, useState } from "react";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";

import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type EditableEmployee = {
  id: number;
  name: string;
  nameAr?: string | null;
  email?: string | null;
  phone?: string | null;
  departmentId: number;
  position?: string | null;
  departmentWorkspaceId?: number | null;
  trelloBoardId?: string | null;
  trelloBoardUrl?: string | null;
};

type EditEmployeeDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: EditableEmployee | null | undefined;
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

const EMPTY_FORM: FormState = {
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

export default function EditEmployeeDialog({ open, onOpenChange, employee }: EditEmployeeDialogProps) {
  const utils = trpc.useUtils();
  const { data: departments = [], isLoading: departmentsLoading } = trpc.departments.list.useQuery();
  const { data: workspaces = [] } = trpc.departmentWorkspaces.listAll.useQuery(undefined, { enabled: open });
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  useEffect(() => {
    if (open && employee) {
      setForm({
        name: employee.name ?? "",
        nameAr: employee.nameAr ?? "",
        email: employee.email ?? "",
        phone: employee.phone ?? "",
        departmentId: employee.departmentId ? String(employee.departmentId) : "",
        position: employee.position ?? "",
        departmentWorkspaceId: employee.departmentWorkspaceId ? String(employee.departmentWorkspaceId) : "none",
        trelloBoardId: employee.trelloBoardId ?? "",
        trelloBoardUrl: employee.trelloBoardUrl ?? "",
      });
      return;
    }
    if (!open) setForm(EMPTY_FORM);
  }, [employee, open]);

  const sortedDepartments = useMemo(() => [...departments].sort((a, b) => a.name.localeCompare(b.name)), [departments]);
  const filteredWorkspaces = useMemo(() => {
    if (!form.departmentId) return workspaces;
    return workspaces.filter((workspace) => !workspace.departmentId || String(workspace.departmentId) === form.departmentId);
  }, [form.departmentId, workspaces]);

  const updateEmployeeMutation = trpc.employees.update.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.employees.list.invalidate(),
        employee ? utils.employees.getById.invalidate({ id: employee.id }) : Promise.resolve(),
      ]);
      toast.success("Employee updated successfully.");
      onOpenChange(false);
    },
    onError: (error) => toast.error(error.message || "Failed to update employee."),
  });

  const updateField = (key: keyof FormState, value: string) => {
    setForm((current) => {
      const next = { ...current, [key]: value };
      if (key === "departmentId") {
        const currentWorkspace = workspaces.find((workspace) => String(workspace.id) === current.departmentWorkspaceId);
        if (current.departmentWorkspaceId !== "none" && currentWorkspace?.departmentId && String(currentWorkspace.departmentId) !== value) {
          next.departmentWorkspaceId = "none";
        }
      }
      return next;
    });
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!employee) return toast.error("Employee data is unavailable.");
    if (!form.name.trim()) return toast.error("Employee name is required.");
    if (!form.departmentId) return toast.error("Please select a department.");

    updateEmployeeMutation.mutate({
      id: employee.id,
      name: form.name.trim(),
      nameAr: form.nameAr.trim() || undefined,
      email: form.email.trim() || undefined,
      phone: form.phone.trim() || undefined,
      departmentId: Number(form.departmentId),
      position: form.position.trim() || undefined,
      departmentWorkspaceId: form.departmentWorkspaceId !== "none" ? Number(form.departmentWorkspaceId) : null,
      trelloBoardId: form.trelloBoardId.trim() || undefined,
      trelloBoardUrl: form.trelloBoardUrl.trim() || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-border bg-background text-foreground sm:max-w-[720px]">
        <DialogHeader><DialogTitle className="text-xl font-semibold">Edit Employee</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2"><Label htmlFor="edit-employee-name">Name</Label><Input id="edit-employee-name" value={form.name} onChange={(e) => updateField("name", e.target.value)} disabled={updateEmployeeMutation.isPending} /></div>
            <div className="space-y-2"><Label htmlFor="edit-employee-name-ar">Arabic Name</Label><Input id="edit-employee-name-ar" value={form.nameAr} onChange={(e) => updateField("nameAr", e.target.value)} disabled={updateEmployeeMutation.isPending} /></div>
            <div className="space-y-2"><Label htmlFor="edit-employee-email">Email</Label><Input id="edit-employee-email" type="email" value={form.email} onChange={(e) => updateField("email", e.target.value)} disabled={updateEmployeeMutation.isPending} /></div>
            <div className="space-y-2"><Label htmlFor="edit-employee-phone">Phone</Label><Input id="edit-employee-phone" value={form.phone} onChange={(e) => updateField("phone", e.target.value)} disabled={updateEmployeeMutation.isPending} /></div>
            <div className="space-y-2">
              <Label>Department</Label>
              <Select value={form.departmentId} onValueChange={(value) => updateField("departmentId", value)} disabled={departmentsLoading || updateEmployeeMutation.isPending}>
                <SelectTrigger><SelectValue placeholder={departmentsLoading ? "Loading departments..." : "Select department"} /></SelectTrigger>
                <SelectContent>{sortedDepartments.map((department) => <SelectItem key={department.id} value={String(department.id)}>{department.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label htmlFor="edit-employee-position">Position</Label><Input id="edit-employee-position" value={form.position} onChange={(e) => updateField("position", e.target.value)} disabled={updateEmployeeMutation.isPending} /></div>
            <div className="space-y-2">
              <Label>Workspace</Label>
              <Select value={form.departmentWorkspaceId} onValueChange={(value) => updateField("departmentWorkspaceId", value)} disabled={updateEmployeeMutation.isPending}>
                <SelectTrigger><SelectValue placeholder="Select workspace" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No workspace</SelectItem>
                  {filteredWorkspaces.map((workspace) => <SelectItem key={workspace.id} value={String(workspace.id)}>{workspace.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label htmlFor="edit-employee-board-id">Trello Board ID</Label><Input id="edit-employee-board-id" value={form.trelloBoardId} onChange={(e) => updateField("trelloBoardId", e.target.value)} disabled={updateEmployeeMutation.isPending} /></div>
          </div>
          <div className="space-y-2"><Label htmlFor="edit-employee-board-url">Trello Board URL</Label><Input id="edit-employee-board-url" value={form.trelloBoardUrl} onChange={(e) => updateField("trelloBoardUrl", e.target.value)} disabled={updateEmployeeMutation.isPending} /></div>
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={updateEmployeeMutation.isPending}>Cancel</Button>
            <Button type="submit" disabled={updateEmployeeMutation.isPending || !employee}>{updateEmployeeMutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : <><Save className="mr-2 h-4 w-4" />Save Changes</>}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
