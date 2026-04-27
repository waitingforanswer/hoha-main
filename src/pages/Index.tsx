import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { MainLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import EventTimeline from "@/components/homepage/EventTimeline";
import { 
  TreeDeciduous, 
  Users, 
  BookOpen, 
  Search,
  ArrowRight,
  Heart,
  Star,
  MapPin,
  Calendar,
  Phone,
  Mail,
  Globe,
  Settings,
  FileText,
  Image,
  MessageSquare,
  Bell,
  Shield,
  Award,
  Target,
  Zap
} from "lucide-react";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  TreeDeciduous,
  Users,
  BookOpen,
  Search,
  Heart,
  Star,
  MapPin,
  Calendar,
  Phone,
  Mail,
  Globe,
  Settings,
  FileText,
  Image,
  MessageSquare,
  Bell,
  Shield,
  Award,
  Target,
  Zap,
};

interface HomepageFeature {
  id: string;
  icon: string;
  title: string;
  description: string;
  href: string;
}

interface HomepageQuote {
  id: string;
  quote: string;
  author: string;
}

interface HomepageHero {
  tagline: string;
  title_part1: string;
  title_part2: string;
  description: string;
  button1_text: string;
  button1_href: string;
  button2_text: string;
  button2_href: string;
}

interface FamilyEvent {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  is_recurring: boolean;
}

const Index = () => {
  const [hero, setHero] = useState<HomepageHero | null>(null);
  const [features, setFeatures] = useState<HomepageFeature[]>([]);
  const [quotes, setQuotes] = useState<HomepageQuote[]>([]);
  const [events, setEvents] = useState<FamilyEvent[]>([]);
  const [currentQuote, setCurrentQuote] = useState<HomepageQuote | null>(null);
  const [fadeIn, setFadeIn] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const [heroRes, featuresRes, quotesRes, eventsRes] = await Promise.all([
        supabase
          .from('homepage_hero')
          .select('tagline, title_part1, title_part2, description, button1_text, button1_href, button2_text, button2_href')
          .limit(1)
          .single(),
        supabase
          .from('homepage_features')
          .select('id, icon, title, description, href')
          .eq('is_visible', true)
          .order('display_order'),
        supabase
          .from('homepage_quotes')
          .select('id, quote, author')
          .eq('is_visible', true),
        supabase
          .from('family_events')
          .select('id, title, description, event_date, is_recurring')
          .eq('is_visible', true)
          .order('event_date')
      ]);

      if (heroRes.data) setHero(heroRes.data);
      if (featuresRes.data) setFeatures(featuresRes.data);
      if (eventsRes.data) setEvents(eventsRes.data);
      if (quotesRes.data) {
        setQuotes(quotesRes.data);
        if (quotesRes.data.length > 0) {
          setCurrentQuote(quotesRes.data[Math.floor(Math.random() * quotesRes.data.length)]);
        }
      }
    };

    fetchData();
  }, []);

  // Rotate quotes every 5 seconds
  useEffect(() => {
    if (quotes.length <= 1) return;

    const interval = setInterval(() => {
      setFadeIn(false);
      
      setTimeout(() => {
        setCurrentQuote(prev => {
          const availableQuotes = quotes.filter(q => q.id !== prev?.id);
          if (availableQuotes.length === 0) return prev;
          return availableQuotes[Math.floor(Math.random() * availableQuotes.length)];
        });
        setFadeIn(true);
      }, 300);
    }, 5000);

    return () => clearInterval(interval);
  }, [quotes]);

  const getIcon = (iconName: string) => {
    return ICON_MAP[iconName] || TreeDeciduous;
  };

  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-hero py-20 text-primary-foreground md:py-32">
        <div className="pattern-traditional absolute inset-0 opacity-10" />
        
        {/* Decorative Elements */}
        <div className="absolute left-0 top-0 h-32 w-32 opacity-20 md:h-48 md:w-48">
          <svg viewBox="0 0 100 100" className="h-full w-full fill-current">
            <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.5" />
            <circle cx="50" cy="50" r="35" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.3" />
          </svg>
        </div>
        
        <div className="container relative">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary-foreground/10 px-4 py-2 text-sm backdrop-blur">
              <Heart className="h-4 w-4" />
              <span>{hero?.tagline || 'Gìn giữ truyền thống - Kết nối thế hệ'}</span>
            </div>
            
            <h1 className="animate-fade-in mb-6 font-serif text-4xl font-bold leading-tight md:text-5xl lg:text-6xl">
              {hero?.title_part1 || 'Gia Phả'} <span className="text-gold">{hero?.title_part2 || 'Dòng Họ Hà'}</span>
            </h1>
            
            <p className="animate-fade-in animation-delay-150 mb-8 text-lg opacity-90 md:text-xl">
              {hero?.description || 'Nơi lưu giữ và kết nối các thế hệ trong gia đình, giúp con cháu nhớ về nguồn cội và truyền thống tốt đẹp của dòng họ.'}
            </p>
            
            <div className="animate-fade-in animation-delay-300 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link to={hero?.button1_href || '/cay-gia-pha'}>
                <Button size="lg" className="gap-2 bg-gold text-accent-foreground hover:bg-gold/90">
                  {hero?.button1_text || 'Xem Cây Gia Phả'}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to={hero?.button2_href || '/gioi-thieu'}>
                <Button size="lg" variant="outline" className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10">
                  {hero?.button2_text || 'Tìm Hiểu Thêm'}
                </Button>
              </Link>
            </div>
          </div>
        </div>
        
        {/* Bottom Wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 100" className="w-full fill-background">
            <path d="M0,50 C360,100 1080,0 1440,50 L1440,100 L0,100 Z" />
          </svg>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-24">
        <div className="container">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="mb-4 font-serif text-3xl font-bold md:text-4xl">
              Khám Phá <span className="text-primary">Nguồn Cội</span>
            </h2>
            <p className="text-muted-foreground">
              Tìm hiểu về lịch sử, truyền thống và các thành viên trong dòng họ
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => {
              const IconComponent = getIcon(feature.icon);
              return (
                <Link key={feature.id} to={feature.href}>
                  <Card className="group h-full transition-all duration-300 hover:shadow-elegant hover:-translate-y-1">
                    <CardContent className="flex flex-col items-center p-6 text-center">
                      <div className="mb-4 rounded-full bg-primary/10 p-4 transition-colors group-hover:bg-primary/20">
                        <IconComponent className="h-8 w-8 text-primary" />
                      </div>
                      <h3 className="mb-2 font-serif text-lg font-semibold">
                        {feature.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {feature.description}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Family Events Timeline */}
      {events.length > 0 && <EventTimeline events={events} />}

      {/* Quote Section */}
      {currentQuote && (
        <section className="bg-secondary py-16 md:py-24">
          <div className="container">
            <div className="mx-auto max-w-3xl text-center">
              <div className="mb-6 inline-block rounded-full bg-primary/10 p-4">
                <BookOpen className="h-8 w-8 text-primary" />
              </div>
              <blockquote 
                className={`mb-6 font-serif text-2xl font-medium italic text-foreground md:text-3xl transition-opacity duration-300 ${
                  fadeIn ? 'opacity-100' : 'opacity-0'
                }`}
              >
                "{currentQuote.quote}"
              </blockquote>
              <p 
                className={`text-muted-foreground transition-opacity duration-300 ${
                  fadeIn ? 'opacity-100' : 'opacity-0'
                }`}
              >
                — {currentQuote.author} —
              </p>
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-16 md:py-24">
        <div className="container">
          <div className="rounded-2xl bg-gradient-hero p-8 text-center text-primary-foreground md:p-12">
            <h2 className="mb-4 font-serif text-2xl font-bold md:text-3xl">
              Tìm Kiếm Thành Viên Trong Gia Phả
            </h2>
            <p className="mx-auto mb-8 max-w-2xl opacity-90">
              Nhập tên để tìm vị trí của một người trong cây gia phả và xem thông tin chi tiết
            </p>
            <Link to="/cay-gia-pha">
              <Button size="lg" className="gap-2 bg-gold text-accent-foreground hover:bg-gold/90">
                <Search className="h-4 w-4" />
                Bắt Đầu Tìm Kiếm
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </MainLayout>
  );
};

export default Index;
