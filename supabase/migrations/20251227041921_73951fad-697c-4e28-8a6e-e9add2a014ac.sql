-- Create menu_items table for Global Menu management
CREATE TABLE public.menu_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  label TEXT NOT NULL,
  page_key TEXT NOT NULL UNIQUE,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  permission_code TEXT DEFAULT NULL,
  require_auth BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create footer_settings table for Footer management
CREATE TABLE public.footer_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  section_key TEXT NOT NULL UNIQUE,
  title TEXT,
  content JSONB NOT NULL DEFAULT '{}',
  is_visible BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.footer_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for menu_items
CREATE POLICY "Menu items are viewable by everyone" 
ON public.menu_items 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage menu items" 
ON public.menu_items 
FOR ALL 
USING (is_admin(auth.uid()));

-- RLS Policies for footer_settings
CREATE POLICY "Footer settings are viewable by everyone" 
ON public.footer_settings 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage footer settings" 
ON public.footer_settings 
FOR ALL 
USING (is_admin(auth.uid()));

-- Add triggers for updated_at
CREATE TRIGGER update_menu_items_updated_at
BEFORE UPDATE ON public.menu_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_footer_settings_updated_at
BEFORE UPDATE ON public.footer_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default menu items based on current header
INSERT INTO public.menu_items (label, page_key, display_order, is_visible, permission_code, require_auth) VALUES
  ('Trang chủ', 'home', 1, true, NULL, false),
  ('Giới thiệu', 'about', 2, true, NULL, false),
  ('Họ Hà', 'ho-ha', 3, true, NULL, false),
  ('Cây Gia Phả', 'family-tree', 4, true, 'VIEW_FAMILY_TREE', true),
  ('Bài Viết', 'articles', 5, true, NULL, false);

-- Insert default footer settings based on current footer
INSERT INTO public.footer_settings (section_key, title, content, is_visible, display_order) VALUES
  ('about', 'Giới thiệu', '{"description": "Website gia phả dòng họ - Nơi lưu giữ và kết nối các thế hệ trong gia đình, giúp con cháu nhớ về nguồn cội.", "familyName": "Dòng Họ Hà"}', true, 1),
  ('quick_links', 'Liên kết', '{"links": [{"label": "Giới thiệu", "href": "/gioi-thieu"}, {"label": "Cây Gia Phả", "href": "/cay-gia-pha"}, {"label": "Bài viết", "href": "/bai-viet"}]}', true, 2),
  ('contact', 'Liên hệ', '{"address": "Việt Nam", "phone": "+84 xxx xxx xxx", "email": "contact@donghoha.vn"}', true, 3),
  ('message', 'Thông điệp', '{"quote": "Cây có cội, nước có nguồn. Con người có tổ tiên, không ai tự nhiên mà có."}', true, 4),
  ('copyright', 'Bản quyền', '{"text": "Dòng Họ Hà. Bảo lưu mọi quyền.", "tagline": "Xây dựng với ❤️ cho gia đình"}', true, 5);