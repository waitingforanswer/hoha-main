-- Fix: Remove overly permissive SELECT policy on app_users
-- This policy was incorrectly allowing all authenticated users to read all user records
-- Edge Functions use service role and don't need this policy

DROP POLICY IF EXISTS "Users can view own profile" ON public.app_users;

-- No need to create a new SELECT policy for regular users
-- All app_users access should go through Edge Functions (custom-auth, admin-users)
-- which use service role key and bypass RLS

-- The existing admin policy already allows admin management:
-- "Admins can manage app users" - allows ALL operations for admins