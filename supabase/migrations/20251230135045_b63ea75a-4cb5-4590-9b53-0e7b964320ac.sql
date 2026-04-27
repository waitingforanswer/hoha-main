-- Create table for hero section content
CREATE TABLE public.homepage_hero (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tagline TEXT NOT NULL DEFAULT 'Gìn giữ truyền thống - Kết nối thế hệ',
  title_part1 TEXT NOT NULL DEFAULT 'Gia Phả',
  title_part2 TEXT NOT NULL DEFAULT 'Dòng Họ Hà',
  description TEXT NOT NULL DEFAULT 'Nơi lưu giữ và kết nối các thế hệ trong gia đình, giúp con cháu nhớ về nguồn cội và truyền thống tốt đẹp của dòng họ.',
  button1_text TEXT NOT NULL DEFAULT 'Xem Cây Gia Phả',
  button1_href TEXT NOT NULL DEFAULT '/cay-gia-pha',
  button2_text TEXT NOT NULL DEFAULT 'Tìm Hiểu Thêm',
  button2_href TEXT NOT NULL DEFAULT '/gioi-thieu',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.homepage_hero ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Homepage hero is viewable by everyone" 
ON public.homepage_hero 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage homepage hero" 
ON public.homepage_hero 
FOR ALL 
USING (is_admin(auth.uid()));

-- Insert default data
INSERT INTO public.homepage_hero (tagline, title_part1, title_part2, description, button1_text, button1_href, button2_text, button2_href)
VALUES (
  'Gìn giữ truyền thống - Kết nối thế hệ',
  'Gia Phả',
  'Dòng Họ Hà',
  'Nơi lưu giữ và kết nối các thế hệ trong gia đình, giúp con cháu nhớ về nguồn cội và truyền thống tốt đẹp của dòng họ.',
  'Xem Cây Gia Phả',
  '/cay-gia-pha',
  'Tìm Hiểu Thêm',
  '/gioi-thieu'
);

-- Add trigger for updated_at
CREATE TRIGGER update_homepage_hero_updated_at
BEFORE UPDATE ON public.homepage_hero
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();