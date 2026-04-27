-- Add is_default_view column to family_members table
ALTER TABLE public.family_members 
ADD COLUMN is_default_view boolean DEFAULT false;

-- Create a function to ensure only one member has is_default_view = true
CREATE OR REPLACE FUNCTION public.ensure_single_default_view()
RETURNS TRIGGER AS $$
BEGIN
  -- If the new/updated row has is_default_view = true, set all others to false
  IF NEW.is_default_view = true THEN
    UPDATE public.family_members 
    SET is_default_view = false 
    WHERE id != NEW.id AND is_default_view = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger to enforce single default view
CREATE TRIGGER enforce_single_default_view
BEFORE INSERT OR UPDATE ON public.family_members
FOR EACH ROW
EXECUTE FUNCTION public.ensure_single_default_view();