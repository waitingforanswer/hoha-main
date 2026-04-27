import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Convert Uint8Array to hex string
function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// PBKDF2 password hashing
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const passwordData = encoder.encode(password);
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const saltHex = toHex(salt);

  const key = await crypto.subtle.importKey("raw", passwordData, "PBKDF2", false, ["deriveBits"]);

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100_000,
      hash: "SHA-256",
    },
    key,
    256
  );

  const hashHex = toHex(new Uint8Array(derivedBits));
  return `${saltHex}:${hashHex}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify admin from Authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return json({ success: false, error: "Unauthorized" }, 401);
    }

    const token = authHeader.replace("Bearer ", "");
    
    let isAdmin = false;
    let canAccess = false;
    let authUserId: string | null = null;

    // First, try to verify as Supabase Auth user
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });
    
    const { data: { user: supabaseUser } } = await supabaseAuth.auth.getUser();
    
    if (supabaseUser) {
      authUserId = supabaseUser.id;
      // Check if user can access admin
      const { data: canAccessData } = await supabase.rpc("can_access_admin", { _user_id: supabaseUser.id });
      canAccess = canAccessData === true;
      
      // Check if user is full admin
      const { data: isAdminData } = await supabase.rpc("is_admin", { _user_id: supabaseUser.id });
      isAdmin = isAdminData === true;
      
      console.log(`Supabase Auth user: ${supabaseUser.id}, canAccess: ${canAccess}, isAdmin: ${isAdmin}`);
    } else {
      // Try to verify as app user via session token
      const { data: session, error: sessionError } = await supabase
        .from("app_user_sessions")
        .select("app_user_id, expires_at")
        .eq("token", token)
        .maybeSingle();
      
      if (session && new Date(session.expires_at) > new Date()) {
        authUserId = session.app_user_id;
        
        // Check app user roles - get role codes from app_user_roles -> roles
        const { data: userRoles } = await supabase
          .from("app_user_roles")
          .select("role_id, roles:role_id(code)")
          .eq("app_user_id", session.app_user_id);
        
        const roleCodes = userRoles?.map((ur: any) => ur.roles?.code?.toLowerCase()).filter(Boolean) || [];
        isAdmin = roleCodes.includes("admin");
        const isSubAdmin = roleCodes.includes("sub_admin");
        canAccess = isAdmin || isSubAdmin;
        
        console.log(`App user: ${session.app_user_id}, roles: ${roleCodes.join(",")}, canAccess: ${canAccess}, isAdmin: ${isAdmin}`);
      }
    }

    if (!canAccess || !authUserId) {
      console.error("Access denied - no valid admin auth");
      return json({ success: false, error: "Forbidden - Admin access required" }, 403);
    }

    const url = new URL(req.url);
    const action = url.pathname.split("/").pop();

    // GET: List all users with their roles
    if (req.method === "GET") {
      const { data: users, error } = await supabase
        .from("app_users")
        .select("id, username, full_name, phone, status, created_at, updated_at")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Fetch users error:", error);
        return json({ success: false, error: "Failed to fetch users" }, 500);
      }

      // Fetch all permissions
      const { data: allPermissions } = await supabase
        .from("permissions")
        .select("id, code, name")
        .order("name");

      // Fetch app user roles (app_users -> app_user_roles -> roles)
      const { data: appUserRoles, error: appUserRolesError } = await supabase
        .from("app_user_roles")
        .select("app_user_id, role_id");

      if (appUserRolesError) {
        console.error("Fetch app user roles error:", appUserRolesError);
        return json({ success: false, error: "Failed to fetch user roles" }, 500);
      }

      const { data: roles, error: rolesError } = await supabase
        .from("roles")
        .select("id, code");

      if (rolesError) {
        console.error("Fetch roles error:", rolesError);
        return json({ success: false, error: "Failed to fetch roles" }, 500);
      }

      const roleIdToCode = new Map<string, string>();
      roles?.forEach((r) => roleIdToCode.set(r.id, r.code));

      // Fetch user permissions
      const { data: userPermissions } = await supabase
        .from("user_permissions")
        .select("user_id, permission_id");

      // Create a map of app user roles
      const userRolesMap: Record<string, string[]> = {};
      appUserRoles?.forEach((ur) => {
        const roleCode = roleIdToCode.get(ur.role_id);
        if (!roleCode) return;

        if (!userRolesMap[ur.app_user_id]) {
          userRolesMap[ur.app_user_id] = [];
        }
        userRolesMap[ur.app_user_id].push(roleCode);
      });

      // Create a map of user permissions
      const userPermissionsMap: Record<string, string[]> = {};
      userPermissions?.forEach((up) => {
        if (!userPermissionsMap[up.user_id]) {
          userPermissionsMap[up.user_id] = [];
        }
        userPermissionsMap[up.user_id].push(up.permission_id);
      });

      // Enhance users with roles and permissions
      const enhancedUsers = users?.map((user) => ({
        ...user,
        roles: userRolesMap[user.id] || [],
        permission_ids: userPermissionsMap[user.id] || [],
      }));

      return json({ 
        success: true, 
        users: enhancedUsers,
        permissions: allPermissions || [],
        isAdmin: isAdmin || false,
      });
    }

    // POST: Various admin actions
    if (req.method !== "POST") {
      return json({ success: false, error: "Method not allowed" }, 405);
    }

    const body = await req.json();

    if (action === "update-status") {
      const { user_id, status } = body;
      
      if (!user_id || !status) {
        return json({ success: false, error: "Missing user_id or status" }, 400);
      }

      if (!["ACTIVE", "INACTIVE", "PENDING"].includes(status)) {
        return json({ success: false, error: "Invalid status" }, 400);
      }

      const { error } = await supabase
        .from("app_users")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", user_id);

      if (error) {
        console.error("Update status error:", error);
        return json({ success: false, error: "Failed to update status" }, 500);
      }

      // Auto-assign USER role when activating, remove when deactivating
      if (status === "ACTIVE") {
        // Get USER role id
        const { data: userRole } = await supabase
          .from("roles")
          .select("id")
          .eq("code", "USER")
          .maybeSingle();

        if (userRole) {
          // Insert role if not exists
          await supabase
            .from("app_user_roles")
            .upsert({ app_user_id: user_id, role_id: userRole.id }, { onConflict: "app_user_id,role_id" });
        }
      } else if (status === "INACTIVE") {
        // Remove USER role when deactivating
        const { data: userRole } = await supabase
          .from("roles")
          .select("id")
          .eq("code", "USER")
          .maybeSingle();

        if (userRole) {
          await supabase
            .from("app_user_roles")
            .delete()
            .eq("app_user_id", user_id)
            .eq("role_id", userRole.id);
        }
      }

      console.log(`User ${user_id} status updated to ${status} by admin ${authUserId}`);
      return json({ success: true, message: "Status updated successfully" });
    }

    if (action === "change-password") {
      const { user_id, new_password } = body;
      
      if (!user_id || !new_password) {
        return json({ success: false, error: "Missing user_id or new_password" }, 400);
      }

      if (new_password.length < 8) {
        return json({ success: false, error: "Password must be at least 8 characters" }, 400);
      }

      const password_hash = await hashPassword(new_password);

      const { error } = await supabase
        .from("app_users")
        .update({ password_hash, updated_at: new Date().toISOString() })
        .eq("id", user_id);

      if (error) {
        console.error("Change password error:", error);
        return json({ success: false, error: "Failed to change password" }, 500);
      }

      console.log(`User ${user_id} password changed by admin ${authUserId}`);
      return json({ success: true, message: "Password changed successfully" });
    }

    // Only full admins can manage roles
    if (action === "assign-sub-admin") {
      if (!isAdmin) {
        return json({ success: false, error: "Only admins can assign sub_admin role" }, 403);
      }

      const { user_id, assign } = body;
      
      if (!user_id || typeof assign !== "boolean") {
        return json({ success: false, error: "Missing user_id or assign" }, 400);
      }

      // Get sub_admin role id from roles table
      const { data: subAdminRole, error: roleError } = await supabase
        .from("roles")
        .select("id")
        .eq("code", "sub_admin")
        .maybeSingle();

      if (roleError || !subAdminRole) {
        console.error("Get sub_admin role error:", roleError);
        return json({ success: false, error: "sub_admin role not found" }, 500);
      }

      if (assign) {
        // Assign sub_admin role using app_user_roles table
        const { error } = await supabase
          .from("app_user_roles")
          .upsert({ app_user_id: user_id, role_id: subAdminRole.id }, { onConflict: "app_user_id,role_id" });

        if (error) {
          console.error("Assign sub_admin error:", error);
          return json({ success: false, error: "Failed to assign sub_admin role" }, 500);
        }
        console.log(`User ${user_id} assigned sub_admin role by admin ${authUserId}`);
      } else {
        // Remove sub_admin role from app_user_roles table
        const { error } = await supabase
          .from("app_user_roles")
          .delete()
          .eq("app_user_id", user_id)
          .eq("role_id", subAdminRole.id);

        if (error) {
          console.error("Remove sub_admin error:", error);
          return json({ success: false, error: "Failed to remove sub_admin role" }, 500);
        }
        console.log(`User ${user_id} removed sub_admin role by admin ${authUserId}`);
      }

      return json({ success: true, message: assign ? "Sub-admin role assigned" : "Sub-admin role removed" });
    }

    // Only full admins can manage permissions for sub_admins
    if (action === "update-permissions") {
      if (!isAdmin) {
        return json({ success: false, error: "Only admins can manage permissions" }, 403);
      }

      const { user_id, permission_ids } = body;
      
      if (!user_id || !Array.isArray(permission_ids)) {
        return json({ success: false, error: "Missing user_id or permission_ids" }, 400);
      }

      // Delete all existing permissions for this user
      await supabase
        .from("user_permissions")
        .delete()
        .eq("user_id", user_id);

      // Insert new permissions
      if (permission_ids.length > 0) {
        const permissionsToInsert = permission_ids.map((permission_id: string) => ({
          user_id,
          permission_id,
        }));

        const { error } = await supabase
          .from("user_permissions")
          .insert(permissionsToInsert);

        if (error) {
          console.error("Update permissions error:", error);
          return json({ success: false, error: "Failed to update permissions" }, 500);
        }
      }

      console.log(`User ${user_id} permissions updated by admin ${authUserId}`);
      return json({ success: true, message: "Permissions updated successfully" });
    }

    return json({ success: false, error: "Unknown action" }, 400);
  } catch (error) {
    console.error("Admin users error:", error);
    return json({ success: false, error: "Internal server error" }, 500);
  }
});
