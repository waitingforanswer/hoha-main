import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  FileText, 
  Users, 
  Heart, 
  Compass,
  MessageCircle,
  Upload,
  BookOpen,
  AlertCircle,
  Send,
  QrCode
} from "lucide-react";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  FileText,
  Users,
  Heart,
  Compass,
  MessageCircle,
  Upload,
  BookOpen,
  AlertCircle,
};

interface AboutHero {
  title: string;
  subtitle: string;
  background_image: string | null;
}

interface AboutSection {
  section_key: string;
  title: string | null;
  content: string;
}

interface AboutListItem {
  id: string;
  section_type: string;
  icon: string;
  title: string;
  description: string;
}

interface AboutDonation {
  title: string;
  description: string;
  box_title: string;
  account_name: string;
  account_number: string;
  qr_code_url: string | null;
  note: string | null;
  is_visible: boolean;
}

const About = () => {
  const [hero, setHero] = useState<AboutHero | null>(null);
  const [sections, setSections] = useState<Record<string, AboutSection>>({});
  const [purposes, setPurposes] = useState<AboutListItem[]>([]);
  const [participation, setParticipation] = useState<AboutListItem[]>([]);
  const [donation, setDonation] = useState<AboutDonation | null>(null);
  const [loading, setLoading] = useState(true);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [heroRes, sectionsRes, listItemsRes, donationRes] = await Promise.all([
          supabase.from("about_page_hero").select("*").limit(1).maybeSingle(),
          supabase.from("about_page_sections").select("*").eq("is_visible", true).order("display_order"),
          supabase.from("about_page_list_items").select("*").eq("is_visible", true).order("display_order"),
          supabase.from("about_page_donation").select("*").limit(1).maybeSingle(),
        ]);

        if (heroRes.data) setHero(heroRes.data);
        
        if (sectionsRes.data) {
          const sectionsMap: Record<string, AboutSection> = {};
          sectionsRes.data.forEach((section) => {
            sectionsMap[section.section_key] = section;
          });
          setSections(sectionsMap);
        }

        if (listItemsRes.data) {
          setPurposes(listItemsRes.data.filter((item) => item.section_type === "purpose"));
          setParticipation(listItemsRes.data.filter((item) => item.section_type === "participation"));
        }

        if (donationRes.data) setDonation(donationRes.data);
      } catch (error) {
        console.error("Error fetching about page data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getIcon = (iconName: string) => {
    return ICON_MAP[iconName] || FileText;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.message.trim()) {
      toast.error("Vui lòng điền họ tên và nội dung góp ý");
      return;
    }

    setSubmitting(true);
    
    try {
      const { error } = await supabase.from("feedbacks").insert({
        name: formData.name.trim(),
        phone: formData.phone.trim() || null,
        message: formData.message.trim(),
      });

      if (error) throw error;

      toast.success("Cảm ơn bạn đã gửi góp ý! Chúng tôi sẽ xem xét và phản hồi sớm nhất có thể.");
      setFormData({ name: "", phone: "", message: "" });
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast.error("Không thể gửi góp ý. Vui lòng thử lại sau.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      {/* Hero Section */}
      <section 
        className="relative flex min-h-[300px] items-center justify-center bg-cover bg-center py-16 md:min-h-[400px] md:py-24"
        style={{
          backgroundImage: hero?.background_image 
            ? `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(${hero.background_image})`
            : 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary)/0.8) 100%)'
        }}
      >
        <div className="container text-center text-primary-foreground">
          <h1 className="mb-4 font-serif text-3xl font-bold leading-tight md:text-4xl lg:text-5xl">
            {hero?.title || "Giữ gìn cội nguồn – Kết nối các thế hệ"}
          </h1>
          <p className="mx-auto max-w-2xl text-lg opacity-90">
            {hero?.subtitle || "Nơi lưu giữ thông tin gia phả, câu chuyện tổ tiên và ký ức chung của gia đình"}
          </p>
        </div>
      </section>

      {/* Main Content */}
      <div className="container py-12 md:py-16">
        {/* Introduction Section */}
        {sections.intro && (
          <section className="mx-auto max-w-4xl">
            <h2 className="mb-6 font-serif text-2xl font-bold text-primary md:text-3xl">
              {sections.intro.title}
            </h2>
            <p className="text-lg leading-relaxed text-muted-foreground">
              {sections.intro.content}
            </p>
          </section>
        )}

        {/* Purposes Section */}
        {purposes.length > 0 && (
          <section className="mx-auto mt-12 max-w-4xl md:mt-16">
            <h2 className="mb-8 font-serif text-2xl font-bold md:text-3xl">
              {sections.purposes_title?.title || "Mục đích của trang web"}
            </h2>
            <div className="space-y-6">
              {purposes.map((item) => {
                const IconComponent = getIcon(item.icon);
                return (
                  <div key={item.id} className="flex gap-4">
                    <div className="flex-shrink-0 rounded-lg bg-primary/10 p-3">
                      <IconComponent className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="mb-1 font-semibold">{item.title}</h3>
                      <p className="text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Note Section */}
        {sections.note && (
          <section className="mx-auto mt-8 max-w-4xl">
            <div className="rounded-lg border-l-4 border-amber-500 bg-amber-50 p-4 dark:bg-amber-950/30">
              <p className="text-amber-800 dark:text-amber-200">
                <span className="font-semibold">Lưu ý: </span>
                {sections.note.content.replace(/^Lưu ý:\s*/i, "")}
              </p>
            </div>
          </section>
        )}

        {/* Participation Section */}
        {participation.length > 0 && (
          <section className="mx-auto mt-12 max-w-4xl md:mt-16">
            <h2 className="mb-8 font-serif text-2xl font-bold text-primary md:text-3xl">
              {sections.participation_title?.title || "Thành viên gia đình có thể tham gia như thế nào?"}
            </h2>
            <div className="space-y-6">
              {participation.map((item) => {
                const IconComponent = getIcon(item.icon);
                return (
                  <div key={item.id} className="flex gap-4">
                    <div className="flex-shrink-0 rounded-lg bg-primary/10 p-3">
                      <IconComponent className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="mb-1 font-semibold">{item.title}</h3>
                      <p className="text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Feedback Form */}
        <section className="mx-auto mt-12 max-w-4xl md:mt-16">
          <div className="rounded-xl border bg-card p-6 shadow-sm md:p-8">
            <h3 className="mb-6 text-xl font-semibold">Gửi góp ý hoặc đề xuất</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Tên</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nhập họ tên của bạn"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="phone">Số điện thoại</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Nhập số điện thoại (không bắt buộc)"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="message">Góp ý / đề xuất</Label>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Nhập nội dung góp ý hoặc đề xuất của bạn"
                  className="mt-1 min-h-[120px]"
                />
              </div>
              <Button type="submit" className="w-full gap-2" disabled={submitting}>
                <Send className="h-4 w-4" />
                {submitting ? "Đang gửi..." : "Gửi"}
              </Button>
            </form>
          </div>
        </section>

        {/* Donation Section */}
        {donation?.is_visible && (
          <section className="mx-auto mt-12 max-w-4xl md:mt-16">
            <h2 className="mb-4 font-serif text-2xl font-bold text-primary md:text-3xl">
              {donation.title}
            </h2>
            <p className="mb-6 text-muted-foreground">
              {donation.description}
            </p>
            <div className="rounded-xl border bg-card p-6 shadow-sm md:p-8">
              <h3 className="mb-6 text-center font-medium">{donation.box_title}</h3>
              <div className="flex flex-col items-center gap-6 md:flex-row md:justify-center">
                <div className="space-y-2 text-center md:text-left">
                  <p className="text-sm text-muted-foreground">Họ tên:</p>
                  <p className="font-semibold">{donation.account_name}</p>
                  <p className="mt-4 text-sm text-muted-foreground">Số tài khoản:</p>
                  <p className="font-semibold">{donation.account_number}</p>
                </div>
                {donation.qr_code_url ? (
                  <div className="flex-shrink-0">
                    <img 
                      src={donation.qr_code_url} 
                      alt="QR Code" 
                      className="h-32 w-32 rounded-lg border"
                    />
                  </div>
                ) : (
                  <div className="flex h-32 w-32 items-center justify-center rounded-lg border bg-muted">
                    <QrCode className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
              </div>
              {donation.note && (
                <p className="mt-6 text-center text-sm italic text-muted-foreground">
                  {donation.note}
                </p>
              )}
            </div>
          </section>
        )}
      </div>
    </MainLayout>
  );
};

export default About;
