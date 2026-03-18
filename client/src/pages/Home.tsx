import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Users, ListChecks, Clock, FileText } from "lucide-react";

export default function Home() {
  const { user } = useAuth();
  const roleLevel = getRoleLevel(user?.role);

  const { data: overview, isLoading } = trpc.analytics.overview.useQuery(undefined, {
    enabled: roleLevel >= 2,
  });

  const { data: myEmployee } = trpc.employees.getMe.useQuery(undefined, {
    enabled: roleLevel < 2,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Welcome back, {user?.name || "User"}
        </h1>
        <p className="text-muted-foreground mt-1">
          {roleLevel >= 6 ? "Admin Dashboard" : roleLevel >= 2 ? "Management Dashboard" : "Employee Dashboard"}
        </p>
      </div>

      {roleLevel >= 2 && overview && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overview.totalEmployees}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tasks Today</CardTitle>
              <ListChecks className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overview.tasksToday}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {overview.tasksByStatus?.done || 0} completed
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Hours Today</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overview.hoursToday.toFixed(1)}h</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Reports Today</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overview.reportsToday}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {roleLevel < 2 && myEmployee && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Your Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p><span className="text-muted-foreground">Name:</span> {myEmployee.name}</p>
              <p><span className="text-muted-foreground">Department:</span> {myEmployee.departmentName}</p>
              <p><span className="text-muted-foreground">Position:</span> {myEmployee.position || 'N/A'}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {roleLevel < 2 && !myEmployee && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <p>Your employee profile has not been linked yet. Please contact your administrator.</p>
          </CardContent>
        </Card>
      )}

      <div className="text-center py-8" dir="rtl">
        <p className="text-lg font-semibold text-primary/70">التميز ليس مهارة بل موقف</p>
        <p className="text-xs text-muted-foreground mt-1">Tamiyouz Operating System</p>
      </div>
    </div>
  );
}

function getRoleLevel(role?: string): number {
  const levels: Record<string, number> = {
    super_admin: 7, admin: 6, ceo: 5, cmo: 4, director: 3, team_leader: 2, employee: 1,
  };
  return levels[role || 'employee'] || 1;
}
