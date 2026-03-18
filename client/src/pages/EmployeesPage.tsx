import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, UserPlus } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function EmployeesPage() {
  const { data: employees, isLoading } = trpc.employees.list.useQuery();
  const [, setLocation] = useLocation();

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Employees</h1>
          <p className="text-muted-foreground">{employees?.length || 0} employees</p>
        </div>
        <Button onClick={() => toast.info("Feature coming soon")}><UserPlus className="h-4 w-4 mr-2" />Add Employee</Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {employees?.map(emp => (
          <Card key={emp.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setLocation(`/employees/${emp.id}`)}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{emp.name}</CardTitle>
                <Badge variant={emp.isActive ? "default" : "secondary"}>{emp.isActive ? "Active" : "Inactive"}</Badge>
              </div>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-1">
              <p>{emp.departmentName || "No department"}</p>
              <p>{emp.position || "No position"}</p>
              {emp.email && <p>{emp.email}</p>}
            </CardContent>
          </Card>
        ))}
        {(!employees || employees.length === 0) && (
          <div className="col-span-full text-center py-12 text-muted-foreground">No employees found.</div>
        )}
      </div>
    </div>
  );
}
