import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, UserCog } from "lucide-react";
import { toast } from "sonner";

const ROLES = ['employee', 'team_leader', 'director', 'cmo', 'ceo', 'admin', 'super_admin'] as const;

export default function UserManagementPage() {
  const { data: users, isLoading, refetch } = trpc.userManagement.list.useQuery();
  const { data: employees } = trpc.employees.list.useQuery();

  const updateRoleMutation = trpc.userManagement.updateRole.useMutation({
    onSuccess: () => { toast.success("Role updated"); refetch(); },
    onError: (err) => toast.error(err.message),
  });

  const linkEmployeeMutation = trpc.userManagement.linkEmployee.useMutation({
    onSuccess: () => { toast.success("Employee linked"); refetch(); },
    onError: (err) => toast.error(err.message),
  });

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
        <p className="text-muted-foreground">{users?.length || 0} registered users</p>
      </div>

      <div className="space-y-3">
        {users?.map(user => (
          <Card key={user.id}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <UserCog className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{user.name || "Unknown"}</CardTitle>
                    <p className="text-xs text-muted-foreground">{user.email || "No email"}</p>
                  </div>
                </div>
                <Badge variant="outline">{user.role.replace('_', ' ')}</Badge>
              </div>
            </CardHeader>
            <CardContent className="text-sm">
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Role:</span>
                  <Select
                    value={user.role}
                    onValueChange={(val) => updateRoleMutation.mutate({ userId: user.id, role: val as typeof ROLES[number] })}
                  >
                    <SelectTrigger className="w-[160px] h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLES.map(role => (
                        <SelectItem key={role} value={role}>{role.replace('_', ' ')}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Link to Employee:</span>
                  <Select
                    onValueChange={(val) => linkEmployeeMutation.mutate({ userId: user.id, employeeId: parseInt(val) })}
                  >
                    <SelectTrigger className="w-[200px] h-8">
                      <SelectValue placeholder="Select employee" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees?.map(emp => (
                        <SelectItem key={emp.id} value={String(emp.id)}>{emp.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <p className="text-xs text-muted-foreground">Last sign in: {user.lastSignedIn ? new Date(user.lastSignedIn).toLocaleString() : "Never"}</p>
              </div>
            </CardContent>
          </Card>
        ))}
        {(!users || users.length === 0) && (
          <div className="text-center py-12 text-muted-foreground">No users found.</div>
        )}
      </div>
    </div>
  );
}
