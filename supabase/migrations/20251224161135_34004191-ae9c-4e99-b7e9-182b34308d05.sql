-- Add lineage_type column to family_members table
-- Values: 'primary' (họ Hà), 'spouse' (dâu/rể), 'maternal' (con ngoại tộc - mẹ họ Hà, theo họ bố)
ALTER TABLE public.family_members 
ADD COLUMN IF NOT EXISTS lineage_type text DEFAULT 'primary' 
CHECK (lineage_type IN ('primary', 'spouse', 'maternal'));

-- Migrate existing data based on is_primary_lineage field
UPDATE public.family_members 
SET lineage_type = CASE 
  WHEN is_primary_lineage = false THEN 'spouse'
  ELSE 'primary'
END
WHERE lineage_type IS NULL OR lineage_type = 'primary';

-- Add comment for documentation
COMMENT ON COLUMN public.family_members.lineage_type IS 'Loại dòng tộc: primary=họ Hà, spouse=dâu/rể, maternal=con ngoại tộc (mẹ họ Hà theo họ bố)';