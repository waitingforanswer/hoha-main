-- ============================================================
-- SEED DATA - Dữ liệu mặc định cho dự án Gia Phả
-- ============================================================
-- File này chứa toàn bộ dữ liệu cần thiết để hệ thống hoạt động.
-- Tất cả INSERT đều sử dụng ON CONFLICT DO NOTHING nên có thể chạy nhiều lần an toàn.
--
-- Cách sử dụng:
--   1. Chạy migrations trước: supabase db push (hoặc supabase migration up)
--   2. Chạy seed: psql -f supabase/seed.sql
--      hoặc: supabase db reset (sẽ tự chạy seed.sql sau migrations)
--
-- Lưu ý:
--   - File này KHÔNG tạo bảng/schema - việc đó do migrations đảm nhận
--   - File này KHÔNG chứa dữ liệu thành viên gia phả - import qua Excel
--   - Storage buckets (avatars, post-images) đã được tạo trong migrations
-- ============================================================

BEGIN;

-- ============================================================
-- 1. ROLES
-- ============================================================
INSERT INTO public.roles (code, name) VALUES 
  ('ADMIN', 'Quản trị viên'),
  ('USER', 'Người dùng')
ON CONFLICT (code) DO NOTHING;

-- ============================================================
-- 2. PERMISSIONS
-- ============================================================
INSERT INTO public.permissions (code, name) VALUES 
  ('VIEW_FAMILY_TREE', 'Xem cây gia phả'),
  ('VIEW_MEMBER_DETAIL', 'Xem chi tiết thành viên'),
  ('MANAGE_USERS', 'Quản lý người dùng'),
  ('MANAGE_MEMBERS', 'Quản lý thành viên'),
  ('ACCESS_ADMIN', 'Truy cập trang quản trị'),
  ('MANAGE_POSTS', 'Quản lý bài viết')
ON CONFLICT (code) DO NOTHING;

-- ============================================================
-- 3. ROLE_PERMISSIONS - Gán tất cả permissions cho role USER
-- ============================================================
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.code = 'USER'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ============================================================
-- 4. CATEGORIES
-- ============================================================
INSERT INTO public.categories (name, slug, description) VALUES
  ('Giới thiệu', 'gioi-thieu', 'Bài viết giới thiệu về dòng họ'),
  ('Họ Hà', 'ho-ha', 'Tin tức và thông tin về dòng họ Hà'),
  ('Bài viết', 'bai-viet', 'Các bài viết chung')
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- 5. MENU ITEMS
-- ============================================================
INSERT INTO public.menu_items (label, page_key, display_order, is_visible, permission_code, require_auth) VALUES
  ('Trang chủ', 'home', 1, true, NULL, false),
  ('Giới thiệu', 'about', 2, true, NULL, false),
  ('Họ Hà', 'ho-ha', 3, true, NULL, false),
  ('Cây Gia Phả', 'family-tree', 4, true, 'VIEW_FAMILY_TREE', true),
  ('Bài Viết', 'articles', 5, true, NULL, false)
ON CONFLICT (page_key) DO NOTHING;

-- ============================================================
-- 6. FOOTER SETTINGS
-- ============================================================
INSERT INTO public.footer_settings (section_key, title, content, is_visible, display_order) VALUES
  ('about', 'Giới thiệu', '{"description": "Website gia phả dòng họ - Nơi lưu giữ và kết nối các thế hệ trong gia đình, giúp con cháu nhớ về nguồn cội.", "familyName": "Dòng Họ Hà"}', true, 1),
  ('quick_links', 'Liên kết', '{"links": [{"label": "Giới thiệu", "href": "/gioi-thieu"}, {"label": "Cây Gia Phả", "href": "/cay-gia-pha"}, {"label": "Bài viết", "href": "/bai-viet"}]}', true, 2),
  ('contact', 'Liên hệ', '{"address": "Việt Nam", "phone": "+84 xxx xxx xxx", "email": "contact@donghoha.vn"}', true, 3),
  ('message', 'Thông điệp', '{"quote": "Cây có cội, nước có nguồn. Con người có tổ tiên, không ai tự nhiên mà có."}', true, 4),
  ('copyright', 'Bản quyền', '{"text": "Dòng Họ Hà. Bảo lưu mọi quyền.", "tagline": "Xây dựng với ❤️ cho gia đình"}', true, 5)
ON CONFLICT (section_key) DO NOTHING;

-- ============================================================
-- 7. HOMEPAGE - Hero
-- ============================================================
-- Chỉ insert nếu bảng rỗng (bảng không có unique constraint ngoài id)
INSERT INTO public.homepage_hero (tagline, title_part1, title_part2, description, button1_text, button1_href, button2_text, button2_href)
SELECT 
  'Gìn giữ truyền thống - Kết nối thế hệ',
  'Gia Phả',
  'Dòng Họ Hà',
  'Nơi lưu giữ và kết nối các thế hệ trong gia đình, giúp con cháu nhớ về nguồn cội và truyền thống tốt đẹp của dòng họ.',
  'Xem Cây Gia Phả',
  '/cay-gia-pha',
  'Tìm Hiểu Thêm',
  '/gioi-thieu'
WHERE NOT EXISTS (SELECT 1 FROM public.homepage_hero LIMIT 1);

-- ============================================================
-- 8. HOMEPAGE - Features
-- ============================================================
INSERT INTO public.homepage_features (icon, title, description, href, display_order)
SELECT * FROM (VALUES
  ('TreeDeciduous', 'Cây Gia Phả', 'Xem cây gia phả nhiều đời với các mối quan hệ rõ ràng', '/cay-gia-pha', 1),
  ('Users', 'Thành Viên', 'Tìm hiểu thông tin về các thành viên trong dòng họ', '/cay-gia-pha', 2),
  ('BookOpen', 'Bài Viết', 'Đọc các bài viết về lịch sử và truyền thống dòng họ', '/bai-viet', 3),
  ('Search', 'Tìm Kiếm', 'Tìm kiếm thành viên theo tên hoặc quan hệ trong gia phả', '/cay-gia-pha', 4)
) AS v(icon, title, description, href, display_order)
WHERE NOT EXISTS (SELECT 1 FROM public.homepage_features LIMIT 1);

-- ============================================================
-- 9. HOMEPAGE - Quotes
-- ============================================================
INSERT INTO public.homepage_quotes (quote, author)
SELECT 'Cây có cội, nước có nguồn. Con người có tổ tiên, không ai tự nhiên mà có.', 'Tục ngữ Việt Nam'
WHERE NOT EXISTS (SELECT 1 FROM public.homepage_quotes LIMIT 1);

-- ============================================================
-- 10. ABOUT PAGE - Hero
-- ============================================================
INSERT INTO public.about_page_hero (title, subtitle)
SELECT 
  'Giữ gìn cội nguồn – Kết nối các thế hệ',
  'Nơi lưu giữ thông tin gia phả, câu chuyện tổ tiên và ký ức chung của gia đình'
WHERE NOT EXISTS (SELECT 1 FROM public.about_page_hero LIMIT 1);

-- ============================================================
-- 11. ABOUT PAGE - Sections
-- ============================================================
INSERT INTO public.about_page_sections (section_key, title, content, display_order) VALUES
  ('intro', 'Tại sao trang web này được tạo ra?', 'Thời gian trôi qua, nhiều thông tin về tổ tiên dần mờ nhạt. Những câu chuyện, những sự kiện quan trọng có thể bị lãng quên qua các thế hệ. Trang web này được tạo ra để lưu giữ, bảo tồn và chia sẻ những thông tin quý giá về gia phả, giúp các thế hệ sau hiểu rõ hơn về nguồn cội của mình.', 1),
  ('purposes_title', 'Mục đích của trang web', '', 2),
  ('note', NULL, 'Lưu ý: Đây là trang web phi thương mại, chỉ phục vụ cho mục đích lưu trữ và chia sẻ thông tin trong nội bộ gia đình.', 3),
  ('participation_title', 'Thành viên gia đình có thể tham gia như thế nào?', '', 4)
ON CONFLICT (section_key) DO NOTHING;

-- ============================================================
-- 12. ABOUT PAGE - List Items (Purpose)
-- ============================================================
-- Insert chỉ khi chưa có dữ liệu
INSERT INTO public.about_page_list_items (section_type, icon, title, description, display_order)
SELECT * FROM (VALUES
  ('purpose', 'FileText', 'Lưu trữ thông tin gia phả', 'Ghi chép đầy đủ, chính xác thông tin về các thành viên trong gia đình qua nhiều thế hệ', 1),
  ('purpose', 'Users', 'Thể hiện mối quan hệ giữa các thế hệ', 'Giúp mọi người dễ dàng hiểu được cách các thế hệ kết nối với nhau', 2),
  ('purpose', 'Heart', 'Lưu giữ câu chuyện và sự kiện gia đình', 'Ghi lại những kỷ niệm, những câu chuyện đáng nhớ của gia đình', 3),
  ('purpose', 'Compass', 'Giúp con cháu hiểu rõ nguồn cội', 'Tạo điều kiện cho thế hệ trẻ tìm hiểu và tự hào về dòng họ của mình', 4)
) AS v(section_type, icon, title, description, display_order)
WHERE NOT EXISTS (SELECT 1 FROM public.about_page_list_items WHERE section_type = 'purpose' LIMIT 1);

-- ============================================================
-- 13. ABOUT PAGE - List Items (Participation)
-- ============================================================
INSERT INTO public.about_page_list_items (section_type, icon, title, description, display_order)
SELECT * FROM (VALUES
  ('participation', 'MessageCircle', 'Góp ý và sửa lỗi', 'Nếu phát hiện thông tin chưa chính xác, hãy liên hệ để chúng tôi cập nhật', 1),
  ('participation', 'Upload', 'Đóng góp ảnh, câu chuyện, tài liệu', 'Bất kỳ tài liệu, ảnh cũ hay câu chuyện nào cũng đều quý giá', 2),
  ('participation', 'BookOpen', 'Đề xuất cập nhật thông tin gia phả', 'Thông báo về các sự kiện mốc: sinh, tử, hôn nhân...', 3)
) AS v(section_type, icon, title, description, display_order)
WHERE NOT EXISTS (SELECT 1 FROM public.about_page_list_items WHERE section_type = 'participation' LIMIT 1);

-- ============================================================
-- 14. ABOUT PAGE - Donation
-- ============================================================
INSERT INTO public.about_page_donation (title, description, box_title, account_name, account_number, note)
SELECT 
  'Góp sức duy trì',
  'Việc duy trì trang web cần một số chi phí định kỳ như hosting và tên miền. Nếu bạn muốn góp sức, chúng tôi rất cảm ơn. Đây hoàn toàn là tùy tâm và không bắt buộc.',
  'Góp sức duy trì – tùy tâm, không bắt buộc',
  '[Tên người nhận]',
  '[Số tài khoản]',
  'Mọi đóng góp đều được trân trọng và ghi nhận'
WHERE NOT EXISTS (SELECT 1 FROM public.about_page_donation LIMIT 1);

COMMIT;
