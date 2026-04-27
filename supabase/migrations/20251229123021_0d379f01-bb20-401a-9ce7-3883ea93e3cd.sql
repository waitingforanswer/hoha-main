-- Create family_marriages table to support multiple spouses
CREATE TABLE public.family_marriages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  husband_id UUID NOT NULL REFERENCES public.family_members(id) ON DELETE CASCADE,
  wife_id UUID NOT NULL REFERENCES public.family_members(id) ON DELETE CASCADE,
  marriage_order INTEGER NOT NULL DEFAULT 1,
  marriage_date DATE,
  divorce_date DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Ensure unique marriage relationship
  CONSTRAINT unique_marriage UNIQUE (husband_id, wife_id),
  -- Ensure marriage_order is positive
  CONSTRAINT positive_marriage_order CHECK (marriage_order > 0)
);

-- Enable Row Level Security
ALTER TABLE public.family_marriages ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users with permission can view marriages"
ON public.family_marriages
FOR SELECT
USING (
  is_admin(auth.uid()) 
  OR app_user_has_permission(auth.uid(), 'VIEW_FAMILY_TREE')
  OR app_user_has_permission(auth.uid(), 'MANAGE_MEMBERS')
);

CREATE POLICY "Users with MANAGE_MEMBERS can manage marriages"
ON public.family_marriages
FOR ALL
USING (
  is_admin(auth.uid()) 
  OR has_permission(auth.uid(), 'MANAGE_MEMBERS')
  OR app_user_has_permission(auth.uid(), 'MANAGE_MEMBERS')
);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_family_marriages_updated_at
BEFORE UPDATE ON public.family_marriages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster lookups
CREATE INDEX idx_family_marriages_husband ON public.family_marriages(husband_id);
CREATE INDEX idx_family_marriages_wife ON public.family_marriages(wife_id);
CREATE INDEX idx_family_marriages_order ON public.family_marriages(husband_id, marriage_order);