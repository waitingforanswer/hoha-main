-- Create enum for feedback status
CREATE TYPE public.feedback_status AS ENUM ('new', 'processing', 'done');

-- Create feedback table
CREATE TABLE public.feedbacks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  message TEXT NOT NULL,
  status feedback_status NOT NULL DEFAULT 'new',
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.feedbacks ENABLE ROW LEVEL SECURITY;

-- Public can insert feedback
CREATE POLICY "Anyone can submit feedback"
ON public.feedbacks
FOR INSERT
WITH CHECK (true);

-- Admins can view all feedback
CREATE POLICY "Admins can view all feedback"
ON public.feedbacks
FOR SELECT
USING (is_admin(auth.uid()));

-- Admins can update feedback
CREATE POLICY "Admins can update feedback"
ON public.feedbacks
FOR UPDATE
USING (is_admin(auth.uid()));

-- Admins can delete feedback
CREATE POLICY "Admins can delete feedback"
ON public.feedbacks
FOR DELETE
USING (is_admin(auth.uid()));

-- Create trigger for updated_at
CREATE TRIGGER update_feedbacks_updated_at
BEFORE UPDATE ON public.feedbacks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();