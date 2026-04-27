-- Add author_name and updated_by columns to posts table
ALTER TABLE public.posts
ADD COLUMN author_name text DEFAULT NULL,
ADD COLUMN updated_by text DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.posts.author_name IS 'Tên người viết bài (có thể chỉnh sửa thủ công)';
COMMENT ON COLUMN public.posts.updated_by IS 'Tên người chỉnh sửa cuối cùng';