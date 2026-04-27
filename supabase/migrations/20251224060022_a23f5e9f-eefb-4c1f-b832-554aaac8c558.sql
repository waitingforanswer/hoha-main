-- Add is_primary_lineage field to mark Ha family members vs spouses
-- Add spouse_id field to link spouses together
ALTER TABLE public.family_members 
ADD COLUMN is_primary_lineage boolean DEFAULT true,
ADD COLUMN spouse_id uuid REFERENCES public.family_members(id);

-- Add index for spouse lookups
CREATE INDEX idx_family_members_spouse ON public.family_members(spouse_id);

-- Update comment
COMMENT ON COLUMN public.family_members.is_primary_lineage IS 'True if member is part of the Ha family lineage, false if they are a spouse who married into the family';
COMMENT ON COLUMN public.family_members.spouse_id IS 'Reference to the spouse member';