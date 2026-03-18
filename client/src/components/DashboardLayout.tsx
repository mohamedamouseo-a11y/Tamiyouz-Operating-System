import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { getLoginUrl } from "@/const";
import { useIsMobile } from "@/hooks/useMobile";
import {
  LayoutDashboard, Users, Briefcase, Building, FileText, BarChart,
  Settings, Bell, ListChecks, LogOut, PanelLeft, UserCog, CalendarDays, Sparkles, X,
} from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from './DashboardLayoutSkeleton';
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import { AIChatSidebar } from "./AIChatSidebar";
import { cn } from "@/lib/utils";

const ROLE_HIERARCHY: Record<string, number> = {
  super_admin: 7, admin: 6, ceo: 5, cmo: 4, director: 3, team_leader: 2, employee: 1,
};

interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
  minRole: number;
}

const mainNavItems: NavItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/", minRole: 1 },
  { icon: ListChecks, label: "My Tasks", path: "/my-tasks", minRole: 1 },
  { icon: CalendarDays, label: "My Reports", path: "/my-reports", minRole: 1 },
  { icon: Users, label: "Employees", path: "/employees", minRole: 2 },
  { icon: Briefcase, label: "Clients", path: "/clients", minRole: 2 },
  { icon: FileText, label: "Daily Reports", path: "/reports", minRole: 2 },
  { icon: BarChart, label: "Analytics", path: "/analytics", minRole: 2 },
  { icon: Bell, label: "Alerts", path: "/alerts", minRole: 1 },
];

const adminNavItems: NavItem[] = [
  { icon: Building, label: "Departments", path: "/departments", minRole: 6 },
  { icon: UserCog, label: "User Management", path: "/settings/users", minRole: 6 },
  { icon: Settings, label: "Trello Settings", path: "/settings/trello", minRole: 6 },
];

const SIDEBAR_WIDTH_KEY = "sidebar-width";
const DEFAULT_WIDTH = 280;
const MIN_WIDTH = 200;
const MAX_WIDTH = 480;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });
  const { loading, user } = useAuth();

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  if (loading) {
    return <DashboardLayoutSkeleton />;
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-8 p-8 max-w-md w-full">
          <div className="flex flex-col items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-center text-foreground">
              TOS - Tamiyouz Operating System
            </h1>
            <p className="text-sm text-muted-foreground text-center font-medium" dir="rtl">
              التميز ليس مهارة بل موقف
            </p>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              Sign in to access your dashboard
            </p>
          </div>
          <Button
            onClick={() => { window.location.href = getLoginUrl(); }}
            size="lg"
            className="w-full shadow-lg hover:shadow-xl transition-all"
          >
            Sign in
          </Button>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider
      style={{ "--sidebar-width": `${sidebarWidth}px` } as CSSProperties}
    >
      <DashboardLayoutContent setSidebarWidth={setSidebarWidth}>
        {children}
      </DashboardLayoutContent>
    </SidebarProvider>
  );
}

function DashboardLayoutContent({
  children,
  setSidebarWidth,
}: {
  children: React.ReactNode;
  setSidebarWidth: (width: number) => void;
}) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const [showChat, setShowChat] = useState(false);

  const userRoleLevel = ROLE_HIERARCHY[user?.role || 'employee'] || 1;
  const filteredMainNav = mainNavItems.filter(item => {
    if (userRoleLevel >= 2 && (item.path === '/my-tasks' || item.path === '/my-reports')) return false;
    return userRoleLevel >= item.minRole;
  });
  const filteredAdminNav = adminNavItems.filter(item => userRoleLevel >= item.minRole);

  const activeMenuItem = [...mainNavItems, ...adminNavItems].find(item =>
    item.path === '/' ? location === '/' : location.startsWith(item.path)
  );

  useEffect(() => {
    if (isCollapsed) setIsResizing(false);
  }, [isCollapsed]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const sidebarLeft = sidebarRef.current?.getBoundingClientRect().left ?? 0;
      const newWidth = e.clientX - sidebarLeft;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) setSidebarWidth(newWidth);
    };
    const handleMouseUp = () => setIsResizing(false);
    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, setSidebarWidth]);

  return (
    <>
      <div className="relative" ref={sidebarRef}>
        <Sidebar collapsible="icon" className="border-r-0" disableTransition={isResizing}>
          <SidebarHeader className="h-16 justify-center">
            <div className="flex items-center gap-3 px-2 transition-all w-full">
              <button
                onClick={toggleSidebar}
                className="h-8 w-8 flex items-center justify-center hover:bg-accent rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring shrink-0"
                aria-label="Toggle navigation"
              >
                <PanelLeft className="h-4 w-4 text-muted-foreground" />
              </button>
              {!isCollapsed && (
                <div className="flex flex-col min-w-0">
                  <span className="font-semibold tracking-tight truncate text-foreground">TOS</span>
                  <span className="text-[0.6rem] text-muted-foreground truncate" dir="rtl">التميز ليس مهارة بل موقف</span>
                </div>
              )}
            </div>
          </SidebarHeader>

          <SidebarContent className="gap-0">
            <SidebarMenu className="px-2 py-1">
              {filteredMainNav.map(item => {
                const isActive = item.path === '/' ? location === '/' : location.startsWith(item.path);
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      isActive={isActive}
                      onClick={() => setLocation(item.path)}
                      tooltip={item.label}
                      className="h-10 transition-all font-normal"
                    >
                      <item.icon className={cn("h-4 w-4", isActive && "text-primary")} />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>

            {filteredAdminNav.length > 0 && (
              <>
                <Separator className="my-2 mx-3" />
                <div className={cn("px-4 py-1 text-xs font-semibold uppercase text-muted-foreground", isCollapsed && "sr-only")}>
                  Admin
                </div>
                <SidebarMenu className="px-2 py-1">
                  {filteredAdminNav.map(item => {
                    const isActive = location.startsWith(item.path);
                    return (
                      <SidebarMenuItem key={item.path}>
                        <SidebarMenuButton
                          isActive={isActive}
                          onClick={() => setLocation(item.path)}
                          tooltip={item.label}
                          className="h-10 transition-all font-normal"
                        >
                          <item.icon className={cn("h-4 w-4", isActive && "text-primary")} />
                          <span>{item.label}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </>
            )}
          </SidebarContent>

          <SidebarFooter className="p-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 rounded-lg px-1 py-1 hover:bg-accent/50 transition-colors w-full text-left group-data-[collapsible=icon]:justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <Avatar className="h-9 w-9 border shrink-0">
                    <AvatarFallback className="text-xs font-medium bg-primary/10 text-primary">
                      {user?.name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                    <p className="text-sm font-medium truncate leading-none">{user?.name || "-"}</p>
                    <p className="text-xs text-muted-foreground truncate mt-1.5">{user?.role?.replace('_', ' ')}</p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  onClick={logout}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>
        <div
          className={cn(
            "absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-primary/20 transition-colors",
            isCollapsed && "hidden"
          )}
          onMouseDown={() => { if (!isCollapsed) setIsResizing(true); }}
          style={{ zIndex: 50 }}
        />
      </div>

      <SidebarInset>
        {isMobile && (
          <div className="flex border-b h-14 items-center justify-between bg-background/95 px-2 backdrop-blur supports-[backdrop-filter]:backdrop-blur sticky top-0 z-40">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="h-9 w-9 rounded-lg bg-background" />
              <span className="tracking-tight text-foreground">{activeMenuItem?.label ?? "TOS"}</span>
            </div>
          </div>
        )}
        <main className="flex-1 p-4 relative">
          {children}
        </main>

        {/* AI Chat Toggle */}
        <Button
          variant="default"
          size="icon"
          className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg"
          onClick={() => setShowChat(!showChat)}
          aria-label="Toggle AI Chat"
        >
          {showChat ? <X className="h-6 w-6" /> : <Sparkles className="h-6 w-6" />}
        </Button>

        <AIChatSidebar isOpen={showChat} onClose={() => setShowChat(false)} />
      </SidebarInset>
    </>
  );
}
