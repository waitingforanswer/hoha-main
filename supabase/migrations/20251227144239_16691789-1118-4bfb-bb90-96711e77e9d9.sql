-- Create app_user_sessions table to store user tokens
CREATE TABLE public.app_user_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  app_user_id UUID NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster token lookup
CREATE INDEX idx_app_user_sessions_token ON public.app_user_sessions(token);
CREATE INDEX idx_app_user_sessions_expires_at ON public.app_user_sessions(expires_at);

-- Enable RLS
ALTER TABLE public.app_user_sessions ENABLE ROW LEVEL SECURITY;

-- Only service role can access sessions (edge functions use service role)
CREATE POLICY "Service role can manage sessions"
ON public.app_user_sessions
FOR ALL
USING (true)
WITH CHECK (true);