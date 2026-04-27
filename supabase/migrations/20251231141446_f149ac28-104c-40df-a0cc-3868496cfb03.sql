-- Create about page hero table
CREATE TABLE public.about_page_hero (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL DEFAULT 'Giữ gìn cội nguồn – Kết nối các thế hệ',
  subtitle TEXT NOT NULL DEFAULT 'Nơi lưu giữ thông tin gia phả, câu chuyện tổ tiên và ký ức chung của gia đình',
  background_image TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create about page sections table (for text sections)
CREATE TABLE public.about_page_sections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  section_key TEXT NOT NULL UNIQUE,
  title TEXT,
  content TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create about page list items table (for purposes and participation sections)
CREATE TABLE public.about_page_list_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  section_type TEXT NOT NULL, -- 'purpose' or 'participation'
  icon TEXT NOT NULL DEFAULT 'FileText',
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create about page donation table
CREATE TABLE public.about_page_donation (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL DEFAULT 'Góp sức duy trì',
  description TEXT NOT NULL DEFAULT 'Việc duy trì trang web cần một số chi phí định kỳ như hosting và tên miền. Nếu bạn muốn góp sức, chúng tôi rất cảm ơn. Đây hoàn toàn là tùy tâm và không bắt buộc.',
  box_title TEXT NOT NULL DEFAULT 'Góp sức duy trì – tùy tâm, không bắt buộc',
  account_name TEXT NOT NULL DEFAULT '[Tên người nhận]',
  account_number TEXT NOT NULL DEFAULT '[Số tài khoản]',
  qr_code_url TEXT,
  note TEXT DEFAULT 'Mọi đóng góp đều được trân trọng và ghi nhận',
  is_visible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.about_page_hero ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.about_page_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.about_page_list_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.about_page_donation ENABLE ROW LEVEL SECURITY;

-- RLS policies for about_page_hero
CREATE POLICY "About page hero is viewable by everyone" ON public.about_page_hero FOR SELECT USING (true);
CREATE POLICY "Admins can manage about page hero" ON public.about_page_hero FOR ALL USING (is_admin(auth.uid()));

-- RLS policies for about_page_sections
CREATE POLICY "About page sections are viewable by everyone" ON public.about_page_sections FOR SELECT USING (true);
CREATE POLICY "Admins can manage about page sections" ON public.about_page_sections FOR ALL USING (is_admin(auth.uid()));

-- RLS policies for about_page_list_items
CREATE POLICY "About page list items are viewable by everyone" ON public.about_page_list_items FOR SELECT USING (true);
CREATE POLICY "Admins can manage about page list items" ON public.about_page_list_items FOR ALL USING (is_admin(auth.uid()));

-- RLS policies for about_page_donation
CREATE POLICY "About page donation is viewable by everyone" ON public.about_page_donation FOR SELECT USING (true);
CREATE POLICY "Admins can manage about page donation" ON public.about_page_donation FOR ALL USING (is_admin(auth.uid()));

-- Insert default hero data
INSERT INTO public.about_page_hero (title, subtitle) VALUES (
  'Giữ gìn cội nguồn – Kết nối các thế hệ',
  'Nơi lưu giữ thông tin gia phả, câu chuyện tổ tiên và ký ức chung của gia đình'
);

-- Insert default sections
INSERT INTO public.about_page_sections (section_key, title, content, display_order) VALUES
('intro', 'Tại sao trang web này được tạo ra?', 'Thời gian trôi qua, nhiều thông tin về tổ tiên dần mờ nhạt. Những câu chuyện, những sự kiện quan trọng có thể bị lãng quên qua các thế hệ. Trang web này được tạo ra để lưu giữ, bảo tồn và chia sẻ những thông tin quý giá về gia phả, giúp các thế hệ sau hiểu rõ hơn về nguồn cội của mình.', 1),
('purposes_title', 'Mục đích của trang web', '', 2),
('note', NULL, 'Lưu ý: Đây là trang web phi thương mại, chỉ phục vụ cho mục đích lưu trữ và chia sẻ thông tin trong nội bộ gia đình.', 3),
('participation_title', 'Thành viên gia đình có thể tham gia như thế nào?', '', 4);

-- Insert default purpose items
INSERT INTO public.about_page_list_items (section_type, icon, title, description, display_order) VALUES
('purpose', 'FileText', 'Lưu trữ thông tin gia phả', 'Ghi chép đầy đủ, chính xác thông tin về các thành viên trong gia đình qua nhiều thế hệ', 1),
('purpose', 'Users', 'Thể hiện mối quan hệ giữa các thế hệ', 'Giúp mọi người dễ dàng hiểu được cách các thế hệ kết nối với nhau', 2),
('purpose', 'Heart', 'Lưu giữ câu chuyện và sự kiện gia đình', 'Ghi lại những kỷ niệm, những câu chuyện đáng nhớ của gia đình', 3),
('purpose', 'Compass', 'Giúp con cháu hiểu rõ nguồn cội', 'Tạo điều kiện cho thế hệ trẻ tìm hiểu và tự hào về dòng họ của mình', 4);

-- Insert default participation items
INSERT INTO public.about_page_list_items (section_type, icon, title, description, display_order) VALUES
('participation', 'MessageCircle', 'Góp ý và sửa lỗi', 'Nếu phát hiện thông tin chưa chính xác, hãy liên hệ để chúng tôi cập nhật', 1),
('participation', 'Upload', 'Đóng góp ảnh, câu chuyện, tài liệu', 'Bất kỳ tài liệu, ảnh cũ hay câu chuyện nào cũng đều quý giá', 2),
('participation', 'BookOpen', 'Đề xuất cập nhật thông tin gia phả', 'Thông báo về các sự kiện mốc: sinh, tử, hôn nhân...', 3);

-- Insert default donation data
INSERT INTO public.about_page_donation (title, description, box_title, account_name, account_number, note) VALUES (
  'Góp sức duy trì',
  'Việc duy trì trang web cần một số chi phí định kỳ như hosting và tên miền. Nếu bạn muốn góp sức, chúng tôi rất cảm ơn. Đây hoàn toàn là tùy tâm và không bắt buộc.',
  'Góp sức duy trì – tùy tâm, không bắt buộc',
  '[Tên người nhận]',
  '[Số tài khoản]',
  'Mọi đóng góp đều được trân trọng và ghi nhận'
);

-- Create triggers for updated_at
CREATE TRIGGER update_about_page_hero_updated_at BEFORE UPDATE ON public.about_page_hero FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_about_page_sections_updated_at BEFORE UPDATE ON public.about_page_sections FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_about_page_list_items_updated_at BEFORE UPDATE ON public.about_page_list_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_about_page_donation_updated_at BEFORE UPDATE ON public.about_page_donation FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();