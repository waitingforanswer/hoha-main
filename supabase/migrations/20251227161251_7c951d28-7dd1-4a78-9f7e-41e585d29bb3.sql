-- Add MANAGE_POSTS permission
INSERT INTO public.permissions (code, name) 
VALUES ('MANAGE_POSTS', 'Quản lý bài viết')
ON CONFLICT (code) DO NOTHING;

-- Update RLS policy for family_members to allow users with MANAGE_MEMBERS permission
DROP POLICY IF EXISTS "Users with MANAGE_MEMBERS can manage family members" ON public.family_members;

CREATE POLICY "Users with MANAGE_MEMBERS can manage family members"
ON public.family_members
FOR ALL
USING (
  is_admin(auth.uid()) 
  OR has_permission(auth.uid(), 'MANAGE_MEMBERS')
  OR app_user_has_permission(auth.uid(), 'MANAGE_MEMBERS')
);

-- Also update the SELECT policy to include MANAGE_MEMBERS
DROP POLICY IF EXISTS "Users with permission can view family members" ON public.family_members;

CREATE POLICY "Users with permission can view family members"
ON public.family_members
FOR SELECT
USING (
  is_admin(auth.uid()) 
  OR app_user_has_permission(auth.uid(), 'VIEW_FAMILY_TREE')
  OR app_user_has_permission(auth.uid(), 'MANAGE_MEMBERS')
);