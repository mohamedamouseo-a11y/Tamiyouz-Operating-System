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
  Settings, Bell, ListChecks, LogOut, PanelLeft, UserCog, CalendarDays, Sparkles, X, Loader2, Bot,
  MessageSquare, Activity, Sun, Moon, BookOpen, Eye, EyeOff, Mail,
} from "lucide-react";
import { CSSProperties, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from './DashboardLayoutSkeleton';
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import HelpChatWidget from "./HelpChatWidget";
import { AIChatSidebar } from "./AIChatSidebar";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useTheme } from "@/contexts/ThemeContext";

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
  { icon: MessageSquare, label: "Issues", path: "/issues", minRole: 1 },
  { icon: Bell, label: "Notifications", path: "/alerts", minRole: 1 },
  { icon: BookOpen, label: "Help Center", path: "/help", minRole: 1 },
];

const adminNavItems: NavItem[] = [
  { icon: Building, label: "Departments", path: "/departments", minRole: 6 },
  { icon: Activity, label: "Activity Log", path: "/activity-log", minRole: 3 },
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
  const { loading, user, refresh } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: () => {
      toast.success("Logged in successfully");
      refresh();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to login");
    },
  });

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  if (loading) {
    return <DashboardLayoutSkeleton />;
  }

  if (!user) {
    return (
      <div className="flex min-h-screen w-full overflow-hidden bg-[#2a2a3a]">
        {/* Left — Video Hero (robot only) */}
        <div className="relative hidden lg:flex lg:w-[42%] xl:w-[45%] items-center justify-center overflow-hidden">
          <video
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            poster="/login-hero-poster.png"
            className="absolute inset-0 h-full w-full object-cover"
            style={{ objectPosition: "center center" }}
          >
            <source src="/login-hero.mp4" type="video/mp4" />
          </video>
          <img
            src="/login-hero-poster.png"
            alt="Tamiyouz TOS"
            className="absolute inset-0 h-full w-full object-cover opacity-0"
            style={{ objectPosition: "center center" }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-[#2a2a3a] pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#2a2a3a]/20 via-transparent to-[#2a2a3a]/20 pointer-events-none" />
        </div>

        {/* Right — Login Form */}
        <div className="flex w-full lg:w-[58%] xl:w-[55%] items-center justify-center p-6 sm:p-10 relative">
          <div className="w-full max-w-[480px] relative z-10">
            <div className="bg-white rounded-[28px] shadow-[0_25px_70px_rgba(0,0,0,0.25)] px-10 py-12 sm:px-14 sm:py-14">
              {/* Logo */}
              <div className="flex flex-col items-center mb-10">
                <img src="/tamiyouz-logo.png" alt="Tamiyouz" className="h-20 w-auto object-contain mb-5" />
                <h1 className="text-[1.75rem] font-bold tracking-tight text-gray-900 text-center leading-tight">Tamiyouz Operating System</h1>
                <p className="text-[14px] text-gray-500 mt-2">Excellence is not a skill, but an attitude.</p>
              </div>
              <form
                className="space-y-6"
                onSubmit={(e) => {
                  e.preventDefault();
                  loginMutation.mutate({ email, password });
                }}
              >
                <div className="space-y-2">
                  <label htmlFor="dash-email" className="block text-[15px] font-semibold text-gray-800">Email Address</label>
                  <div className="relative">
                    <input
                      id="dash-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loginMutation.isPending}
                      className="w-full h-[48px] pl-5 pr-14 rounded-xl border border-[#d4af37]/60 bg-white text-gray-900 text-[15px] outline-none focus:border-[#d4af37] focus:ring-2 focus:ring-[#d4af37]/25 transition-all disabled:opacity-50"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center justify-center">
                      <Mail className="h-5 w-5 text-[#c9a227]" />
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <label htmlFor="dash-password" className="block text-[15px] font-semibold text-gray-800">Password</label>
                  <div className="relative">
                    <input
                      id="dash-password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loginMutation.isPending}
                      className="w-full h-[48px] pl-5 pr-14 rounded-xl border border-[#d4af37]/60 bg-white text-gray-900 text-[15px] outline-none focus:border-[#d4af37] focus:ring-2 focus:ring-[#d4af37]/25 transition-all disabled:opacity-50"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center justify-center">
                      <Eye className="h-5 w-5 text-[#c9a227]" />
                    </div>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loginMutation.isPending}
                  className="w-full h-[48px] text-[16px] font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 text-white disabled:opacity-60"
                  style={{ background: "linear-gradient(to right, #d4af37 0%, #8b6914 55%, #4a3a0a 100%)" }}
                >
                  {loginMutation.isPending ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Signing in...
                    </span>
                  ) : (
                    "Sign In"
                  )}
                </button>
              </form>
              <div className="mt-6 text-center">
                <span className="text-[14px] text-[#c9a227] font-medium">Forgot password?</span>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile background */}
        <div className="fixed inset-0 lg:hidden -z-10">
          <img src="/login-hero-poster.png" alt="" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-[#2a2a3a]/90" />
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

  // Help Center unread badge logic
  const VIEWED_ARTICLE_IDS_KEY = "tos-help-center-viewed-article-ids";

  const { data: helpUpdates } = trpc.helpCenter.getRecentUpdates.useQuery(
    { limit: 20 },
    { enabled: !!user },
  );

  const [helpViewedIds, setHelpViewedIds] = useState<number[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(VIEWED_ARTICLE_IDS_KEY) || "[]") as number[];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    const syncViewedIds = () => {
      try {
        setHelpViewedIds(JSON.parse(localStorage.getItem(VIEWED_ARTICLE_IDS_KEY) || "[]") as number[]);
      } catch {
        setHelpViewedIds([]);
      }
    };

    window.addEventListener("storage", syncViewedIds);
    window.addEventListener("help-center-viewed-updated", syncViewedIds);
    return () => {
      window.removeEventListener("storage", syncViewedIds);
      window.removeEventListener("help-center-viewed-updated", syncViewedIds);
    };
  }, []);

  const helpUnreadCount = useMemo(() => {
    const viewed = new Set(helpViewedIds);
    return (helpUpdates ?? []).filter((article: any) => {
      const createdAt = new Date(article.createdAt).getTime();
      const recentEnough = createdAt >= Date.now() - 30 * 24 * 60 * 60 * 1000;
      return recentEnough && !viewed.has(article.id);
    }).length;
  }, [helpUpdates, helpViewedIds]);

  const userRoleLevel = ROLE_HIERARCHY[user?.role || 'employee'] || 1;
  const { theme, toggleTheme } = useTheme();

  const { data: unreadCount } = trpc.alerts.unreadCount.useQuery(undefined, {
    refetchInterval: 30000,
  });

  const filteredMainNav = mainNavItems.filter(item => {
    if (userRoleLevel >= 2 && (item.path === '/my-tasks' || item.path === '/my-reports')) return false;
    return userRoleLevel >= item.minRole;
  });

  const filteredAdminNav = adminNavItems.filter(item => userRoleLevel >= item.minRole);

  const activeMenuItem = [...mainNavItems, ...adminNavItems].find(
    item => item.path === '/' ? location === '/' : location.startsWith(item.path)
  );

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      let newWidth = e.clientX;
      if (newWidth < MIN_WIDTH) newWidth = MIN_WIDTH;
      if (newWidth > MAX_WIDTH) newWidth = MAX_WIDTH;
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "default";
    };
  }, [isResizing, setSidebarWidth]);

  return (
    <>
      <div className="flex h-full overflow-hidden">
        <Sidebar
          collapsible="icon"
          className="border-r-0 shadow-xl transition-all duration-300 ease-in-out"
          style={{ width: isCollapsed ? 'auto' : undefined }}
        >
          {/* ── Header ── */}
          <SidebarHeader className="px-4 py-4 border-b border-sidebar-border/30">
            <div className="flex items-center gap-3">
              <div className="logo-shimmer h-10 w-10 rounded-2xl bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center shrink-0 ring-1 ring-primary/20">
                <img src="/tamiyouz-logo.png" alt="تميز" className="h-7 w-auto object-contain" />
              </div>
              <div className={cn("flex flex-col min-w-0 transition-all duration-300", isCollapsed && "opacity-0 w-0 overflow-hidden")}>
                <span className="font-bold text-sm tracking-tight text-sidebar-foreground truncate">Tamiyouz</span>
                <span className="text-[10px] text-sidebar-foreground/40 font-medium tracking-wide truncate">Operating System</span>
              </div>
              {!isCollapsed && (
                <button
                  className="ml-auto h-7 w-7 rounded-lg flex items-center justify-center text-sidebar-foreground/30 hover:text-sidebar-foreground hover:bg-sidebar-accent/60 transition-all duration-200"
                  onClick={() => toggleSidebar()}
                >
                  <PanelLeft className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </SidebarHeader>

          {/* ── Nav ── */}
          <SidebarContent className="gap-0 overflow-y-auto">
            <SidebarMenu className="px-2 py-3 flex flex-col gap-0.5">

              {/* Main nav items */}
              {filteredMainNav.map(item => {
                const isActive = item.path === '/' ? location === '/' : location.startsWith(item.path);
                const isNotifications = item.path === '/alerts';
                const isHelpCenter = item.path === '/help';
                const badgeCount = isNotifications ? (unreadCount || 0) : isHelpCenter ? helpUnreadCount : 0;
                return (
                  <SidebarMenuItem key={item.path} className="list-none">
                    <SidebarMenuButton
                      isActive={isActive}
                      onClick={() => setLocation(item.path)}
                      tooltip={item.label}
                      className={cn(
                        "sidebar-nav-btn h-10 w-full rounded-xl relative overflow-hidden transition-all duration-200 font-normal",
                        isActive
                          ? "nav-active bg-sidebar-accent text-sidebar-foreground shadow-sm"
                          : "text-sidebar-foreground/55 hover:text-sidebar-foreground hover:bg-sidebar-accent/60"
                      )}
                    >
                      {isActive && (
                        <span className="active-bar absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-r-full bg-primary" style={{ height: 22 }} />
                      )}
                      <div className="relative shrink-0 nav-icon-wrap ml-1">
                        <item.icon className={cn("h-[17px] w-[17px] transition-colors duration-200", isActive ? "text-primary" : "")} />
                        {badgeCount > 0 && isCollapsed && (
                          <span className="notif-badge absolute -top-1.5 -right-1.5 h-3.5 w-3.5 rounded-full bg-red-500 text-white text-[8px] font-bold flex items-center justify-center leading-none">
                            {badgeCount > 9 ? "9+" : badgeCount}
                          </span>
                        )}
                      </div>
                      <span className={cn("text-[13px] ml-0.5", isActive && "font-semibold")}>{item.label}</span>
                      {badgeCount > 0 && !isCollapsed && (
                        <span className="ml-auto h-5 min-w-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center px-1.5 leading-none notif-badge">
                          {badgeCount > 99 ? "99+" : badgeCount}
                        </span>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}

              {/* Admin section label — text only, no lines */}
              {filteredAdminNav.length > 0 && (
                <li className={cn("list-none px-2 pt-4 pb-1", isCollapsed && "hidden")}>
                  <span className="text-[9px] font-bold tracking-[0.18em] uppercase text-sidebar-foreground/30 select-none">
                    Admin
                  </span>
                </li>
              )}

              {/* Admin nav items */}
              {filteredAdminNav.map(item => {
                const isActive = location.startsWith(item.path);
                return (
                  <SidebarMenuItem key={item.path} className="list-none">
                    <SidebarMenuButton
                      isActive={isActive}
                      onClick={() => setLocation(item.path)}
                      tooltip={item.label}
                      className={cn(
                        "sidebar-nav-btn h-10 w-full rounded-xl relative overflow-hidden transition-all duration-200 font-normal",
                        isActive
                          ? "nav-active bg-sidebar-accent text-sidebar-foreground shadow-sm"
                          : "text-sidebar-foreground/45 hover:text-sidebar-foreground hover:bg-sidebar-accent/60"
                      )}
                    >
                      {isActive && (
                        <span className="active-bar absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-r-full bg-primary" style={{ height: 22 }} />
                      )}
                      <div className="nav-icon-wrap relative shrink-0 ml-1">
                        <item.icon className={cn("h-[17px] w-[17px] transition-colors duration-200", isActive ? "text-primary" : "")} />
                      </div>
                      <span className={cn("text-[13px] ml-0.5", isActive && "font-semibold")}>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}

            </SidebarMenu>
          </SidebarContent>

          {/* ── Footer / User ── */}
          <SidebarFooter className="p-3 border-t border-sidebar-border/30 space-y-2">
            {/* Dark / Light toggle */}
            {toggleTheme && (
              <button
                onClick={toggleTheme}
                className={cn(
                  "w-full flex items-center gap-3 rounded-xl px-3 py-2 transition-all duration-200 group",
                  "hover:bg-sidebar-accent/60 text-sidebar-foreground/45 hover:text-sidebar-foreground",
                  isCollapsed && "justify-center px-0"
                )}
                title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
              >
                <div className="nav-icon-wrap relative shrink-0">
                  {theme === "dark"
                    ? <Sun className="h-[17px] w-[17px] text-amber-400 transition-all duration-300" />
                    : <Moon className="h-[17px] w-[17px] transition-all duration-300" />
                  }
                </div>
                {!isCollapsed && (
                  <span className="text-[13px] font-normal">
                    {theme === "dark" ? "Light Mode" : "Dark Mode"}
                  </span>
                )}
                {!isCollapsed && (
                  <div className={cn(
                    "ml-auto w-9 h-5 rounded-full relative transition-all duration-300 shrink-0",
                    theme === "dark" ? "bg-primary/80" : "bg-sidebar-border/60"
                  )}>
                    <span className={cn(
                      "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-all duration-300",
                      theme === "dark" ? "left-[18px]" : "left-0.5"
                    )} />
                  </div>
                )}
              </button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className={cn(
                  "flex items-center gap-3 w-full rounded-xl px-2 py-2",
                  "hover:bg-sidebar-accent/60 transition-all duration-200 group",
                  "focus:outline-none focus-visible:ring-1 focus-visible:ring-sidebar-ring",
                  isCollapsed && "justify-center px-0"
                )}>
                  <Avatar className="h-8 w-8 shrink-0 ring-2 ring-primary/20 ring-offset-1 ring-offset-sidebar">
                    <AvatarFallback className="text-xs font-bold bg-gradient-to-br from-primary/40 to-primary/20 text-primary">
                      {user?.name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {!isCollapsed && (
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-[13px] font-semibold text-sidebar-foreground truncate leading-none">{user?.name || "-"}</p>
                      <p className="text-[10px] text-sidebar-foreground/40 truncate mt-1 capitalize">
                        {user?.role?.replace(/_/g, ' ')}
                      </p>
                    </div>
                  )}
                  {!isCollapsed && (
                    <LogOut className="h-3.5 w-3.5 text-sidebar-foreground/25 group-hover:text-sidebar-foreground/60 transition-colors shrink-0" />
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52 mb-1">
                <div className="px-3 py-2 border-b border-border/50 mb-1">
                  <p className="text-sm font-semibold truncate">{user?.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{user?.role?.replace(/_/g, ' ')}</p>
                </div>
                <DropdownMenuItem
                  onClick={logout}
                  className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10 gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>

        {/* Resize handle — subtle */}
        <div
          className={cn(
            "absolute top-0 right-0 w-1 h-full cursor-col-resize z-50 group/resize",
            isCollapsed && "hidden"
          )}
          onMouseDown={() => { if (!isCollapsed) setIsResizing(true); }}
        >
          <div className="w-full h-full hover:bg-primary/30 transition-colors duration-300 rounded-full" />
        </div>
      </div>
      <SidebarInset>
        {isMobile && (
          <div className="flex border-b h-14 items-center justify-between bg-background/95 px-2 backdrop-blur supports-[backdrop-filter]:backdrop-blur sticky top-0 z-40">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="h-9 w-9 rounded-lg bg-background" />
              <span className="tracking-tight text-foreground">{activeMenuItem?.label ?? "تميز"}</span>
            </div>
          </div>
        )}
        <main key={location} className="flex-1 p-4 relative page-enter">
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
        <HelpChatWidget />
      </SidebarInset>
    </>
  );
}
