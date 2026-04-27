-- Update RLS policies to allow sub-admins with MANAGE_MEMBERS and MANAGE_POSTS to view dashboard stats

-- =============================================
-- family_members: Allow sub-admin with MANAGE_MEMBERS to view and manage
-- =============================================
DROP POLICY IF EXISTS "Admins can manage family members" ON public.family_members;

CREATE POLICY "Admins and sub-admins with MANAGE_MEMBERS can manage family members"
  ON public.family_members FOR ALL
  USING (
    is_admin(auth.uid())
    OR has_permission(auth.uid(), 'MANAGE_MEMBERS')
  );

-- =============================================
-- posts: Allow sub-admin with MANAGE_POSTS to view and manage
-- =============================================
DROP POLICY IF EXISTS "Admins can view all posts" ON public.posts;

CREATE POLICY "Admins and sub-admins with MANAGE_POSTS can view all posts"
  ON public.posts FOR SELECT
  USING (
    is_published = true
    OR is_admin(auth.uid())
    OR has_permission(auth.uid(), 'MANAGE_POSTS')
  );

DROP POLICY IF EXISTS "Admins can manage posts" ON public.posts;

CREATE POLICY "Admins and sub-admins with MANAGE_POSTS can manage posts"
  ON public.posts FOR ALL
  USING (
    is_admin(auth.uid())
    OR has_permission(auth.uid(), 'MANAGE_POSTS')
  );
