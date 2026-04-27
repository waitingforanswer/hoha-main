-- SECURITY: lock down app_users table (contains password_hash)
-- Remove overly permissive policy
DROP POLICY IF EXISTS "Users can view own profile" ON public.app_users;

-- Replace with admin-only access policies
DROP POLICY IF EXISTS "Admins can manage users" ON public.app_users;

CREATE POLICY "Admins can manage app users"
ON public.app_users
FOR ALL
TO authenticated
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- Ensure RLS is enabled (idempotent)
ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;