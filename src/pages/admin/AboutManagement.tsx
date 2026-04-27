import { useState, useEffect, useRef } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Save, Upload, Image as ImageIcon, X, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";

interface AboutHero {
  id: string;
  title: string;
  subtitle: string;
  background_image: string | null;
}

interface AboutSection {
  id: string;
  section_key: string;
  title: string | null;
  content: string;
  is_visible: boolean;
}

interface AboutDonation {
  id: string;
  title: string;
  description: string;
  box_title: string;
  account_name: string;
  account_number: string;
  qr_code_url: string | null;
  note: string | null;
  is_visible: boolean;
}

const SUGGESTED_IMAGE_SIZE = "1920 x 600 pixels (tỉ lệ 16:5)";

const AboutManagement = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const [hero, setHero] = useState<AboutHero | null>(null);
  const [sections, setSections] = useState<AboutSection[]>([]);
  const [donation, setDonation] = useState<AboutDonation | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [heroRes, sectionsRes, donationRes] = await Promise.all([
        supabase.from("about_page_hero").select("*").limit(1).maybeSingle(),
        supabase.from("about_page_sections").select("*").order("display_order"),
        supabase.from("about_page_donation").select("*").limit(1).maybeSingle(),
      ]);

      if (heroRes.data) setHero(heroRes.data);
      if (sectionsRes.data) setSections(sectionsRes.data);
      if (donationRes.data) setDonation(donationRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Không thể tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  const handleHeroImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Vui lòng chọn file hình ảnh");
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `about-hero-${Date.now()}.${fileExt}`;
      const filePath = `about/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      setHero(prev => prev ? { ...prev, background_image: publicUrl } : null);
      toast.success("Tải ảnh lên thành công");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Không thể tải ảnh lên");
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setHero(prev => prev ? { ...prev, background_image: null } : null);
  };

  const handleSaveHero = async () => {
    if (!hero) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from("about_page_hero")
        .update({
          title: hero.title,
          subtitle: hero.subtitle,
          background_image: hero.background_image,
          updated_at: new Date().toISOString(),
        })
        .eq("id", hero.id);

      if (error) throw error;
      toast.success("Đã lưu thay đổi Hero");
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Không thể lưu thay đổi");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSection = async (section: AboutSection) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("about_page_sections")
        .update({
          title: section.title,
          content: section.content,
          is_visible: section.is_visible,
          updated_at: new Date().toISOString(),
        })
        .eq("id", section.id);

      if (error) throw error;
      toast.success("Đã lưu thay đổi");
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Không thể lưu thay đổi");
    } finally {
      setSaving(false);
    }
  };

  const updateSection = (id: string, updates: Partial<AboutSection>) => {
    setSections(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const handleSaveDonation = async () => {
    if (!donation) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from("about_page_donation")
        .update({
          title: donation.title,
          description: donation.description,
          box_title: donation.box_title,
          account_name: donation.account_name,
          account_number: donation.account_number,
          qr_code_url: donation.qr_code_url,
          note: donation.note,
          is_visible: donation.is_visible,
          updated_at: new Date().toISOString(),
        })
        .eq("id", donation.id);

      if (error) throw error;
      toast.success("Đã lưu thay đổi phần Đóng góp");
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Không thể lưu thay đổi");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </AdminLayout>
    );
  }

  const introSection = sections.find(s => s.section_key === "intro");
  const noteSection = sections.find(s => s.section_key === "note");

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link to="/admin/settings/pages">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Quản lý trang Giới thiệu</h1>
            <p className="text-muted-foreground">Chỉnh sửa nội dung các phần trên trang Giới thiệu</p>
          </div>
        </div>

        <Tabs defaultValue="hero" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:grid-cols-none">
            <TabsTrigger value="hero">Hero Section</TabsTrigger>
            <TabsTrigger value="content">Nội dung</TabsTrigger>
            <TabsTrigger value="donation">Đóng góp</TabsTrigger>
          </TabsList>

          {/* Hero Section Tab */}
          <TabsContent value="hero">
            <Card>
              <CardHeader>
                <CardTitle>Hero Section</CardTitle>
                <CardDescription>
                  Phần banner đầu trang với tiêu đề và hình nền
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="hero-title">Tiêu đề</Label>
                  <Input
                    id="hero-title"
                    value={hero?.title || ""}
                    onChange={(e) => setHero(prev => prev ? { ...prev, title: e.target.value } : null)}
                    placeholder="Nhập tiêu đề Hero"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hero-subtitle">Phụ đề</Label>
                  <Textarea
                    id="hero-subtitle"
                    value={hero?.subtitle || ""}
                    onChange={(e) => setHero(prev => prev ? { ...prev, subtitle: e.target.value } : null)}
                    placeholder="Nhập phụ đề Hero"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Hình nền</Label>
                  <p className="text-sm text-muted-foreground">
                    Kích thước đề xuất: {SUGGESTED_IMAGE_SIZE}
                  </p>
                  
                  {hero?.background_image ? (
                    <div className="relative">
                      <img
                        src={hero.background_image}
                        alt="Hero background"
                        className="h-48 w-full rounded-lg border object-cover"
                      />
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute right-2 top-2"
                        onClick={handleRemoveImage}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex h-48 w-full items-center justify-center rounded-lg border-2 border-dashed bg-muted/50">
                      <div className="text-center">
                        <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground" />
                        <p className="mt-2 text-sm text-muted-foreground">Chưa có hình nền</p>
                      </div>
                    </div>
                  )}

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleHeroImageUpload}
                  />
                  
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="gap-2"
                  >
                    {uploading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                    {hero?.background_image ? "Thay đổi hình ảnh" : "Tải lên hình ảnh"}
                  </Button>
                </div>

                <Button onClick={handleSaveHero} disabled={saving} className="gap-2">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Lưu thay đổi
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Content Tab */}
          <TabsContent value="content" className="space-y-6">
            {/* Intro Section */}
            {introSection && (
              <Card>
                <CardHeader>
                  <CardTitle>Lý do tồn tại</CardTitle>
                  <CardDescription>
                    Phần giới thiệu về mục đích của trang web
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="intro-title">Tiêu đề</Label>
                    <Input
                      id="intro-title"
                      value={introSection.title || ""}
                      onChange={(e) => updateSection(introSection.id, { title: e.target.value })}
                      placeholder="Nhập tiêu đề"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="intro-content">Nội dung</Label>
                    <Textarea
                      id="intro-content"
                      value={introSection.content}
                      onChange={(e) => updateSection(introSection.id, { content: e.target.value })}
                      placeholder="Nhập nội dung"
                      rows={5}
                    />
                  </div>

                  <Button 
                    onClick={() => handleSaveSection(introSection)} 
                    disabled={saving} 
                    className="gap-2"
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Lưu thay đổi
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Note Section */}
            {noteSection && (
              <Card>
                <CardHeader>
                  <CardTitle>Lưu ý</CardTitle>
                  <CardDescription>
                    Phần lưu ý hiển thị dưới dạng thông báo
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="note-content">Nội dung lưu ý</Label>
                    <Textarea
                      id="note-content"
                      value={noteSection.content}
                      onChange={(e) => updateSection(noteSection.id, { content: e.target.value })}
                      placeholder="Nhập nội dung lưu ý"
                      rows={3}
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <Switch
                      id="note-visible"
                      checked={noteSection.is_visible}
                      onCheckedChange={(checked) => updateSection(noteSection.id, { is_visible: checked })}
                    />
                    <Label htmlFor="note-visible">Hiển thị phần này</Label>
                  </div>

                  <Button 
                    onClick={() => handleSaveSection(noteSection)} 
                    disabled={saving} 
                    className="gap-2"
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Lưu thay đổi
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Donation Tab */}
          <TabsContent value="donation">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Thông tin đóng góp</CardTitle>
                    <CardDescription>
                      Phần thông tin ủng hộ duy trì trang web
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      id="donation-visible"
                      checked={donation?.is_visible || false}
                      onCheckedChange={(checked) => setDonation(prev => prev ? { ...prev, is_visible: checked } : null)}
                    />
                    <Label htmlFor="donation-visible">Hiển thị</Label>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="donation-title">Tiêu đề section</Label>
                    <Input
                      id="donation-title"
                      value={donation?.title || ""}
                      onChange={(e) => setDonation(prev => prev ? { ...prev, title: e.target.value } : null)}
                      placeholder="Nhập tiêu đề"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="donation-box-title">Tiêu đề hộp</Label>
                    <Input
                      id="donation-box-title"
                      value={donation?.box_title || ""}
                      onChange={(e) => setDonation(prev => prev ? { ...prev, box_title: e.target.value } : null)}
                      placeholder="Nhập tiêu đề hộp"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="donation-description">Mô tả</Label>
                  <Textarea
                    id="donation-description"
                    value={donation?.description || ""}
                    onChange={(e) => setDonation(prev => prev ? { ...prev, description: e.target.value } : null)}
                    placeholder="Nhập mô tả"
                    rows={3}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="donation-account-name">Tên tài khoản</Label>
                    <Input
                      id="donation-account-name"
                      value={donation?.account_name || ""}
                      onChange={(e) => setDonation(prev => prev ? { ...prev, account_name: e.target.value } : null)}
                      placeholder="Nhập tên chủ tài khoản"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="donation-account-number">Số tài khoản</Label>
                    <Input
                      id="donation-account-number"
                      value={donation?.account_number || ""}
                      onChange={(e) => setDonation(prev => prev ? { ...prev, account_number: e.target.value } : null)}
                      placeholder="Nhập số tài khoản"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="donation-qr">URL mã QR (tùy chọn)</Label>
                  <Input
                    id="donation-qr"
                    value={donation?.qr_code_url || ""}
                    onChange={(e) => setDonation(prev => prev ? { ...prev, qr_code_url: e.target.value || null } : null)}
                    placeholder="Nhập URL hình ảnh mã QR"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="donation-note">Ghi chú (tùy chọn)</Label>
                  <Textarea
                    id="donation-note"
                    value={donation?.note || ""}
                    onChange={(e) => setDonation(prev => prev ? { ...prev, note: e.target.value || null } : null)}
                    placeholder="Nhập ghi chú"
                    rows={2}
                  />
                </div>

                <Button onClick={handleSaveDonation} disabled={saving} className="gap-2">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Lưu thay đổi
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AboutManagement;
