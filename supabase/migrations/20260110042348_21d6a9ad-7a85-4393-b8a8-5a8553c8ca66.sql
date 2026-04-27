-- Create storage bucket for post images
INSERT INTO storage.buckets (id, name, public)
VALUES ('post-images', 'post-images', true);

-- Create policies for post images bucket
CREATE POLICY "Post images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'post-images');

CREATE POLICY "Admins can upload post images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'post-images' AND is_admin(auth.uid()));

CREATE POLICY "Admins can update post images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'post-images' AND is_admin(auth.uid()));

CREATE POLICY "Admins can delete post images"
ON storage.objects FOR DELETE
USING (bucket_id = 'post-images' AND is_admin(auth.uid()));