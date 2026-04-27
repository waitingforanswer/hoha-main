import { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Save, Loader2, Info, Plus, Trash2 } from "lucide-react";

interface FooterContent {
  familyName?: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  quote?: string;
  text?: string;
  tagline?: string;
  links?: QuickLink[];
}

interface FooterSection {
  id: string;
  section_key: string;
  title: string | null;
  content: FooterContent;
  is_visible: boolean;
  display_order: number;
}

interface QuickLink {
  label: string;
  href: string;
}

const FooterManagement = () => {
  const [sections, setSections] = useState<FooterSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("about");
  const { toast } = useToast();

  // Form states for each section
  const [aboutForm, setAboutForm] = useState({ familyName: "", description: "" });
  const [contactForm, setContactForm] = useState({ address: "", phone: "", email: "" });
  const [messageForm, setMessageForm] = useState({ quote: "" });
  const [copyrightForm, setCopyrightForm] = useState({ text: "", tagline: "" });
  const [quickLinks, setQuickLinks] = useState<QuickLink[]>([]);

  const fetchSections = async () => {
    try {
      const { data, error } = await supabase
        .from("footer_settings")
        .select("*")
        .order("display_order", { ascending: true });

      if (error) throw error;
      
      const typedSections = (data || []).map((section) => ({
        ...section,
        content: section.content as FooterContent,
      }));
      setSections(typedSections);

      // Populate form states
      typedSections.forEach((section) => {
        const content = section.content || {};
        switch (section.section_key) {
          case "about":
            setAboutForm({
              familyName: content.familyName || "",
              description: content.description || "",
            });
            break;
          case "contact":
            setContactForm({
              address: content.address || "",
              phone: content.phone || "",
              email: content.email || "",
            });
            break;
          case "message":
            setMessageForm({ quote: content.quote || "" });
            break;
          case "copyright":
            setCopyrightForm({
              text: content.text || "",
              tagline: content.tagline || "",
            });
            break;
          case "quick_links":
            setQuickLinks(content.links || []);
            break;
        }
      });
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: "Không thể tải cài đặt footer",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSections();
  }, []);

  const handleSaveSection = async (sectionKey: string, content: any) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("footer_settings")
        .update({ content })
        .eq("section_key", sectionKey);

      if (error) throw error;
      toast({ title: "Thành công", description: "Đã lưu thay đổi" });
      fetchSections();
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể lưu thay đổi",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAddQuickLink = () => {
    if (quickLinks.length >= 5) {
      toast({
        title: "Giới hạn",
        description: "Tối đa 5 liên kết nhanh",
        variant: "destructive",
      });
      return;
    }
    setQuickLinks([...quickLinks, { label: "", href: "" }]);
  };

  const handleRemoveQuickLink = (index: number) => {
    setQuickLinks(quickLinks.filter((_, i) => i !== index));
  };

  const handleQuickLinkChange = (index: number, field: keyof QuickLink, value: string) => {
    const updated = [...quickLinks];
    updated[index][field] = value;
    setQuickLinks(updated);
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Quản lý Footer</h1>
          <p className="text-muted-foreground">
            Cấu hình nội dung hiển thị ở phần chân trang website
          </p>
        </div>

        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Footer có 4 cột với giới hạn nội dung để đảm bảo giao diện cân đối.
            Vui lòng tuân thủ các giới hạn ký tự được ghi chú.
          </AlertDescription>
        </Alert>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="about">Giới thiệu</TabsTrigger>
            <TabsTrigger value="quick_links">Liên kết</TabsTrigger>
            <TabsTrigger value="contact">Liên hệ</TabsTrigger>
            <TabsTrigger value="message">Thông điệp</TabsTrigger>
            <TabsTrigger value="copyright">Bản quyền</TabsTrigger>
          </TabsList>

          {/* About Section */}
          <TabsContent value="about">
            <Card>
              <CardHeader>
                <CardTitle>Cột Giới thiệu</CardTitle>
                <CardDescription>
                  Thông tin giới thiệu ngắn về dòng họ
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="familyName">Tên dòng họ</Label>
                  <Input
                    id="familyName"
                    value={aboutForm.familyName}
                    onChange={(e) =>
                      setAboutForm({ ...aboutForm, familyName: e.target.value })
                    }
                    placeholder="VD: Dòng Họ Hà"
                    maxLength={30}
                  />
                  <p className="text-xs text-muted-foreground">
                    Tối đa 30 ký tự ({aboutForm.familyName.length}/30)
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Mô tả</Label>
                  <Textarea
                    id="description"
                    value={aboutForm.description}
                    onChange={(e) =>
                      setAboutForm({ ...aboutForm, description: e.target.value })
                    }
                    placeholder="Mô tả ngắn về website..."
                    maxLength={200}
                    rows={4}
                  />
                  <p className="text-xs text-muted-foreground">
                    Tối đa 200 ký tự ({aboutForm.description.length}/200)
                  </p>
                </div>
                <Button
                  onClick={() => handleSaveSection("about", aboutForm)}
                  disabled={saving}
                >
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Save className="mr-2 h-4 w-4" />
                  Lưu thay đổi
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Quick Links Section */}
          <TabsContent value="quick_links">
            <Card>
              <CardHeader>
                <CardTitle>Cột Liên kết nhanh</CardTitle>
                <CardDescription>
                  Các liên kết hiển thị trong footer (tối đa 5 liên kết)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {quickLinks.map((link, index) => (
                  <div key={index} className="flex items-end gap-2">
                    <div className="flex-1 space-y-2">
                      <Label>Nhãn</Label>
                      <Input
                        value={link.label}
                        onChange={(e) =>
                          handleQuickLinkChange(index, "label", e.target.value)
                        }
                        placeholder="VD: Giới thiệu"
                        maxLength={20}
                      />
                    </div>
                    <div className="flex-1 space-y-2">
                      <Label>Đường dẫn</Label>
                      <Input
                        value={link.href}
                        onChange={(e) =>
                          handleQuickLinkChange(index, "href", e.target.value)
                        }
                        placeholder="VD: /gioi-thieu"
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveQuickLink(index)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleAddQuickLink}>
                    <Plus className="mr-2 h-4 w-4" />
                    Thêm liên kết
                  </Button>
                  <Button
                    onClick={() =>
                      handleSaveSection("quick_links", { links: quickLinks })
                    }
                    disabled={saving}
                  >
                    {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <Save className="mr-2 h-4 w-4" />
                    Lưu thay đổi
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Contact Section */}
          <TabsContent value="contact">
            <Card>
              <CardHeader>
                <CardTitle>Cột Liên hệ</CardTitle>
                <CardDescription>
                  Thông tin liên hệ hiển thị trong footer
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="address">Địa chỉ</Label>
                  <Input
                    id="address"
                    value={contactForm.address}
                    onChange={(e) =>
                      setContactForm({ ...contactForm, address: e.target.value })
                    }
                    placeholder="VD: Việt Nam"
                    maxLength={100}
                  />
                  <p className="text-xs text-muted-foreground">
                    Tối đa 100 ký tự ({contactForm.address.length}/100)
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Số điện thoại</Label>
                  <Input
                    id="phone"
                    value={contactForm.phone}
                    onChange={(e) =>
                      setContactForm({ ...contactForm, phone: e.target.value })
                    }
                    placeholder="VD: +84 xxx xxx xxx"
                    maxLength={20}
                  />
                  <p className="text-xs text-muted-foreground">
                    Tối đa 20 ký tự ({contactForm.phone.length}/20)
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    value={contactForm.email}
                    onChange={(e) =>
                      setContactForm({ ...contactForm, email: e.target.value })
                    }
                    placeholder="VD: contact@example.com"
                    maxLength={50}
                  />
                  <p className="text-xs text-muted-foreground">
                    Tối đa 50 ký tự ({contactForm.email.length}/50)
                  </p>
                </div>
                <Button
                  onClick={() => handleSaveSection("contact", contactForm)}
                  disabled={saving}
                >
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Save className="mr-2 h-4 w-4" />
                  Lưu thay đổi
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Message Section */}
          <TabsContent value="message">
            <Card>
              <CardHeader>
                <CardTitle>Cột Thông điệp</CardTitle>
                <CardDescription>
                  Câu trích dẫn hoặc thông điệp ý nghĩa
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="quote">Trích dẫn</Label>
                  <Textarea
                    id="quote"
                    value={messageForm.quote}
                    onChange={(e) =>
                      setMessageForm({ quote: e.target.value })
                    }
                    placeholder="Nhập câu trích dẫn..."
                    maxLength={150}
                    rows={4}
                  />
                  <p className="text-xs text-muted-foreground">
                    Tối đa 150 ký tự ({messageForm.quote.length}/150)
                  </p>
                </div>
                <Button
                  onClick={() => handleSaveSection("message", messageForm)}
                  disabled={saving}
                >
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Save className="mr-2 h-4 w-4" />
                  Lưu thay đổi
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Copyright Section */}
          <TabsContent value="copyright">
            <Card>
              <CardHeader>
                <CardTitle>Phần Bản quyền</CardTitle>
                <CardDescription>
                  Thông tin bản quyền hiển thị ở cuối footer
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="copyrightText">Văn bản bản quyền</Label>
                  <Input
                    id="copyrightText"
                    value={copyrightForm.text}
                    onChange={(e) =>
                      setCopyrightForm({ ...copyrightForm, text: e.target.value })
                    }
                    placeholder="VD: Dòng Họ Hà. Bảo lưu mọi quyền."
                    maxLength={50}
                  />
                  <p className="text-xs text-muted-foreground">
                    Tối đa 50 ký tự ({copyrightForm.text.length}/50). Năm sẽ được tự động thêm.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tagline">Tagline</Label>
                  <Input
                    id="tagline"
                    value={copyrightForm.tagline}
                    onChange={(e) =>
                      setCopyrightForm({ ...copyrightForm, tagline: e.target.value })
                    }
                    placeholder="VD: Xây dựng với ❤️ cho gia đình"
                    maxLength={50}
                  />
                  <p className="text-xs text-muted-foreground">
                    Tối đa 50 ký tự ({copyrightForm.tagline.length}/50)
                  </p>
                </div>
                <Button
                  onClick={() => handleSaveSection("copyright", copyrightForm)}
                  disabled={saving}
                >
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Save className="mr-2 h-4 w-4" />
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

export default FooterManagement;
