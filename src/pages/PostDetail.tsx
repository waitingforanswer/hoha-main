import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { MainLayout } from "@/components/layout";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, ArrowLeft, Share2, Clock } from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import PostCarousel from "@/components/posts/PostCarousel";

interface Post {
  id: string;
  title: string;
  excerpt: string | null;
  content: string | null;
  featured_image: string | null;
  published_at: string | null;
  created_at: string;
  author_name: string | null;
}

interface PostImage {
  id: string;
  image_url: string;
  caption: string | null;
  sort_order: number;
}

export default function PostDetail() {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [galleryImages, setGalleryImages] = useState<PostImage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchPost(id);
    }
  }, [id]);

  const fetchPost = async (postId: string) => {
    try {
      // Fetch post and gallery images in parallel
      const [postResult, imagesResult] = await Promise.all([
        supabase
          .from("posts")
          .select("*")
          .eq("id", postId)
          .eq("is_published", true)
          .single(),
        supabase
          .from("post_images")
          .select("*")
          .eq("post_id", postId)
          .order("sort_order", { ascending: true }),
      ]);

      if (postResult.error) throw postResult.error;
      setPost(postResult.data);
      setGalleryImages(imagesResult.data || []);
    } catch (error) {
      console.error("Error fetching post:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "";
    return format(new Date(dateString), "dd MMMM, yyyy", { locale: vi });
  };

  const estimateReadTime = (content: string | null) => {
    if (!content) return 1;
    const wordsPerMinute = 200;
    const words = content.split(/\s+/).length;
    return Math.max(1, Math.ceil(words / wordsPerMinute));
  };

  const handleShare = async () => {
    const url = window.location.href;
    const title = post?.title || "Bài viết";

    if (navigator.share) {
      try {
        await navigator.share({
          title,
          url,
        });
      } catch (error) {
        // User cancelled or error
      }
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(url);
      toast.success("Đã sao chép liên kết!");
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <PostDetailSkeleton />
      </MainLayout>
    );
  }

  if (!post) {
    return (
      <MainLayout>
        <div className="min-h-[60vh] flex items-center justify-center px-4">
          <div className="text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
              Không tìm thấy bài viết
            </h2>
            <p className="text-muted-foreground text-lg mb-6">
              Bài viết này có thể đã bị xóa hoặc chưa được xuất bản
            </p>
            <Link to="/bai-viet">
              <Button size="lg" className="text-base px-6 py-3 h-auto">
                <ArrowLeft className="w-5 h-5 mr-2" />
                Quay lại danh sách
              </Button>
            </Link>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      {/* Back Navigation - Sticky trên mobile */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border/50 sm:relative sm:border-0 sm:bg-transparent">
        <div className="container px-4 md:px-6 py-3 md:py-6">
          <Link
            to="/bai-viet"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors text-base font-medium"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Tất cả bài viết</span>
          </Link>
        </div>
      </div>

      <article className="pb-12 md:pb-20">
        <div className="container px-4 md:px-6 max-w-3xl mx-auto">
          {/* Image Gallery Carousel - shown if multiple images */}
          {galleryImages.length > 0 && (
            <PostCarousel images={galleryImages} className="mb-6 md:mb-8" />
          )}

          {/* Featured Image - shown only if no gallery images */}
          {galleryImages.length === 0 && post.featured_image && (
            <div className="aspect-[16/10] md:aspect-video rounded-xl md:rounded-2xl overflow-hidden mb-6 md:mb-8 shadow-card">
              <img
                src={post.featured_image}
                alt={post.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Article Header */}
          <header className="mb-6 md:mb-8">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-4 leading-tight">
              {post.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                <time className="text-base">
                  {formatDate(post.published_at || post.created_at)}
                </time>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                <span className="text-base">
                  {estimateReadTime(post.content)} phút đọc
                </span>
              </div>
              {post.author_name && (
                <div className="flex items-center gap-2">
                  <span className="text-base">
                    Tác giả: <span className="font-medium">{post.author_name}</span>
                  </span>
                </div>
              )}
            </div>
          </header>

          {/* Excerpt */}
          {post.excerpt && (
            <div className="text-lg md:text-xl text-muted-foreground leading-relaxed mb-6 md:mb-8 p-4 md:p-6 bg-muted/30 rounded-xl border-l-4 border-primary">
              {post.excerpt}
            </div>
          )}

          {/* Content */}
          {post.content && (
            <div className="prose prose-lg max-w-none text-foreground prose-headings:text-foreground prose-p:text-foreground prose-p:leading-relaxed prose-p:text-base md:prose-p:text-lg prose-a:text-primary prose-strong:text-foreground">
              {/* Render content - đơn giản là text, có thể nâng cấp thành markdown sau */}
              <div className="whitespace-pre-wrap text-base md:text-lg leading-relaxed">
                {post.content}
              </div>
            </div>
          )}

          {/* Share Button - Floating trên mobile */}
          <div className="fixed bottom-6 right-4 md:relative md:bottom-auto md:right-auto md:mt-10">
            <Button
              onClick={handleShare}
              size="lg"
              variant="outline"
              className="rounded-full shadow-lg md:shadow-none h-14 w-14 md:h-auto md:w-auto md:px-6 md:py-3"
            >
              <Share2 className="w-6 h-6 md:mr-2" />
              <span className="hidden md:inline text-base">Chia sẻ bài viết</span>
            </Button>
          </div>
        </div>
      </article>
    </MainLayout>
  );
}

function PostDetailSkeleton() {
  return (
    <div className="container px-4 md:px-6 max-w-3xl mx-auto py-8 md:py-12">
      <Skeleton className="w-32 h-8 mb-6" />
      <Skeleton className="aspect-video rounded-2xl mb-8" />
      <Skeleton className="w-3/4 h-10 mb-4" />
      <div className="flex gap-4 mb-8">
        <Skeleton className="w-32 h-6" />
        <Skeleton className="w-24 h-6" />
      </div>
      <Skeleton className="w-full h-24 rounded-xl mb-8" />
      <div className="space-y-4">
        <Skeleton className="w-full h-6" />
        <Skeleton className="w-full h-6" />
        <Skeleton className="w-3/4 h-6" />
        <Skeleton className="w-full h-6" />
        <Skeleton className="w-5/6 h-6" />
      </div>
    </div>
  );
}
