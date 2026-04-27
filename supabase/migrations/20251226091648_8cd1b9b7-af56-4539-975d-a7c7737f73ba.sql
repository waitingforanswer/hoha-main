-- Create a function to check if user is sub_admin
CREATE OR REPLACE FUNCTION public.is_sub_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'sub_admin'
  )
$$;

-- Create a function to check if user can access admin panel (admin or sub_admin)
CREATE OR REPLACE FUNCTION public.can_access_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('admin', 'sub_admin')
  )
$$;

-- Create user_permissions table for direct permission assignment to users (for sub_admin)
CREATE TABLE IF NOT EXISTS public.user_permissions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  permission_id uuid NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, permission_id)
);

-- Enable RLS on user_permissions
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;

-- Only admins can manage user permissions
CREATE POLICY "Admins can manage user permissions"
ON public.user_permissions
FOR ALL
USING (is_admin(auth.uid()));

-- Users can view their own permissions
CREATE POLICY "Users can view own permissions"
ON public.user_permissions
FOR SELECT
USING (auth.uid() = user_id);

-- Update has_permission function to also check user_permissions table
CREATE OR REPLACE FUNCTION public.has_permission(_user_id uuid, _permission_code text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    -- Admin bypasses all permission checks
    public.is_admin(_user_id)
    OR
    -- Check if user has the permission via their roles
    EXISTS (
      SELECT 1
      FROM public.user_roles ur
      JOIN public.role_permissions rp ON rp.role_id = (
        SELECT id FROM public.roles WHERE code = ur.role::text
      )
      JOIN public.permissions p ON p.id = rp.permission_id
      WHERE ur.user_id = _user_id
        AND p.code = _permission_code
    )
    OR
    -- Check if user has direct permission assignment (for sub_admin)
    EXISTS (
      SELECT 1
      FROM public.user_permissions up
      JOIN public.permissions p ON p.id = up.permission_id
      WHERE up.user_id = _user_id
        AND p.code = _permission_code
    )
$$;

-- Add MANAGE_USERS permission for sub_admin
INSERT INTO public.permissions (code, name)
VALUES ('MANAGE_USERS', 'Quản lý người dùng')
ON CONFLICT (code) DO NOTHING;

-- Add MANAGE_MEMBERS permission for sub_admin
INSERT INTO public.permissions (code, name)
VALUES ('MANAGE_MEMBERS', 'Quản lý thành viên')
ON CONFLICT (code) DO NOTHING;

-- Add ACCESS_ADMIN permission for sub_admin
INSERT INTO public.permissions (code, name)
VALUES ('ACCESS_ADMIN', 'Truy cập trang quản trị')
ON CONFLICT (code) DO NOTHING;