-- Create storage bucket for family member avatars
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);

-- Create policies for avatar uploads
CREATE POLICY "Avatar images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'avatars');

CREATE POLICY "Admins can upload avatars" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'avatars' AND public.is_admin(auth.uid()));

CREATE POLICY "Admins can update avatars" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'avatars' AND public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete avatars" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'avatars' AND public.is_admin(auth.uid()));