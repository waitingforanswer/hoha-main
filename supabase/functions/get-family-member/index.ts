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
    
    // Get member ID from request body
    const { memberId } = await req.json();
    
    if (!memberId) {
      return new Response(
        JSON.stringify({ error: "Missing memberId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
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
        // Check if this Supabase user is an admin
        const { data: isAdmin } = await supabaseAdmin.rpc("is_admin", { _user_id: supabaseUser.id });
        if (isAdmin) {
          hasAccess = true;
          console.log("Access granted via Supabase Auth (admin)");
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
          // Check if app user has VIEW_FAMILY_TREE permission
          const { data: hasPermission } = await supabaseAdmin.rpc("app_user_has_permission", {
            _user_id: sessions.app_user_id,
            _permission_code: "VIEW_FAMILY_TREE"
          });
          
          if (hasPermission) {
            hasAccess = true;
            console.log("Access granted via app user permission");
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
    
    // Fetch member
    const { data: member, error: memberError } = await supabaseAdmin
      .from("family_members")
      .select("*")
      .eq("id", memberId)
      .maybeSingle();
    
    if (memberError) {
      console.error("Error fetching member:", memberError);
      return new Response(
        JSON.stringify({ error: "Database error", message: memberError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    if (!member) {
      return new Response(
        JSON.stringify({ error: "Not found", message: "Không tìm thấy thành viên" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Fetch parents and children in parallel
    const [fatherRes, motherRes, childrenRes] = await Promise.all([
      member.father_id
        ? supabaseAdmin
            .from("family_members")
            .select("*")
            .eq("id", member.father_id)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
      member.mother_id
        ? supabaseAdmin
            .from("family_members")
            .select("*")
            .eq("id", member.mother_id)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
      supabaseAdmin
        .from("family_members")
        .select("*")
        .or(`father_id.eq.${memberId},mother_id.eq.${memberId}`)
        .order("birth_date", { ascending: true }),
    ]);
    
    const result = {
      member,
      father: fatherRes.data,
      mother: motherRes.data,
      children: childrenRes.data || [],
    };
    
    console.log(`Returning member ${member.full_name} with ${result.children.length} children`);
    
    return new Response(
      JSON.stringify(result),
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
