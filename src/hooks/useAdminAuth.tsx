import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

// Types for app user authentication
interface AppUser {
  id: string;
  username: string;
  full_name: string;
  phone: string;
  status: string;
}

interface AppSession {
  token: string;
  expires_at: string;
}

interface AdminAuthContextType {
  // Supabase Auth user (email login)
  supabaseUser: User | null;
  supabaseSession: Session | null;
  
  // App user (username/phone login)
  appUser: AppUser | null;
  appSession: AppSession | null;
  
  // Combined status
  isAuthenticated: boolean;
  isAdmin: boolean;
  isSubAdmin: boolean;
  canAccessAdmin: boolean;
  loading: boolean;
  
  // Display info
  displayName: string;
  userType: "supabase" | "app" | null;
  
  // Permissions for sub-admin
  permissions: string[];
  hasPermission: (permissionCode: string) => boolean;
  
  // Actions
  signOut: () => Promise<void>;
  loginWithAppUser: (identifier: string, password: string) => Promise<{ success: boolean; error?: string }>;
}

const ADMIN_APP_USER_KEY = "admin_app_user";
const ADMIN_APP_SESSION_KEY = "admin_app_session";
const ADMIN_APP_PERMISSIONS_KEY = "admin_app_permissions";

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const AdminAuthProvider = ({ children }: { children: ReactNode }) => {
  // Supabase Auth state
  const [supabaseUser, setSupabaseUser] = useState<User | null>(null);
  const [supabaseSession, setSupabaseSession] = useState<Session | null>(null);
  const [isSupabaseAdmin, setIsSupabaseAdmin] = useState(false);
  const [isSupabaseSubAdmin, setIsSupabaseSubAdmin] = useState(false);
  
  // App user state
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [appSession, setAppSession] = useState<AppSession | null>(null);
  const [isAppAdmin, setIsAppAdmin] = useState(false);
  const [isAppSubAdmin, setIsAppSubAdmin] = useState(false);
  const [permissions, setPermissions] = useState<string[]>([]);
  
  const [loading, setLoading] = useState(true);

  // Initialize from localStorage and Supabase
  useEffect(() => {
    // Set up Supabase auth listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSupabaseSession(session);
        setSupabaseUser(session?.user ?? null);
        
        if (session?.user) {
          setTimeout(() => {
            checkSupabaseRoles(session.user.id);
          }, 0);
        } else {
          setIsSupabaseAdmin(false);
          setIsSupabaseSubAdmin(false);
        }
      }
    );

    // Check existing Supabase session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSupabaseSession(session);
      setSupabaseUser(session?.user ?? null);
      if (session?.user) {
        checkSupabaseRoles(session.user.id);
      }
    });

    // Check existing app user session from localStorage
    const storedUser = localStorage.getItem(ADMIN_APP_USER_KEY);
    const storedSession = localStorage.getItem(ADMIN_APP_SESSION_KEY);
    const storedPermissions = localStorage.getItem(ADMIN_APP_PERMISSIONS_KEY);
    
    if (storedUser && storedSession) {
      try {
        const user = JSON.parse(storedUser) as AppUser;
        const session = JSON.parse(storedSession) as AppSession;
        
        // Check if session is expired
        if (new Date(session.expires_at) > new Date()) {
          setAppUser(user);
          setAppSession(session);
          if (storedPermissions) {
            setPermissions(JSON.parse(storedPermissions));
          }
          checkAppUserAdminRoles(user.id);
        } else {
          // Clear expired session
          localStorage.removeItem(ADMIN_APP_USER_KEY);
          localStorage.removeItem(ADMIN_APP_SESSION_KEY);
          localStorage.removeItem(ADMIN_APP_PERMISSIONS_KEY);
        }
      } catch (e) {
        console.error("Failed to parse stored admin app user session:", e);
        localStorage.removeItem(ADMIN_APP_USER_KEY);
        localStorage.removeItem(ADMIN_APP_SESSION_KEY);
        localStorage.removeItem(ADMIN_APP_PERMISSIONS_KEY);
      }
    }

    setLoading(false);

    return () => subscription.unsubscribe();
  }, []);

  const checkSupabaseRoles = async (userId: string) => {
    const [adminResult, subAdminResult] = await Promise.all([
      supabase.rpc("is_admin", { _user_id: userId }),
      supabase.rpc("is_sub_admin", { _user_id: userId }),
    ]);

    setIsSupabaseAdmin(!adminResult.error && adminResult.data === true);
    setIsSupabaseSubAdmin(!subAdminResult.error && subAdminResult.data === true);
  };

  const fetchAppUserPermissions = async (userId: string): Promise<string[]> => {
    try {
      console.log("Fetching permissions via Edge Function for user:", userId);
      
      const response = await supabase.functions.invoke("get-user-permissions", {
        body: { userId },
      });

      if (response.error) {
        console.error("Error fetching user permissions:", response.error);
        return [];
      }

      const permissionCodes = response.data?.permissions || [];
      console.log("Fetched permissions:", permissionCodes);
      
      return permissionCodes;
    } catch (error) {
      console.error("Error fetching app user permissions:", error);
      return [];
    }
  };

  const checkAppUserAdminRoles = async (userId: string) => {
    try {
      // Get user's roles from app_user_roles
      const { data: userRoles, error: rolesError } = await supabase
        .from("app_user_roles")
        .select(`
          role_id,
          roles:role_id (
            code,
            name
          )
        `)
        .eq("app_user_id", userId);

      if (rolesError) {
        console.error("Error fetching app user roles:", rolesError);
        return;
      }

      if (userRoles && userRoles.length > 0) {
        const roleCodes = userRoles.map((ur: any) => ur.roles?.code?.toLowerCase()).filter(Boolean);
        const isAdmin = roleCodes.includes("admin");
        const isSubAdmin = roleCodes.includes("sub_admin") || roleCodes.includes("sub-admin");
        
        setIsAppAdmin(isAdmin);
        setIsAppSubAdmin(isSubAdmin);

        // Fetch permissions for sub-admin users
        if (isSubAdmin && !isAdmin) {
          const perms = await fetchAppUserPermissions(userId);
          setPermissions(perms);
          localStorage.setItem(ADMIN_APP_PERMISSIONS_KEY, JSON.stringify(perms));
        } else if (isAdmin) {
          // Admin has all permissions
          setPermissions(['MANAGE_MEMBERS', 'MANAGE_USERS', 'MANAGE_POSTS', 'MANAGE_FOOTER', 'MANAGE_PAGES']);
        }
      }
    } catch (error) {
      console.error("Error checking app user admin roles:", error);
    }
  };

  const loginWithAppUser = async (identifier: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await supabase.functions.invoke("custom-auth/login", {
        body: { identifier, password },
      });

      if (response.error) {
        return { success: false, error: response.error.message };
      }

      const data = response.data;
      
      if (!data.success) {
        return { success: false, error: data.error || "Đăng nhập thất bại" };
      }

      // Check if user has admin/sub_admin role
      const userId = data.user.id;
      
      // Fetch roles to verify admin access
      const { data: userRoles } = await supabase
        .from("app_user_roles")
        .select(`
          role_id,
          roles:role_id (
            code
          )
        `)
        .eq("app_user_id", userId);

      const roleCodes = userRoles?.map((ur: any) => ur.roles?.code?.toLowerCase()).filter(Boolean) || [];
      const isAdmin = roleCodes.includes("admin");
      const isSubAdmin = roleCodes.includes("sub_admin") || roleCodes.includes("sub-admin");
      const hasAdminAccess = isAdmin || isSubAdmin;

      if (!hasAdminAccess) {
        return { success: false, error: "Bạn không có quyền truy cập trang quản trị" };
      }

      // Fetch permissions for sub-admin
      let userPermissions: string[] = [];
      if (isSubAdmin && !isAdmin) {
        userPermissions = await fetchAppUserPermissions(userId);
      } else if (isAdmin) {
        userPermissions = ['MANAGE_MEMBERS', 'MANAGE_USERS', 'MANAGE_POSTS', 'MANAGE_FOOTER', 'MANAGE_PAGES'];
      }

      // Save to state and localStorage
      setAppUser(data.user);
      setAppSession(data.session);
      setIsAppAdmin(isAdmin);
      setIsAppSubAdmin(isSubAdmin);
      setPermissions(userPermissions);
      
      localStorage.setItem(ADMIN_APP_USER_KEY, JSON.stringify(data.user));
      localStorage.setItem(ADMIN_APP_SESSION_KEY, JSON.stringify(data.session));
      localStorage.setItem(ADMIN_APP_PERMISSIONS_KEY, JSON.stringify(userPermissions));

      return { success: true };
    } catch (error: any) {
      console.error("Login error:", error);
      return { success: false, error: error.message || "Lỗi đăng nhập" };
    }
  };

  const signOut = async () => {
    // Sign out from Supabase
    await supabase.auth.signOut();
    setSupabaseUser(null);
    setSupabaseSession(null);
    setIsSupabaseAdmin(false);
    setIsSupabaseSubAdmin(false);

    // Clear app user session
    setAppUser(null);
    setAppSession(null);
    setIsAppAdmin(false);
    setIsAppSubAdmin(false);
    setPermissions([]);
    localStorage.removeItem(ADMIN_APP_USER_KEY);
    localStorage.removeItem(ADMIN_APP_SESSION_KEY);
    localStorage.removeItem(ADMIN_APP_PERMISSIONS_KEY);
  };

  // Combined states
  const isAuthenticated = !!supabaseUser || !!appUser;
  const isAdmin = isSupabaseAdmin || isAppAdmin;
  const isSubAdmin = isSupabaseSubAdmin || isAppSubAdmin;
  const canAccessAdmin = isAdmin || isSubAdmin;
  
  const userType = supabaseUser ? "supabase" : appUser ? "app" : null;
  const displayName = supabaseUser?.email || appUser?.full_name || "";

  const hasPermission = (permissionCode: string): boolean => {
    if (isAdmin) return true;
    return permissions.includes(permissionCode);
  };

  return (
    <AdminAuthContext.Provider
      value={{
        supabaseUser,
        supabaseSession,
        appUser,
        appSession,
        isAuthenticated,
        isAdmin,
        isSubAdmin,
        canAccessAdmin,
        loading,
        displayName,
        userType,
        permissions,
        hasPermission,
        signOut,
        loginWithAppUser,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error("useAdminAuth must be used within an AdminAuthProvider");
  }
  return context;
};
