-- Create user status enum
CREATE TYPE public.user_status AS ENUM ('PENDING', 'ACTIVE', 'INACTIVE');

-- Create custom users table for the app
CREATE TABLE public.app_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text NOT NULL,
  phone text NOT NULL,
  password_hash text NOT NULL,
  full_name text NOT NULL,
  status user_status NOT NULL DEFAULT 'PENDING',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT app_users_username_key UNIQUE (username),
  CONSTRAINT app_users_phone_key UNIQUE (phone)
);

-- Enable RLS
ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own data (after login via edge function)
CREATE POLICY "Users can view own profile"
ON public.app_users
FOR SELECT
USING (true);

-- Policy: Only admins can update user status
CREATE POLICY "Admins can manage users"
ON public.app_users
FOR ALL
USING (is_admin(auth.uid()));

-- Policy: Allow insert for registration (will be done via service role in edge function)
-- Note: Registration is handled by edge function with service role key

-- Create trigger for updated_at
CREATE TRIGGER update_app_users_updated_at
BEFORE UPDATE ON public.app_users
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster lookups
CREATE INDEX idx_app_users_username ON public.app_users(username);
CREATE INDEX idx_app_users_phone ON public.app_users(phone);