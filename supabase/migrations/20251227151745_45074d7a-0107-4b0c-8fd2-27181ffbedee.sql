-- Fix user_permissions to reference app_users (custom app accounts) instead of auth.users
ALTER TABLE public.user_permissions
  DROP CONSTRAINT IF EXISTS user_permissions_user_id_fkey;

ALTER TABLE public.user_permissions
  ADD CONSTRAINT user_permissions_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES public.app_users(id)
  ON DELETE CASCADE;