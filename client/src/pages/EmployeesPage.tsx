import { useMemo, useState } from "react";
import {
  Briefcase,
  Building2,
  Mail,
  Phone,
  Search,
  UserPlus,
  Users,
} from "lucide-react";
import { useLocation } from "wouter";

import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import AddEmployeeDialog from "@/components/employees/AddEmployeeDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

const ROLE_HIERARCHY: Record<string, number> = {
  super_admin: 7,
  admin: 6,
  ceo: 5,
  cmo: 4,
  director: 3,
  team_leader: 2,
  employee: 1,
};

function hasMinRole(role: string | undefined, minRole: keyof typeof ROLE_HIERARCHY) {
  if (!role) return false;
  return (ROLE_HIERARCHY[role] ?? 0) >= ROLE_HIERARCHY[minRole];
}

function getDepartmentBadgeClass(departmentName?: string | null) {
  const normalized = (departmentName || "").toLowerCase();

  if (normalized.includes("seo")) return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
  if (normalized.includes("media")) return "border-sky-500/30 bg-sky-500/10 text-sky-300";
  if (normalized.includes("design")) return "border-fuchsia-500/30 bg-fuchsia-500/10 text-fuchsia-300";
  if (normalized.includes("content")) return "border-amber-500/30 bg-amber-500/10 text-amber-300";
  if (normalized.includes("sales")) return "border-orange-500/30 bg-orange-500/10 text-orange-300";
  if (normalized.includes("operations")) return "border-violet-500/30 bg-violet-500/10 text-violet-300";

  return "border-yellow-500/30 bg-yellow-500/10 text-yellow-200";
}

function getStatusBadgeClass(isActive?: boolean | null) {
  return isActive
    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
    : "border-red-500/30 bg-red-500/10 text-red-300";
}

export default function EmployeesPage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const canManageEmployees = hasMinRole(user?.role, "admin");

  const { data: employees = [], isLoading: employeesLoading } = trpc.employees.list.useQuery();
  const { data: departments = [] } = trpc.departments.list.useQuery();

  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const filteredEmployees = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    return employees.filter((employee) => {
      const matchesSearch =
        !searchValue ||
        employee.name?.toLowerCase().includes(searchValue) ||
        employee.email?.toLowerCase().includes(searchValue);

      const matchesDepartment =
        departmentFilter === "all" || String(employee.departmentId) === departmentFilter;

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && employee.isActive) ||
        (statusFilter === "inactive" && !employee.isActive);

      return matchesSearch && matchesDepartment && matchesStatus;
    });
  }, [departmentFilter, employees, search, statusFilter]);

  const departmentMap = useMemo(() => {
    return new Map(departments.map((department) => [department.id, department]));
  }, [departments]);

  const activeCount = employees.filter((employee) => employee.isActive).length;
  const inactiveCount = employees.length - activeCount;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card/60 p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-yellow-300">
            <Users className="h-5 w-5" />
            <span className="text-sm font-medium uppercase tracking-[0.2em]">Team Directory</span>
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Employees</h1>
            <p className="text-sm text-muted-foreground">
              Manage team members, departments, and current availability.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="rounded-xl border border-border bg-background/60 px-4 py-3 text-center">
            <p className="text-2xl font-bold">{employees.length}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </div>
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-center">
            <p className="text-2xl font-bold text-emerald-300">{activeCount}</p>
            <p className="text-xs text-muted-foreground">Active</p>
          </div>
          <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-center">
            <p className="text-2xl font-bold text-red-300">{inactiveCount}</p>
            <p className="text-xs text-muted-foreground">Inactive</p>
          </div>

          {canManageEmployees && (
            <Button onClick={() => setIsAddDialogOpen(true)} className="ml-auto">
              <UserPlus className="mr-2 h-4 w-4" />
              Add Employee
            </Button>
          )}
        </div>
      </div>

      <Card className="border-border bg-card/60 p-5">
        <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr_1fr]">
          <div className="space-y-2">
            <Label htmlFor="employee-search">Search</Label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="employee-search"
                placeholder="Search by name or email..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Department</Label>
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All departments</SelectItem>
                {departments.map((department) => (
                  <SelectItem key={department.id} value={String(department.id)}>
                    {department.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Separator className="my-5" />

        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            Showing <span className="font-medium text-foreground">{filteredEmployees.length}</span> of{" "}
            <span className="font-medium text-foreground">{employees.length}</span> employees
          </p>
        </div>
      </Card>

      {employeesLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Card key={index} className="border-border bg-card/60 p-5">
              <div className="space-y-4 animate-pulse">
                <div className="h-12 w-12 rounded-full bg-muted" />
                <div className="space-y-2">
                  <div className="h-5 w-2/3 rounded bg-muted" />
                  <div className="h-4 w-1/2 rounded bg-muted" />
                </div>
                <div className="space-y-2">
                  <div className="h-4 w-full rounded bg-muted" />
                  <div className="h-4 w-5/6 rounded bg-muted" />
                  <div className="h-4 w-2/3 rounded bg-muted" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : filteredEmployees.length === 0 ? (
        <Card className="border-dashed border-border bg-card/40 p-10 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-border bg-background/60">
            <Users className="h-6 w-6 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-semibold">No employees found</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Try changing the search term or filters.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredEmployees.map((employee) => {
            const department = departmentMap.get(employee.departmentId);

            return (
              <Card
                key={employee.id}
                className="group cursor-pointer border-border bg-card/60 p-5 transition-all hover:-translate-y-0.5 hover:border-yellow-500/30 hover:shadow-lg"
                onClick={() => setLocation(`/employees/${employee.id}`)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full border border-yellow-500/20 bg-yellow-500/10 text-lg font-semibold text-yellow-200">
                      {employee.name?.slice(0, 1)?.toUpperCase() || "E"}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold group-hover:text-yellow-200">
                        {employee.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">{employee.nameAr || employee.position || "—"}</p>
                    </div>
                  </div>

                  <Badge className={getStatusBadgeClass(employee.isActive)}>
                    {employee.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>

                <Separator className="my-4" />

                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Building2 className="h-4 w-4" />
                    <Badge className={getDepartmentBadgeClass(department?.name)}>
                      {department?.name || "Unknown Department"}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Briefcase className="h-4 w-4" />
                    <span className="truncate">{employee.position || "No position assigned"}</span>
                  </div>

                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span className="truncate">{employee.email || "No email"}</span>
                  </div>

                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <span className="truncate">{employee.phone || "No phone"}</span>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <AddEmployeeDialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} />
    </div>
  );
}
