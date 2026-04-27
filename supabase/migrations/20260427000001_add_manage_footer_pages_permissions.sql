-- Add MANAGE_FOOTER and MANAGE_PAGES permissions for sub-admin access to footer and pages content

INSERT INTO public.permissions (code, name)
VALUES ('MANAGE_FOOTER', 'Quản lý Footer')
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.permissions (code, name)
VALUES ('MANAGE_PAGES', 'Quản lý Trang')
ON CONFLICT (code) DO NOTHING;
