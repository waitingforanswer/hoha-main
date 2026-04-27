-- Create permissions table
CREATE TABLE public.permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;

-- Everyone can view permissions
CREATE POLICY "Permissions are viewable by everyone" 
ON public.permissions FOR SELECT 
USING (true);

-- Create role_permissions junction table
CREATE TABLE public.role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id uuid REFERENCES public.roles(id) ON DELETE CASCADE NOT NULL,
  permission_id uuid REFERENCES public.permissions(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE (role_id, permission_id)
);

ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- Everyone can view role_permissions
CREATE POLICY "Role permissions are viewable by everyone" 
ON public.role_permissions FOR SELECT 
USING (true);

-- Admins can manage role_permissions
CREATE POLICY "Admins can manage role permissions" 
ON public.role_permissions FOR ALL 
USING (is_admin(auth.uid()));

-- Seed permissions
INSERT INTO public.permissions (code, name) VALUES 
  ('VIEW_FAMILY_TREE', 'Xem cây gia phả'),
  ('VIEW_MEMBER_DETAIL', 'Xem chi tiết thành viên');

-- Assign permissions to USER role
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.code = 'USER';

-- Create function to check if user has permission (ADMIN bypasses all)
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
$$;