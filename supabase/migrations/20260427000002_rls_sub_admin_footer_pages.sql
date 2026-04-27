-- Update RLS policies to allow sub-admins with MANAGE_FOOTER and MANAGE_PAGES permissions

-- =============================================
-- FOOTER: Update RLS to allow sub-admins with MANAGE_FOOTER
-- =============================================
DROP POLICY IF EXISTS "Admins can manage footer settings" ON public.footer_settings;

CREATE POLICY "Admins and sub-admins with MANAGE_FOOTER can manage footer settings"
ON public.footer_settings
FOR ALL
USING (
  is_admin(auth.uid())
  OR has_permission(auth.uid(), 'MANAGE_FOOTER')
);

-- =============================================
-- PAGES: Update RLS to allow sub-admins with MANAGE_PAGES
-- =============================================

-- homepage_hero
DROP POLICY IF EXISTS "Admins can manage homepage hero" ON public.homepage_hero;

CREATE POLICY "Admins and sub-admins with MANAGE_PAGES can manage homepage hero"
ON public.homepage_hero
FOR ALL
USING (
  is_admin(auth.uid())
  OR has_permission(auth.uid(), 'MANAGE_PAGES')
);

-- homepage_features
DROP POLICY IF EXISTS "Admins can manage homepage features" ON public.homepage_features;

CREATE POLICY "Admins and sub-admins with MANAGE_PAGES can manage homepage features"
ON public.homepage_features
FOR ALL
USING (
  is_admin(auth.uid())
  OR has_permission(auth.uid(), 'MANAGE_PAGES')
);

-- homepage_quotes
DROP POLICY IF EXISTS "Admins can manage homepage quotes" ON public.homepage_quotes;

CREATE POLICY "Admins and sub-admins with MANAGE_PAGES can manage homepage quotes"
ON public.homepage_quotes
FOR ALL
USING (
  is_admin(auth.uid())
  OR has_permission(auth.uid(), 'MANAGE_PAGES')
);

-- about_page_hero
DROP POLICY IF EXISTS "Admins can manage about page hero" ON public.about_page_hero;

CREATE POLICY "Admins and sub-admins with MANAGE_PAGES can manage about page hero"
ON public.about_page_hero
FOR ALL
USING (
  is_admin(auth.uid())
  OR has_permission(auth.uid(), 'MANAGE_PAGES')
);

-- about_page_sections
DROP POLICY IF EXISTS "Admins can manage about page sections" ON public.about_page_sections;

CREATE POLICY "Admins and sub-admins with MANAGE_PAGES can manage about page sections"
ON public.about_page_sections
FOR ALL
USING (
  is_admin(auth.uid())
  OR has_permission(auth.uid(), 'MANAGE_PAGES')
);

-- about_page_list_items
DROP POLICY IF EXISTS "Admins can manage about page list items" ON public.about_page_list_items;

CREATE POLICY "Admins and sub-admins with MANAGE_PAGES can manage about page list items"
ON public.about_page_list_items
FOR ALL
USING (
  is_admin(auth.uid())
  OR has_permission(auth.uid(), 'MANAGE_PAGES')
);

-- about_page_donation
DROP POLICY IF EXISTS "Admins can manage about page donation" ON public.about_page_donation;

CREATE POLICY "Admins and sub-admins with MANAGE_PAGES can manage about page donation"
ON public.about_page_donation
FOR ALL
USING (
  is_admin(auth.uid())
  OR has_permission(auth.uid(), 'MANAGE_PAGES')
);
