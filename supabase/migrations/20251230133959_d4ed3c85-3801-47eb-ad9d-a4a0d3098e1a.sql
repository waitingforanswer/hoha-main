-- Create table for homepage feature cards (Khám phá nguồn cội)
CREATE TABLE public.homepage_features (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  icon TEXT NOT NULL DEFAULT 'TreeDeciduous',
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  href TEXT NOT NULL DEFAULT '/',
  display_order INTEGER NOT NULL DEFAULT 0,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for homepage quotes (Câu nói tục ngữ)
CREATE TABLE public.homepage_quotes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quote TEXT NOT NULL,
  author TEXT NOT NULL DEFAULT 'Tục ngữ Việt Nam',
  is_visible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.homepage_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homepage_quotes ENABLE ROW LEVEL SECURITY;

-- RLS policies for homepage_features
CREATE POLICY "Homepage features are viewable by everyone" 
ON public.homepage_features 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage homepage features" 
ON public.homepage_features 
FOR ALL 
USING (is_admin(auth.uid()));

-- RLS policies for homepage_quotes
CREATE POLICY "Homepage quotes are viewable by everyone" 
ON public.homepage_quotes 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage homepage quotes" 
ON public.homepage_quotes 
FOR ALL 
USING (is_admin(auth.uid()));

-- Add triggers for updated_at
CREATE TRIGGER update_homepage_features_updated_at
BEFORE UPDATE ON public.homepage_features
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_homepage_quotes_updated_at
BEFORE UPDATE ON public.homepage_quotes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default data for features
INSERT INTO public.homepage_features (icon, title, description, href, display_order) VALUES
('TreeDeciduous', 'Cây Gia Phả', 'Xem cây gia phả nhiều đời với các mối quan hệ rõ ràng', '/cay-gia-pha', 1),
('Users', 'Thành Viên', 'Tìm hiểu thông tin về các thành viên trong dòng họ', '/cay-gia-pha', 2),
('BookOpen', 'Bài Viết', 'Đọc các bài viết về lịch sử và truyền thống dòng họ', '/bai-viet', 3),
('Search', 'Tìm Kiếm', 'Tìm kiếm thành viên theo tên hoặc quan hệ trong gia phả', '/cay-gia-pha', 4);

-- Insert default quote
INSERT INTO public.homepage_quotes (quote, author) VALUES
('Cây có cội, nước có nguồn. Con người có tổ tiên, không ai tự nhiên mà có.', 'Tục ngữ Việt Nam');