-- Create roles table for role metadata
CREATE TABLE public.roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

-- Everyone can view roles
CREATE POLICY "Roles are viewable by everyone" 
ON public.roles FOR SELECT 
USING (true);

-- Seed roles
INSERT INTO public.roles (code, name) VALUES 
  ('ADMIN', 'Quản trị viên'),
  ('USER', 'Người dùng');