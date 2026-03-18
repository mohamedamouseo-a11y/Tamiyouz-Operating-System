import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, Building } from "lucide-react";
import { toast } from "sonner";

export default function DepartmentsPage() {
  const { data: departments, isLoading } = trpc.departments.list.useQuery();

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Departments</h1>
          <p className="text-muted-foreground">{departments?.length || 0} departments</p>
        </div>
        <Button onClick={() => toast.info("Feature coming soon")}><Plus className="h-4 w-4 mr-2" />Add Department</Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {departments?.map(dept => (
          <Card key={dept.id}>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Building className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">{dept.name}</CardTitle>
                  {dept.nameAr && <p className="text-sm text-muted-foreground" dir="rtl">{dept.nameAr}</p>}
                </div>
              </div>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p>{dept.description || "No description"}</p>
            </CardContent>
          </Card>
        ))}
        {(!departments || departments.length === 0) && (
          <div className="col-span-full text-center py-12 text-muted-foreground">No departments found.</div>
        )}
      </div>
    </div>
  );
}
