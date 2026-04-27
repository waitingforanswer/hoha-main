import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, Image, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";

interface Post {
  id: string;
  title: string;
  excerpt: string | null;
  content: string | null;
  featured_image: string | null;
  published_at: string | null;
  created_at: string;
  category_id: string | null;
}

interface GroupedPosts {
  year: number;
  posts: Post[];
}

export default function Posts() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [groupedPosts, setGroupedPosts] = useState<GroupedPosts[]>([]);

  useEffect(() => {
    fetchPosts();
  }, []);

  useEffect(() => {
    if (posts.length > 0) {
      const grouped = groupPostsByYear(posts);
      setGroupedPosts(grouped);
    }
  }, [posts]);

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .eq("is_published", true)
        .order("published_at", { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setLoading(false);
    }
  };

  const groupPostsByYear = (posts: Post[]): GroupedPosts[] => {
    const grouped: Record<number, Post[]> = {};
    
    posts.forEach((post) => {
      const date = post.published_at || post.created_at;
      const year = new Date(date).getFullYear();
      if (!grouped[year]) {
        grouped[year] = [];
      }
      grouped[year].push(post);
    });

    return Object.entries(grouped)
      .map(([year, posts]) => ({
        year: parseInt(year),
        posts,
      }))
      .sort((a, b) => b.year - a.year);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "";
    return format(new Date(dateString), "dd MMMM", { locale: vi });
  };

  return (
    <MainLayout>
      {/* Hero Section - Tối ưu mobile */}
      <section className="bg-gradient-to-br from-primary/95 to-wood/90 text-primary-foreground py-10 md:py-16">
        <div className="container px-4 md:px-6 text-center">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-3 md:mb-4">
            Bài Viết
          </h1>
          <p className="text-lg md:text-xl opacity-90 max-w-2xl mx-auto leading-relaxed">
            Câu chuyện, kỷ niệm và truyền thống của gia đình qua từng năm tháng
          </p>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="py-8 md:py-16 bg-background">
        <div className="container px-4 md:px-6 max-w-4xl mx-auto">
          {loading ? (
            <TimelineSkeleton />
          ) : posts.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="relative">
              {/* Timeline Line - Ẩn trên mobile nhỏ, hiện từ sm trở lên */}
              <div className="hidden sm:block absolute left-1/2 transform -translate-x-1/2 w-1 bg-gradient-to-b from-primary/30 via-accent/50 to-primary/30 h-full rounded-full" />
              
              {/* Mobile Timeline Line - Bên trái */}
              <div className="sm:hidden absolute left-4 w-1 bg-gradient-to-b from-primary/30 via-accent/50 to-primary/30 h-full rounded-full" />

              {groupedPosts.map((group, groupIndex) => (
                <div key={group.year} className="mb-8 md:mb-12">
                  {/* Year Marker */}
                  <div className="relative flex justify-center mb-6 md:mb-8">
                    {/* Mobile year marker */}
                    <div className="sm:hidden absolute left-0 w-9 h-9 rounded-full bg-primary flex items-center justify-center shadow-lg z-10">
                      <span className="text-primary-foreground text-xs font-bold">
                        {group.year.toString().slice(-2)}
                      </span>
                    </div>
                    
                    {/* Desktop year marker */}
                    <div className="hidden sm:flex items-center justify-center">
                      <div className="bg-primary text-primary-foreground px-6 py-3 rounded-full shadow-lg z-10">
                        <span className="text-xl md:text-2xl font-bold">{group.year}</span>
                      </div>
                    </div>
                    
                    {/* Mobile year text */}
                    <div className="sm:hidden pl-14 w-full">
                      <span className="text-2xl font-bold text-primary">{group.year}</span>
                    </div>
                  </div>

                  {/* Posts in this year */}
                  {group.posts.map((post, index) => (
                    <TimelineCard
                      key={post.id}
                      post={post}
                      index={index}
                      formatDate={formatDate}
                    />
                  ))}
                </div>
              ))}

              {/* Timeline End Marker */}
              <div className="relative flex justify-center">
                <div className="sm:hidden absolute left-0 w-9 h-9 rounded-full bg-accent flex items-center justify-center shadow-lg">
                  <span className="text-accent-foreground text-lg">•</span>
                </div>
                <div className="hidden sm:flex w-16 h-16 rounded-full bg-accent items-center justify-center shadow-lg">
                  <span className="text-accent-foreground text-2xl">✦</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </MainLayout>
  );
}

interface TimelineCardProps {
  post: Post;
  index: number;
  formatDate: (date: string | null) => string;
}

function TimelineCard({ post, index, formatDate }: TimelineCardProps) {
  const isEven = index % 2 === 0;

  return (
    <div className="relative mb-6 md:mb-8">
      {/* Desktop Layout - Alternating left/right */}
      <div className={`hidden sm:flex items-center ${isEven ? 'flex-row' : 'flex-row-reverse'}`}>
        {/* Content Side */}
        <div className={`w-5/12 ${isEven ? 'pr-8 text-right' : 'pl-8 text-left'}`}>
          <Link to={`/bai-viet/${post.id}`} className="group block">
            <article className="bg-card rounded-2xl shadow-card hover:shadow-elegant transition-all duration-300 overflow-hidden border border-border/50 hover:border-primary/30">
              {post.featured_image && (
                <div className="aspect-video overflow-hidden">
                  <img
                    src={post.featured_image}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
              )}
              <div className="p-5 md:p-6">
                <div className={`flex items-center gap-2 text-muted-foreground mb-3 ${isEven ? 'justify-end' : 'justify-start'}`}>
                  <Calendar className="w-4 h-4" />
                  <time className="text-sm font-medium">
                    {formatDate(post.published_at || post.created_at)}
                  </time>
                </div>
                <h3 className="text-lg md:text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors line-clamp-2">
                  {post.title}
                </h3>
                {post.excerpt && (
                  <p className="text-muted-foreground text-base leading-relaxed line-clamp-3">
                    {post.excerpt}
                  </p>
                )}
                <div className={`flex items-center gap-1 mt-4 text-primary font-medium ${isEven ? 'justify-end' : 'justify-start'}`}>
                  <span>Đọc tiếp</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </article>
          </Link>
        </div>

        {/* Center Timeline Dot */}
        <div className="w-2/12 flex justify-center">
          <div className="w-4 h-4 rounded-full bg-accent border-4 border-background shadow-md z-10" />
        </div>

        {/* Empty Side */}
        <div className="w-5/12" />
      </div>

      {/* Mobile Layout - Single column */}
      <div className="sm:hidden pl-10">
        {/* Timeline Dot */}
        <div className="absolute left-2 w-5 h-5 rounded-full bg-accent border-4 border-background shadow-md z-10" />
        
        <Link to={`/bai-viet/${post.id}`} className="group block">
          <article className="bg-card rounded-xl shadow-card active:shadow-lg transition-all duration-200 overflow-hidden border border-border/50 active:border-primary/30">
            {post.featured_image && (
              <div className="aspect-[16/10] overflow-hidden">
                <img
                  src={post.featured_image}
                  alt={post.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Calendar className="w-4 h-4" />
                <time className="text-sm font-medium">
                  {formatDate(post.published_at || post.created_at)}
                </time>
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2 line-clamp-2 leading-snug">
                {post.title}
              </h3>
              {post.excerpt && (
                <p className="text-muted-foreground text-base leading-relaxed line-clamp-2">
                  {post.excerpt}
                </p>
              )}
              <div className="flex items-center gap-1 mt-3 text-primary font-medium">
                <span className="text-base">Đọc tiếp</span>
                <ChevronRight className="w-5 h-5" />
              </div>
            </div>
          </article>
        </Link>
      </div>
    </div>
  );
}

function TimelineSkeleton() {
  return (
    <div className="relative">
      <div className="hidden sm:block absolute left-1/2 transform -translate-x-1/2 w-1 bg-muted h-full rounded-full" />
      <div className="sm:hidden absolute left-4 w-1 bg-muted h-full rounded-full" />
      
      {[1, 2, 3].map((_, groupIndex) => (
        <div key={groupIndex} className="mb-12">
          <div className="relative flex justify-center mb-8">
            <Skeleton className="hidden sm:block w-24 h-12 rounded-full" />
            <div className="sm:hidden flex items-center gap-4 w-full pl-0">
              <Skeleton className="w-9 h-9 rounded-full" />
              <Skeleton className="w-16 h-8" />
            </div>
          </div>
          
          {[1, 2].map((_, index) => (
            <div key={index} className="relative mb-8">
              <div className="hidden sm:flex items-center">
                <div className="w-5/12 pr-8">
                  <Skeleton className="w-full h-64 rounded-2xl" />
                </div>
                <div className="w-2/12 flex justify-center">
                  <Skeleton className="w-4 h-4 rounded-full" />
                </div>
                <div className="w-5/12" />
              </div>
              
              <div className="sm:hidden pl-10">
                <Skeleton className="absolute left-2 w-5 h-5 rounded-full" />
                <Skeleton className="w-full h-48 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-16 md:py-24">
      <div className="w-20 h-20 md:w-24 md:h-24 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
        <Image className="w-10 h-10 md:w-12 md:h-12 text-muted-foreground" />
      </div>
      <h3 className="text-xl md:text-2xl font-bold text-foreground mb-3">
        Chưa có bài viết nào
      </h3>
      <p className="text-muted-foreground text-lg max-w-md mx-auto leading-relaxed">
        Các bài viết, câu chuyện về gia đình sẽ được cập nhật tại đây
      </p>
    </div>
  );
}
