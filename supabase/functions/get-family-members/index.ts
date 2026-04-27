import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Create service role client (bypasses RLS)
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
    
    // Get authorization header
    const authHeader = req.headers.get("Authorization");
    
    let hasAccess = false;
    
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      
      // First, try to verify as Supabase Auth user (admin)
      const supabaseAuth = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader } }
      });
      
      const { data: { user: supabaseUser } } = await supabaseAuth.auth.getUser();
      
      if (supabaseUser) {
        // Check if this Supabase user is an admin/sub-admin OR has relevant permissions
        const [{ data: isAdmin }, { data: isSubAdmin }] = await Promise.all([
          supabaseAdmin.rpc("is_admin", { _user_id: supabaseUser.id }),
          supabaseAdmin.rpc("is_sub_admin", { _user_id: supabaseUser.id }),
        ]);

        if (isAdmin) {
          hasAccess = true;
          console.log("Access granted via Supabase Auth (admin)");
        } else if (isSubAdmin) {
          hasAccess = true;
          console.log("Access granted via Supabase Auth (sub_admin)");
        } else {
          const [viewPermResult, managePermResult] = await Promise.all([
            supabaseAdmin.rpc("has_permission", {
              _user_id: supabaseUser.id,
              _permission_code: "VIEW_FAMILY_TREE",
            }),
            supabaseAdmin.rpc("has_permission", {
              _user_id: supabaseUser.id,
              _permission_code: "MANAGE_MEMBERS",
            }),
          ]);

          if (viewPermResult.data || managePermResult.data) {
            hasAccess = true;
            console.log(
              "Access granted via Supabase Auth permission (VIEW_FAMILY_TREE or MANAGE_MEMBERS)",
            );
          }
        }
      }
      
      // If not Supabase user, check as app user
      if (!hasAccess) {
        // Find app user by token
        const { data: sessions } = await supabaseAdmin
          .from("app_user_sessions")
          .select("app_user_id, expires_at")
          .eq("token", token)
          .single();
        
        if (sessions && new Date(sessions.expires_at) > new Date()) {
          // Check if app user has VIEW_FAMILY_TREE or MANAGE_MEMBERS permission
          const [viewPermResult, managePermResult] = await Promise.all([
            supabaseAdmin.rpc("app_user_has_permission", {
              _user_id: sessions.app_user_id,
              _permission_code: "VIEW_FAMILY_TREE"
            }),
            supabaseAdmin.rpc("app_user_has_permission", {
              _user_id: sessions.app_user_id,
              _permission_code: "MANAGE_MEMBERS"
            })
          ]);
          
          if (viewPermResult.data || managePermResult.data) {
            hasAccess = true;
            console.log("Access granted via app user permission (VIEW_FAMILY_TREE or MANAGE_MEMBERS)");
          }
        }
      }
    }
    
    if (!hasAccess) {
      console.log("Access denied - no valid auth");
      return new Response(
        JSON.stringify({ error: "Unauthorized", message: "Bạn không có quyền truy cập" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Fetch family members using service role (bypasses RLS)
    const { data: members, error } = await supabaseAdmin
      .from("family_members")
      .select("*")
      .order("generation", { ascending: true })
      .order("birth_date", { ascending: true });
    
    if (error) {
      console.error("Error fetching family members:", error);
      return new Response(
        JSON.stringify({ error: "Database error", message: error.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Fetch marriages data
    const { data: marriages, error: marriagesError } = await supabaseAdmin
      .from("family_marriages")
      .select("*")
      .order("marriage_order", { ascending: true });
    
    if (marriagesError) {
      console.error("Error fetching marriages:", marriagesError);
      // Don't fail, just return members without marriages
      console.log(`Returning ${members?.length || 0} family members (no marriages data)`);
      return new Response(
        JSON.stringify({ members: members || [], marriages: [] }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    console.log(`Returning ${members?.length || 0} family members, ${marriages?.length || 0} marriages`);
    
    return new Response(
      JSON.stringify({ members: members || [], marriages: marriages || [] }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
    
  } catch (error) {
    console.error("Unexpected error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: "Server error", message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
