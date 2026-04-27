-- Create table for family events/important dates
CREATE TABLE public.family_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  is_recurring BOOLEAN NOT NULL DEFAULT false,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.family_events ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Family events are viewable by everyone"
ON public.family_events
FOR SELECT
USING (true);

CREATE POLICY "Admins can manage family events"
ON public.family_events
FOR ALL
USING (is_admin(auth.uid()));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_family_events_updated_at
BEFORE UPDATE ON public.family_events
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();