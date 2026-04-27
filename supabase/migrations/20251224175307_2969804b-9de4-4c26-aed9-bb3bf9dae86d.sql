-- Drop the existing public access policy
DROP POLICY IF EXISTS "Family members are viewable by everyone" ON public.family_members;

-- Create new policy requiring authentication to view family members
CREATE POLICY "Authenticated users can view family members"
ON public.family_members
FOR SELECT
TO authenticated
USING (true);

-- Also update categories to require authentication for consistency
DROP POLICY IF EXISTS "Categories are viewable by everyone" ON public.categories;

CREATE POLICY "Authenticated users can view categories"
ON public.categories
FOR SELECT
TO authenticated
USING (true);