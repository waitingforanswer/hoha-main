import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId } = await req.json();

    if (!userId) {
      console.error("Missing userId parameter");
      return new Response(
        JSON.stringify({ error: "userId is required", permissions: [] }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log("Fetching permissions for user:", userId);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch user permissions with permission codes
    const { data: userPermissions, error } = await supabase
      .from("user_permissions")
      .select(`
        permission_id,
        permissions:permission_id (
          code
        )
      `)
      .eq("user_id", userId);

    if (error) {
      console.error("Error fetching user permissions:", error);
      return new Response(
        JSON.stringify({ error: error.message, permissions: [] }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const permissions = userPermissions
      ?.map((up: any) => up.permissions?.code)
      .filter(Boolean) || [];

    console.log("Found permissions:", permissions);

    return new Response(
      JSON.stringify({ permissions }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in get-user-permissions:", error);
    return new Response(
      JSON.stringify({ error: errorMessage, permissions: [] }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
