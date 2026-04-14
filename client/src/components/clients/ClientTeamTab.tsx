import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export function ClientTeamTab({ clientId }: { clientId: number }) {
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.clientAssignments.list.useQuery({ clientId });
  const employeesQuery = trpc.employees?.list?.useQuery?.() ?? { data: [] };
  const departmentsQuery = trpc.departments?.list?.useQuery?.() ?? { data: [] };

  const [employeeId, setEmployeeId] = useState("");
  const [departmentId, setDepartmentId] = useState("");

  const assignMutation = trpc.clientAssignments.assign.useMutation({
    onSuccess: async () => {
      await utils.clientAssignments.list.invalidate({ clientId });
      toast.success("Assignment saved");
      setEmployeeId("");
      setDepartmentId("");
    },
    onError: (error) => toast.error(error.message),
  });

  const unassignMutation = trpc.clientAssignments.unassign.useMutation({
    onSuccess: async () => {
      await utils.clientAssignments.list.invalidate({ clientId });
      toast.success("Assignment removed");
    },
    onError: (error) => toast.error(error.message),
  });

  const employeeOptions = useMemo(() => employeesQuery.data ?? [], [employeesQuery.data]);
  const departmentOptions = useMemo(() => departmentsQuery.data ?? [], [departmentsQuery.data]);

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="grid gap-4 p-4 md:grid-cols-2">
          <div className="grid gap-2">
            <Label>Assign employee</Label>
            <select
              className="h-10 rounded-md border bg-background px-3"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
            >
              <option value="">Select employee</option>
              {employeeOptions.map((employee: any) => (
                <option key={employee.id} value={employee.id}>
                  {employee.name}
                </option>
              ))}
            </select>
            <Button
              disabled={!employeeId || assignMutation.isPending}
              onClick={() => assignMutation.mutate({ clientId, employeeId: Number(employeeId) })}
            >
              Assign employee
            </Button>
          </div>

          <div className="grid gap-2">
            <Label>Assign department</Label>
            <select
              className="h-10 rounded-md border bg-background px-3"
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
            >
              <option value="">Select department</option>
              {departmentOptions.map((department: any) => (
                <option key={department.id} value={department.id}>
                  {department.name}
                </option>
              ))}
            </select>
            <Button
              disabled={!departmentId || assignMutation.isPending}
              variant="outline"
              onClick={() => assignMutation.mutate({ clientId, departmentId: Number(departmentId) })}
            >
              Assign department
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3">
        {isLoading ? (
          <div className="text-sm text-muted-foreground">Loading assignments...</div>
        ) : (data ?? []).length === 0 ? (
          <div className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
            No assignments yet.
          </div>
        ) : (
          (data ?? []).map((assignment) => (
            <Card key={assignment.id}>
              <CardContent className="flex items-center justify-between gap-4 p-4">
                <div className="space-y-1 text-sm">
                  {assignment.employeeName ? <div><span className="font-medium">Employee:</span> {assignment.employeeName}</div> : null}
                  {assignment.departmentName ? <div><span className="font-medium">Department:</span> {assignment.departmentName}</div> : null}
                </div>
                <Button variant="destructive" size="sm" onClick={() => unassignMutation.mutate({ id: assignment.id })}>
                  Remove
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
