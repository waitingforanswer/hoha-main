import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useImageUpload } from "@/hooks/useImageUpload";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { X, Image as ImageIcon, Loader2, Calendar } from "lucide-react";
import { format } from "date-fns";
import PostImageGallery from "./PostImageGallery";

interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string | null;
  featured_image: string | null;
  is_published: boolean | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  category_id: string | null;
  author_name: string | null;
  updated_by: string | null;
}

interface PostImage {
  id: string;
  post_id: string;
  image_url: string;
  caption: string | null;
  sort_order: number;
  created_at: string;
}

interface PostFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  post: Post | null;
  onSuccess: () => void;
}

export default function PostForm({
  open,
  onOpenChange,
  post,
  onSuccess,
}: PostFormProps) {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [featuredImage, setFeaturedImage] = useState<string | null>(null);
  const [isPublished, setIsPublished] = useState(false);
  const [publishedAt, setPublishedAt] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Gallery state
  const [galleryImages, setGalleryImages] = useState<PostImage[]>([]);
  const [tempGalleryImages, setTempGalleryImages] = useState<{ url: string; caption: string }[]>([]);

  // Image upload hook for featured image
  const { uploading, uploadImage, deleteImage } = useImageUpload({
    bucket: "post-images",
    folder: "featured",
    maxSizeMB: 2,
    maxWidthOrHeight: 1920,
  });

  // Get current user's display name
  const getCurrentUserName = () => {
    if (user?.user_metadata?.full_name) {
      return user.user_metadata.full_name;
    }
    if (user?.email) {
      return user.email.split("@")[0];
    }
    return "Admin";
  };

  // Fetch gallery images when editing a post
  const fetchGalleryImages = async (postId: string) => {
    try {
      const { data, error } = await supabase
        .from("post_images")
        .select("*")
        .eq("post_id", postId)
        .order("sort_order", { ascending: true });

      if (error) throw error;
      setGalleryImages(data || []);
    } catch (error) {
      console.error("Error fetching gallery images:", error);
    }
  };

  useEffect(() => {
    if (post) {
      setTitle(post.title);
      setSlug(post.slug);
      setExcerpt(post.excerpt || "");
      setContent(post.content || "");
      setFeaturedImage(post.featured_image);
      setIsPublished(post.is_published || false);
      setPublishedAt(post.published_at ? format(new Date(post.published_at), "yyyy-MM-dd'T'HH:mm") : "");
      setAuthorName(post.author_name || "");
      fetchGalleryImages(post.id);
    } else {
      // Reset form for new post
      setTitle("");
      setSlug("");
      setExcerpt("");
      setContent("");
      setFeaturedImage(null);
      setIsPublished(false);
      // Default published_at to now
      setPublishedAt(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
      // Default author to current user
      setAuthorName(getCurrentUserName());
      setGalleryImages([]);
      setTempGalleryImages([]);
    }
  }, [post, open, user]);

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/Đ/g, "D")
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  };

  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (!post) {
      setSlug(generateSlug(value));
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const result = await uploadImage(file);
    if (result) {
      setFeaturedImage(result.url);
      toast({ title: "Đã tải ảnh lên!" });
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeImage = async () => {
    if (featuredImage) {
      await deleteImage(featuredImage);
    }
    setFeaturedImage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập tiêu đề bài viết",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const currentUserName = getCurrentUserName();
      
      const postData = {
        title: title.trim(),
        slug: slug.trim() || generateSlug(title),
        excerpt: excerpt.trim() || null,
        content: content.trim() || null,
        featured_image: featuredImage,
        is_published: isPublished,
        published_at: publishedAt ? new Date(publishedAt).toISOString() : null,
        author_name: authorName.trim() || currentUserName,
        updated_by: currentUserName,
      };

      if (post) {
        // Update existing post
        const { error } = await supabase
          .from("posts")
          .update(postData)
          .eq("id", post.id);

        if (error) throw error;
        toast({ title: "Đã cập nhật bài viết!" });
      } else {
        // Create new post
        const { data: newPost, error } = await supabase
          .from("posts")
          .insert([postData])
          .select()
          .single();

        if (error) throw error;

        // Save temp gallery images to database
        if (newPost && tempGalleryImages.length > 0) {
          const galleryData = tempGalleryImages.map((img, index) => ({
            post_id: newPost.id,
            image_url: img.url,
            caption: img.caption || null,
            sort_order: index,
          }));

          const { error: galleryError } = await supabase
            .from("post_images")
            .insert(galleryData);

          if (galleryError) {
            console.error("Error saving gallery images:", galleryError);
          }
        }

        toast({ title: "Đã tạo bài viết mới!" });
      }

      onSuccess();
    } catch (error: any) {
      console.error("Save error:", error);
      toast({
        title: "Lỗi",
        description: error.message || "Không thể lưu bài viết",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">
            {post ? "Chỉnh sửa bài viết" : "Thêm bài viết mới"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Featured Image */}
          <div className="space-y-2">
            <Label>Ảnh đại diện</Label>
            {featuredImage ? (
              <div className="relative aspect-video rounded-lg overflow-hidden border bg-muted">
                <img
                  src={featuredImage}
                  alt="Featured"
                  className="w-full h-full object-cover"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={removeImage}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="aspect-video rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/50 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-muted transition-colors"
              >
                {uploading ? (
                  <Loader2 className="h-10 w-10 text-muted-foreground animate-spin" />
                ) : (
                  <>
                    <ImageIcon className="h-10 w-10 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Click để tải ảnh lên
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Hỗ trợ JPEG, PNG, HEIC • Tối đa 20MB • Tự động nén
                    </p>
                  </>
                )}
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.heic,.heif"
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>

          {/* Image Gallery */}
          <PostImageGallery
            postId={post?.id || null}
            images={galleryImages}
            onImagesChange={setGalleryImages}
            tempImages={tempGalleryImages}
            onTempImagesChange={setTempGalleryImages}
          />

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Tiêu đề *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Nhập tiêu đề bài viết..."
              className="text-lg"
            />
          </div>

          {/* Slug */}
          <div className="space-y-2">
            <Label htmlFor="slug">Đường dẫn (slug)</Label>
            <Input
              id="slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="duong-dan-bai-viet"
              className="font-mono text-sm"
            />
          </div>

          {/* Excerpt */}
          <div className="space-y-2">
            <Label htmlFor="excerpt">Tóm tắt</Label>
            <Textarea
              id="excerpt"
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="Mô tả ngắn về bài viết..."
              rows={3}
            />
          </div>

          {/* Content */}
          <div className="space-y-2">
            <Label htmlFor="content">Nội dung</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Nội dung bài viết..."
              rows={10}
              className="min-h-[200px]"
            />
          </div>

          {/* Author Name */}
          <div className="space-y-2">
            <Label htmlFor="authorName">Người viết bài</Label>
            <Input
              id="authorName"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              placeholder="Tên người viết bài..."
            />
            <p className="text-xs text-muted-foreground">
              Mặc định là tên tài khoản đang đăng nhập, có thể chỉnh sửa thủ công
            </p>
          </div>

          {/* Published At */}
          <div className="space-y-2">
            <Label htmlFor="publishedAt">Ngày xuất bản</Label>
            <div className="relative">
              <Input
                id="publishedAt"
                type="datetime-local"
                value={publishedAt}
                onChange={(e) => setPublishedAt(e.target.value)}
                className="pl-10"
              />
              <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground">
              Ngày này sẽ hiển thị trên timeline công khai
            </p>
          </div>

          {/* Publish Toggle */}
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="published">Xuất bản</Label>
              <p className="text-sm text-muted-foreground">
                Bài viết sẽ hiển thị công khai trên trang Bài Viết
              </p>
            </div>
            <Switch
              id="published"
              checked={isPublished}
              onCheckedChange={setIsPublished}
            />
          </div>

          {/* Post metadata (read-only info) */}
          {post && (
            <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Thông tin bài viết</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Ngày tạo:</span>{" "}
                  {format(new Date(post.created_at), "HH:mm dd/MM/yyyy")}
                </div>
                <div>
                  <span className="text-muted-foreground">Cập nhật:</span>{" "}
                  {format(new Date(post.updated_at), "HH:mm dd/MM/yyyy")}
                </div>
                {post.updated_by && (
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Người chỉnh sửa:</span>{" "}
                    {post.updated_by}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {post ? "Cập nhật" : "Tạo bài viết"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
