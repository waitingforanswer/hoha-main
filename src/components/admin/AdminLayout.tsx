import { ReactNode, useEffect, useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  FileText, 
  Settings, 
  LogOut, 
  Home,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  Navigation,
  Footprints,
  File,
  UserCog,
  HelpCircle,
  MessageCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface AdminLayoutProps {
  children: ReactNode;
}

interface MenuItem {
  icon: any;
  label: string;
  path: string;
}

interface MenuGroup {
  icon: any;
  label: string;
  items: MenuItem[];
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const { isAuthenticated, canAccessAdmin, isAdmin, loading, signOut, displayName, userType, hasPermission } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate("/admin/login");
    }
  }, [isAuthenticated, loading, navigate]);

  // Auto-expand settings when on a settings page
  useEffect(() => {
    if (location.pathname.startsWith("/admin/settings")) {
      setSettingsOpen(true);
    }
  }, [location.pathname]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const handleSignOut = async () => {
    await signOut();
    navigate("/admin/login");
  };

  // Build main menu items based on permissions
  const mainMenuItems: MenuItem[] = [
    { icon: Home, label: "Dashboard", path: "/admin" },
  ];

  // Add Thành viên menu only if admin or has MANAGE_MEMBERS permission
  if (isAdmin || hasPermission('MANAGE_MEMBERS')) {
    mainMenuItems.push({ icon: Users, label: "Thành viên", path: "/admin/members" });
  }

  // Add Bài viết menu only if admin or has MANAGE_POSTS permission
  if (isAdmin || hasPermission('MANAGE_POSTS')) {
    mainMenuItems.push({ icon: FileText, label: "Bài viết", path: "/admin/posts" });
  }

  // Add Góp ý menu for admin
  if (isAdmin) {
    mainMenuItems.push({ icon: MessageCircle, label: "Góp ý", path: "/admin/gopy" });
  }

  // Add Help menu for everyone
  mainMenuItems.push({ icon: HelpCircle, label: "Hướng dẫn", path: "/admin/help" });

  // Settings submenu - filtered based on role and permissions
  const settingsSubMenu: MenuItem[] = [];
  
  // Admin-only items
  if (isAdmin) {
    settingsSubMenu.push(
      { icon: Navigation, label: "Menu điều hướng", path: "/admin/settings/menu" },
      { icon: Footprints, label: "Footer", path: "/admin/settings/footer" },
      { icon: File, label: "Trang", path: "/admin/settings/pages" }
    );
  }
  
  // Người dùng - visible to admin or users with MANAGE_USERS permission
  if (isAdmin || hasPermission('MANAGE_USERS')) {
    settingsSubMenu.push({ icon: UserCog, label: "Người dùng", path: "/admin/settings" });
  }

  const isSettingsActive = location.pathname.startsWith("/admin/settings");
  const showSettingsMenu = settingsSubMenu.length > 0;

  return (
    <div className="flex min-h-screen bg-muted/30">
      {/* Mobile menu button */}
      <button
        className="fixed left-4 top-4 z-50 rounded-md bg-background p-2 shadow-md lg:hidden"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 transform bg-card shadow-elegant transition-transform duration-300 lg:static lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center justify-center border-b">
            <Link to="/admin" className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <span className="font-serif text-lg font-bold">H</span>
              </div>
              <span className="font-serif text-xl font-bold text-primary">Admin</span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 p-4">
            {/* Main menu items */}
            {mainMenuItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Link>
              );
            })}

            {/* Settings with submenu - only show if there are items */}
            {showSettingsMenu && (
              <Collapsible open={settingsOpen} onOpenChange={setSettingsOpen}>
                <CollapsibleTrigger asChild>
                  <button
                    className={cn(
                      "flex w-full items-center justify-between gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors",
                      isSettingsActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Settings className="h-5 w-5" />
                      Cài đặt
                    </div>
                    {settingsOpen ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-1 space-y-1 pl-4">
                  {settingsSubMenu.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setSidebarOpen(false)}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors",
                          isActive
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                      >
                        <item.icon className="h-4 w-4" />
                        {item.label}
                      </Link>
                    );
                  })}
                </CollapsibleContent>
              </Collapsible>
            )}
          </nav>

          {/* User info & logout */}
          <div className="border-t p-4">
            <div className="mb-3 text-sm">
              <p className="font-medium truncate">{displayName}</p>
              <p className="text-xs text-muted-foreground">
                {isAdmin ? "Quản trị viên" : canAccessAdmin ? "Sub-Admin" : "Người dùng"}
                {userType === "app" && " (App)"}
              </p>
            </div>
            <Button
              variant="outline"
              className="w-full justify-start gap-2"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4" />
              Đăng xuất
            </Button>
          </div>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="container py-8">{children}</div>
      </main>
    </div>
  );
};

export default AdminLayout;
