import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Fetch total members and generations
    const membersRes = await supabase
      .from("family_members")
      .select("generation", { count: "exact" });

    // Fetch total posts
    const postsRes = await supabase
      .from("posts")
      .select("id", { count: "exact" });

    const members = membersRes.data || [];
    const generations = new Set(members.map((m: any) => m.generation));

    return new Response(
      JSON.stringify({
        totalMembers: members.length,
        totalPosts: postsRes.count || 0,
        totalGenerations: generations.size,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
