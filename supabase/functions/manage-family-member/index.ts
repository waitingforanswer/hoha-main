import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { decode } from "https://deno.land/std@0.203.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check if it's a Supabase Auth token or app_user session token
    let hasPermission = false;
    let userId: string | null = null;

    // Try Supabase Auth first
    const { data: { user } } = await supabaseAdmin.auth.getUser(token);
    
    if (user) {
      userId = user.id;
      // Check if user is admin
      const { data: isAdmin } = await supabaseAdmin.rpc("is_admin", { _user_id: user.id });
      if (isAdmin) {
        hasPermission = true;
      } else {
        // Check if user has MANAGE_MEMBERS permission
        const { data: hasPerm } = await supabaseAdmin.rpc("has_permission", { 
          _user_id: user.id, 
          _permission_code: "MANAGE_MEMBERS" 
        });
        hasPermission = !!hasPerm;
      }
    } else {
      // Try app_user session token
      const { data: session } = await supabaseAdmin
        .from("app_user_sessions")
        .select("app_user_id, expires_at")
        .eq("token", token)
        .single();

      if (session && new Date(session.expires_at) > new Date()) {
        userId = session.app_user_id;
        
        // Check if app_user has MANAGE_MEMBERS permission
        const { data: hasPerm } = await supabaseAdmin.rpc("app_user_has_permission", {
          _user_id: session.app_user_id,
          _permission_code: "MANAGE_MEMBERS"
        });
        hasPermission = !!hasPerm;
      }
    }

    if (!hasPermission) {
      return new Response(
        JSON.stringify({ error: "Unauthorized", message: "Bạn không có quyền quản lý thành viên" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const { action, memberId, memberData, marriageData, marriageId, avatarData } = body;

    let result;

    switch (action) {
      case "create":
        const { data: newMember, error: createError } = await supabaseAdmin
          .from("family_members")
          .insert(memberData)
          .select()
          .single();
        
        if (createError) throw createError;
        result = newMember;
        console.log("Created member:", newMember.id);
        break;

      case "update":
        if (!memberId) {
          return new Response(
            JSON.stringify({ error: "Missing memberId for update" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        const { data: updatedMember, error: updateError } = await supabaseAdmin
          .from("family_members")
          .update(memberData)
          .eq("id", memberId)
          .select()
          .single();
        
        if (updateError) throw updateError;
        result = updatedMember;
        console.log("Updated member:", memberId);
        break;

      case "delete":
        if (!memberId) {
          return new Response(
            JSON.stringify({ error: "Missing memberId for delete" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        // First delete all marriages involving this member
        await supabaseAdmin
          .from("family_marriages")
          .delete()
          .or(`husband_id.eq.${memberId},wife_id.eq.${memberId}`);
        
        const { error: deleteError } = await supabaseAdmin
          .from("family_members")
          .delete()
          .eq("id", memberId);
        
        if (deleteError) throw deleteError;
        result = { success: true };
        console.log("Deleted member:", memberId);
        break;

      // Marriage management actions
      case "list_marriages":
        if (!memberId) {
          return new Response(
            JSON.stringify({ error: "Missing memberId for list_marriages" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        const { data: marriages, error: listError } = await supabaseAdmin
          .from("family_marriages")
          .select("*")
          .or(`husband_id.eq.${memberId},wife_id.eq.${memberId}`)
          .order("marriage_order", { ascending: true });
        
        if (listError) throw listError;
        result = marriages || [];
        console.log(`Listed ${result.length} marriages for member:`, memberId);
        break;

      case "create_marriage":
        if (!marriageData) {
          return new Response(
            JSON.stringify({ error: "Missing marriageData for create_marriage" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        // Validate required fields
        if (!marriageData.husband_id || !marriageData.wife_id) {
          return new Response(
            JSON.stringify({ error: "Missing husband_id or wife_id" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        // Get the next marriage order for this husband
        const { data: existingMarriages } = await supabaseAdmin
          .from("family_marriages")
          .select("marriage_order")
          .eq("husband_id", marriageData.husband_id)
          .order("marriage_order", { ascending: false })
          .limit(1);
        
        const nextOrder = existingMarriages && existingMarriages.length > 0 
          ? existingMarriages[0].marriage_order + 1 
          : 1;
        
        const { data: newMarriage, error: createMarriageError } = await supabaseAdmin
          .from("family_marriages")
          .insert({
            husband_id: marriageData.husband_id,
            wife_id: marriageData.wife_id,
            marriage_order: marriageData.marriage_order || nextOrder,
            marriage_date: marriageData.marriage_date || null,
            divorce_date: marriageData.divorce_date || null,
            is_active: marriageData.is_active !== false,
            notes: marriageData.notes || null,
          })
          .select()
          .single();
        
        if (createMarriageError) throw createMarriageError;
        
        // Update spouse_id on both members for backward compatibility
        await supabaseAdmin
          .from("family_members")
          .update({ spouse_id: marriageData.wife_id })
          .eq("id", marriageData.husband_id);
        await supabaseAdmin
          .from("family_members")
          .update({ spouse_id: marriageData.husband_id })
          .eq("id", marriageData.wife_id);
        
        result = newMarriage;
        console.log("Created marriage:", newMarriage.id);
        break;

      case "update_marriage":
        if (!marriageId || !marriageData) {
          return new Response(
            JSON.stringify({ error: "Missing marriageId or marriageData for update_marriage" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        const { data: updatedMarriage, error: updateMarriageError } = await supabaseAdmin
          .from("family_marriages")
          .update({
            marriage_order: marriageData.marriage_order,
            marriage_date: marriageData.marriage_date || null,
            divorce_date: marriageData.divorce_date || null,
            is_active: marriageData.is_active,
            notes: marriageData.notes || null,
          })
          .eq("id", marriageId)
          .select()
          .single();
        
        if (updateMarriageError) throw updateMarriageError;
        result = updatedMarriage;
        console.log("Updated marriage:", marriageId);
        break;

      case "delete_marriage":
        if (!marriageId) {
          return new Response(
            JSON.stringify({ error: "Missing marriageId for delete_marriage" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        // Get marriage info before deleting
        const { data: marriageToDelete } = await supabaseAdmin
          .from("family_marriages")
          .select("husband_id, wife_id")
          .eq("id", marriageId)
          .single();
        
        const { error: deleteMarriageError } = await supabaseAdmin
          .from("family_marriages")
          .delete()
          .eq("id", marriageId);
        
        if (deleteMarriageError) throw deleteMarriageError;
        
        // Check if there are other marriages for these members
        if (marriageToDelete) {
          const { data: remainingHusbandMarriages } = await supabaseAdmin
            .from("family_marriages")
            .select("wife_id")
            .eq("husband_id", marriageToDelete.husband_id)
            .order("marriage_order", { ascending: true })
            .limit(1);
          
          const { data: remainingWifeMarriages } = await supabaseAdmin
            .from("family_marriages")
            .select("husband_id")
            .eq("wife_id", marriageToDelete.wife_id)
            .limit(1);
          
          // Update spouse_id to first remaining marriage or null
          await supabaseAdmin
            .from("family_members")
            .update({ 
              spouse_id: remainingHusbandMarriages && remainingHusbandMarriages.length > 0 
                ? remainingHusbandMarriages[0].wife_id 
                : null 
            })
            .eq("id", marriageToDelete.husband_id);
          
          await supabaseAdmin
            .from("family_members")
            .update({ 
              spouse_id: remainingWifeMarriages && remainingWifeMarriages.length > 0 
                ? remainingWifeMarriages[0].husband_id 
                : null 
            })
            .eq("id", marriageToDelete.wife_id);
        }
        
        result = { success: true };
        console.log("Deleted marriage:", marriageId);
        break;

      case "upload_avatar":
        if (!memberId || !avatarData) {
          return new Response(
            JSON.stringify({ error: "Missing memberId or avatarData for upload_avatar" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        try {
          // Decode base64 image data
          const base64Data = avatarData.replace(/^data:image\/\w+;base64,/, "");
          const imageBuffer = decode(base64Data);
          
          const filePath = `${memberId}.jpg`;
          
          // Upload to storage using service role (bypasses RLS)
          const { error: uploadError } = await supabaseAdmin.storage
            .from("avatars")
            .upload(filePath, imageBuffer, {
              contentType: "image/jpeg",
              upsert: true,
            });
          
          if (uploadError) {
            console.error("Avatar upload error:", uploadError);
            throw uploadError;
          }
          
          // Get public URL
          const { data: urlData } = supabaseAdmin.storage
            .from("avatars")
            .getPublicUrl(filePath);
          
          const avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;
          
          // Update member with new avatar URL
          const { data: updatedMember, error: updateError } = await supabaseAdmin
            .from("family_members")
            .update({ avatar_url: avatarUrl })
            .eq("id", memberId)
            .select()
            .single();
          
          if (updateError) throw updateError;
          
          result = { avatar_url: avatarUrl, member: updatedMember };
          console.log("Uploaded avatar for member:", memberId);
        } catch (uploadErr: any) {
          console.error("Avatar upload failed:", uploadErr);
          return new Response(
            JSON.stringify({ error: uploadErr.message || "Failed to upload avatar" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        break;

      default:
        return new Response(
          JSON.stringify({ error: "Invalid action" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
