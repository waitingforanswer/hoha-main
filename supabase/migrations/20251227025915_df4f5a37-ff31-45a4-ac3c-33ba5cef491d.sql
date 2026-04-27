-- Fix: Restrict family_members access to users with VIEW_FAMILY_TREE permission or admins
-- Currently allows any authenticated user to view all family members' PII

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Authenticated users can view family members" ON public.family_members;

-- Create a function to check if a custom app_user has a specific permission
CREATE OR REPLACE FUNCTION public.app_user_has_permission(_user_id uuid, _permission_code text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.app_users au
    JOIN public.app_user_roles aur ON au.id = aur.app_user_id
    JOIN public.roles r ON aur.role_id = r.id
    JOIN public.role_permissions rp ON r.id = rp.role_id
    JOIN public.permissions p ON rp.permission_id = p.id
    WHERE au.id = _user_id 
    AND au.status = 'ACTIVE'
    AND p.code = _permission_code
  )
  OR EXISTS (
    -- Check if user is admin (has wildcard permission via admin role)
    SELECT 1 
    FROM public.app_users au
    JOIN public.app_user_roles aur ON au.id = aur.app_user_id
    JOIN public.roles r ON aur.role_id = r.id
    WHERE au.id = _user_id 
    AND au.status = 'ACTIVE'
    AND r.code = 'admin'
  )
  OR EXISTS (
    -- Check direct user permissions
    SELECT 1 
    FROM public.app_users au
    JOIN public.user_permissions up ON au.id = up.user_id
    JOIN public.permissions p ON up.permission_id = p.id
    WHERE au.id = _user_id 
    AND au.status = 'ACTIVE'
    AND p.code = _permission_code
  )
$$;

-- Create new restrictive policy for family_members
-- Only allows:
-- 1. Supabase Auth admins (via is_admin function)
-- 2. Active app_users with VIEW_FAMILY_TREE permission
CREATE POLICY "Users with permission can view family members"
ON public.family_members
FOR SELECT
USING (
  public.is_admin(auth.uid())
  OR public.app_user_has_permission(auth.uid(), 'VIEW_FAMILY_TREE')
);

-- Note: app_users table already has proper RLS (admin-only access)
-- All app_users queries go through Edge Functions with service role