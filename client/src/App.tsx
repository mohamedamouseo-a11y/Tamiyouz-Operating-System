import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardLayout from "./components/DashboardLayout";
import Home from "./pages/Home";
import EmployeesPage from "./pages/EmployeesPage";
import EmployeeDetailPage from "./pages/EmployeeDetailPage";
import ClientsPage from "./pages/ClientsPage";
import DepartmentsPage from "./pages/DepartmentsPage";
import DailyReportsPage from "./pages/DailyReportsPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import MyTasksPage from "./pages/MyTasksPage";
import MyReportsPage from "./pages/MyReportsPage";
import TrelloSettingsPage from "./pages/TrelloSettingsPage";
import UserManagementPage from "./pages/UserManagementPage";
import AlertsPage from "./pages/AlertsPage";
import HelpCenterPage from "./pages/HelpCenterPage";
import HelpArticlePage from "./pages/HelpArticlePage";
import HelpAdminPage from "./pages/HelpAdminPage";
import CommentsPage from "./pages/CommentsPage";
import ActivityLogPage from "./pages/ActivityLogPage";
import { useAuth } from "./_core/hooks/useAuth";


function Router() {
  const { user } = useAuth();

  return (
    <DashboardLayout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/employees" component={EmployeesPage} />
        <Route path="/employees/:id" component={EmployeeDetailPage} />
        <Route path="/clients" component={ClientsPage} />
        <Route path="/departments" component={DepartmentsPage} />
        <Route path="/reports" component={DailyReportsPage} />
        <Route path="/analytics" component={AnalyticsPage} />
        <Route path="/my-tasks" component={MyTasksPage} />
        <Route path="/my-reports" component={MyReportsPage} />
        <Route path="/settings/trello" component={TrelloSettingsPage} />
        <Route path="/settings/users" component={UserManagementPage} />
        <Route path="/alerts" component={AlertsPage} />
        <Route path="/help" component={HelpCenterPage} />
        <Route path="/help/:slug" component={HelpArticlePage} />
        {user && ["admin", "super_admin"].includes(user.role) ? (
          <Route path="/help/admin" component={HelpAdminPage} />
        ) : null}
        <Route path="/issues" component={CommentsPage} />
        <Route path="/activity-log" component={ActivityLogPage} />
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </DashboardLayout>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster richColors />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
