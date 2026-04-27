-- Create app_user_roles junction table for app_users (custom auth users)
CREATE TABLE public.app_user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  app_user_id uuid REFERENCES public.app_users(id) ON DELETE CASCADE NOT NULL,
  role_id uuid REFERENCES public.roles(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE (app_user_id, role_id)
);

ALTER TABLE public.app_user_roles ENABLE ROW LEVEL SECURITY;

-- Admins can manage app user roles
CREATE POLICY "Admins can manage app user roles" 
ON public.app_user_roles FOR ALL 
USING (is_admin(auth.uid()));

-- App user roles are viewable (needed for permission checks)
CREATE POLICY "App user roles are viewable" 
ON public.app_user_roles FOR SELECT 
USING (true);

-- Assign USER role to all existing ACTIVE app_users
INSERT INTO public.app_user_roles (app_user_id, role_id)
SELECT au.id, r.id
FROM public.app_users au
CROSS JOIN public.roles r
WHERE au.status = 'ACTIVE' AND r.code = 'USER'
ON CONFLICT DO NOTHING;