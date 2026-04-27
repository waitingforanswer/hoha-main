import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useMemo, useEffect } from "react";
import { Menu, X, LogIn, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAppAuth } from "@/hooks/useAppAuth";
import { usePermissions } from "@/hooks/usePermissions";
import { supabase } from "@/integrations/supabase/client";

interface MenuItem {
  id: string;
  label: string;
  page_key: string;
  display_order: number;
  is_visible: boolean;
  permission_code: string | null;
  require_auth: boolean;
}

const PAGE_KEY_TO_ROUTE: Record<string, string> = {
  home: "/",
  about: "/gioi-thieu",
  "ho-ha": "/ho-ha",
  "family-tree": "/cay-gia-pha",
  articles: "/bai-viet",
};

export function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAppAuth();
  const { hasPermission } = usePermissions();

  useEffect(() => {
    const fetchMenuItems = async () => {
      const { data } = await supabase
        .from("menu_items")
        .select("*")
        .eq("is_visible", true)
        .order("display_order", { ascending: true });
      
      if (data) {
        setMenuItems(data);
      }
    };

    fetchMenuItems();
  }, []);

  const handleLogout = () => {
    logout();
    setIsOpen(false);
    navigate('/');
  };

  const getRoute = (pageKey: string): string => {
    return PAGE_KEY_TO_ROUTE[pageKey] || `/${pageKey}`;
  };

  const visibleNavItems = useMemo(() => {
    return menuItems.filter((item) => {
      // If item requires auth and user is not logged in, hide it
      if (item.require_auth && !user) {
        return false;
      }
      // If item requires a specific permission, check it
      if (item.permission_code && !hasPermission(item.permission_code)) {
        return false;
      }
      return true;
    });
  }, [menuItems, user, hasPermission]);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container flex h-16 items-center justify-between md:h-20">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3">
          {/* Hiển thị Logo ảnh */}
          <img 
            src="/logo-gia-pha.svg" 
            alt="Logo Gia Phả Họ Hà Quang"
            className="h-10 w-auto object-contain md:h-12"
          />
          {/* Phần chữ bên cạnh Logo (Nếu bạn muốn ẩn chữ đi thì xóa toàn bộ thẻ div này) */}
          <div className="hidden sm:block">
            <h1 className="font-serif text-lg font-semibold text-foreground md:text-xl">
              Dòng Họ Hà Quang
            </h1>
            <p className="text-xs text-muted-foreground">Gìn giữ nguồn cội</p>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-1 lg:flex">
          {visibleNavItems.map((item) => {
            const route = getRoute(item.page_key);
            return (
              <Link
                key={item.id}
                to={route}
                className={cn(
                  "px-4 py-2 text-sm font-medium transition-colors hover:text-primary",
                  location.pathname === route
                    ? "text-primary"
                    : "text-muted-foreground"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Auth Section */}
        <div className="hidden items-center gap-4 lg:flex">
          {user ? (
            <>
              <span className="text-sm font-medium text-foreground">
                {user.full_name}
              </span>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Đăng xuất
              </Button>
            </>
          ) : (
            <Link to="/login">
              <Button variant="outline" size="sm">
                <LogIn className="mr-2 h-4 w-4" />
                Đăng nhập / Đăng ký
              </Button>
            </Link>
          )}
        </div>

        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="border-t lg:hidden">
          <nav className="container flex flex-col py-4">
            {visibleNavItems.map((item) => {
              const route = getRoute(item.page_key);
              return (
                <Link
                  key={item.id}
                  to={route}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "py-3 text-sm font-medium transition-colors hover:text-primary",
                    location.pathname === route
                      ? "text-primary"
                      : "text-muted-foreground"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
            <div className="mt-4 border-t pt-4 space-y-2">
              {user ? (
                <>
                  <p className="text-sm font-medium text-foreground px-1">
                    {user.full_name}
                  </p>
                  <Button variant="outline" size="sm" className="w-full" onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Đăng xuất
                  </Button>
                </>
              ) : (
                <Link to="/login" onClick={() => setIsOpen(false)}>
                  <Button variant="outline" size="sm" className="w-full">
                    <LogIn className="mr-2 h-4 w-4" />
                    Đăng nhập / Đăng ký
                  </Button>
                </Link>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
