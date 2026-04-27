-- Create post_images table for storing multiple images per post
CREATE TABLE public.post_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  caption TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_post_images_post_id ON public.post_images(post_id);
CREATE INDEX idx_post_images_sort_order ON public.post_images(post_id, sort_order);

-- Enable RLS
ALTER TABLE public.post_images ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Admins can manage post images"
ON public.post_images
FOR ALL
USING (is_admin(auth.uid()));

CREATE POLICY "Published post images are viewable by everyone"
ON public.post_images
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.posts 
    WHERE posts.id = post_images.post_id 
    AND posts.is_published = true
  )
);

CREATE POLICY "Admins can view all post images"
ON public.post_images
FOR SELECT
USING (is_admin(auth.uid()));