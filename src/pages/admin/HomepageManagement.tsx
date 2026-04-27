import { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { vi } from "date-fns/locale";
import { 
  Home, Plus, Pencil, Trash2, GripVertical, Quote, Sparkles, Save,
  TreeDeciduous, Users, BookOpen, Search, Heart, Star, 
  MapPin, Calendar, Phone, Mail, Globe, Settings, FileText,
  Image, MessageSquare, Bell, Shield, Award, Target, Zap, ArrowLeft,
  CalendarDays, Repeat
} from "lucide-react";
import { Link } from "react-router-dom";

const AVAILABLE_ICONS = [
  { value: 'TreeDeciduous', label: 'Cây', Icon: TreeDeciduous },
  { value: 'Users', label: 'Người dùng', Icon: Users },
  { value: 'BookOpen', label: 'Sách', Icon: BookOpen },
  { value: 'Search', label: 'Tìm kiếm', Icon: Search },
  { value: 'Heart', label: 'Trái tim', Icon: Heart },
  { value: 'Star', label: 'Ngôi sao', Icon: Star },
  { value: 'MapPin', label: 'Địa điểm', Icon: MapPin },
  { value: 'Calendar', label: 'Lịch', Icon: Calendar },
  { value: 'Phone', label: 'Điện thoại', Icon: Phone },
  { value: 'Mail', label: 'Email', Icon: Mail },
  { value: 'Globe', label: 'Toàn cầu', Icon: Globe },
  { value: 'Settings', label: 'Cài đặt', Icon: Settings },
  { value: 'FileText', label: 'Tài liệu', Icon: FileText },
  { value: 'Image', label: 'Hình ảnh', Icon: Image },
  { value: 'MessageSquare', label: 'Tin nhắn', Icon: MessageSquare },
  { value: 'Bell', label: 'Chuông', Icon: Bell },
  { value: 'Shield', label: 'Bảo vệ', Icon: Shield },
  { value: 'Award', label: 'Giải thưởng', Icon: Award },
  { value: 'Target', label: 'Mục tiêu', Icon: Target },
  { value: 'Zap', label: 'Sấm sét', Icon: Zap },
];

const getIconComponent = (iconName: string) => {
  const iconConfig = AVAILABLE_ICONS.find(i => i.value === iconName);
  return iconConfig?.Icon || TreeDeciduous;
};

interface HomepageHero {
  id: string;
  tagline: string;
  title_part1: string;
  title_part2: string;
  description: string;
  button1_text: string;
  button1_href: string;
  button2_text: string;
  button2_href: string;
}

interface HomepageFeature {
  id: string;
  icon: string;
  title: string;
  description: string;
  href: string;
  display_order: number;
  is_visible: boolean;
}

interface HomepageQuote {
  id: string;
  quote: string;
  author: string;
  is_visible: boolean;
}

interface FamilyEvent {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  is_recurring: boolean;
  is_visible: boolean;
  display_order: number;
}

const HomepageManagement = () => {
  const [hero, setHero] = useState<HomepageHero | null>(null);
  const [heroForm, setHeroForm] = useState({
    tagline: '',
    title_part1: '',
    title_part2: '',
    description: '',
    button1_text: '',
    button1_href: '',
    button2_text: '',
    button2_href: ''
  });
  const [features, setFeatures] = useState<HomepageFeature[]>([]);
  const [quotes, setQuotes] = useState<HomepageQuote[]>([]);
  const [events, setEvents] = useState<FamilyEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Feature dialog
  const [featureDialogOpen, setFeatureDialogOpen] = useState(false);
  const [editingFeature, setEditingFeature] = useState<HomepageFeature | null>(null);
  const [featureForm, setFeatureForm] = useState({
    icon: 'TreeDeciduous',
    title: '',
    description: '',
    href: '/',
    is_visible: true
  });
  
  // Quote dialog
  const [quoteDialogOpen, setQuoteDialogOpen] = useState(false);
  const [editingQuote, setEditingQuote] = useState<HomepageQuote | null>(null);
  const [quoteForm, setQuoteForm] = useState({
    quote: '',
    author: 'Tục ngữ Việt Nam',
    is_visible: true
  });

  // Event dialog
  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<FamilyEvent | null>(null);
  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    event_date: format(new Date(), 'yyyy-MM-dd'),
    is_recurring: true,
    is_visible: true
  });

  // Delete confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'feature' | 'quote' | 'event', id: string } | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [heroRes, featuresRes, quotesRes, eventsRes] = await Promise.all([
        supabase.from('homepage_hero').select('*').limit(1).single(),
        supabase.from('homepage_features').select('*').order('display_order'),
        supabase.from('homepage_quotes').select('*').order('created_at'),
        supabase.from('family_events').select('*').order('event_date')
      ]);

      if (heroRes.data) {
        setHero(heroRes.data);
        setHeroForm({
          tagline: heroRes.data.tagline,
          title_part1: heroRes.data.title_part1,
          title_part2: heroRes.data.title_part2,
          description: heroRes.data.description,
          button1_text: heroRes.data.button1_text,
          button1_href: heroRes.data.button1_href,
          button2_text: heroRes.data.button2_text,
          button2_href: heroRes.data.button2_href
        });
      }

      if (featuresRes.error) throw featuresRes.error;
      if (quotesRes.error) throw quotesRes.error;
      if (eventsRes.error) throw eventsRes.error;

      setFeatures(featuresRes.data || []);
      setQuotes(quotesRes.data || []);
      setEvents(eventsRes.data || []);
    } catch (error: any) {
      toast.error('Không thể tải dữ liệu: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Hero handlers
  const saveHero = async () => {
    if (!hero) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('homepage_hero')
        .update(heroForm)
        .eq('id', hero.id);

      if (error) throw error;
      toast.success('Đã lưu nội dung Hero');
      fetchData();
    } catch (error: any) {
      toast.error('Lỗi: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  // Feature handlers
  const openFeatureDialog = (feature?: HomepageFeature) => {
    if (feature) {
      setEditingFeature(feature);
      setFeatureForm({
        icon: feature.icon,
        title: feature.title,
        description: feature.description,
        href: feature.href,
        is_visible: feature.is_visible
      });
    } else {
      setEditingFeature(null);
      setFeatureForm({
        icon: 'TreeDeciduous',
        title: '',
        description: '',
        href: '/',
        is_visible: true
      });
    }
    setFeatureDialogOpen(true);
  };

  const saveFeature = async () => {
    if (!featureForm.title.trim() || !featureForm.description.trim()) {
      toast.error('Vui lòng điền đầy đủ thông tin');
      return;
    }

    setSaving(true);
    try {
      if (editingFeature) {
        const { error } = await supabase
          .from('homepage_features')
          .update({
            icon: featureForm.icon,
            title: featureForm.title,
            description: featureForm.description,
            href: featureForm.href,
            is_visible: featureForm.is_visible
          })
          .eq('id', editingFeature.id);
        
        if (error) throw error;
        toast.success('Đã cập nhật section');
      } else {
        if (features.length >= 4) {
          toast.error('Chỉ được phép tối đa 4 sections');
          return;
        }
        
        const maxOrder = Math.max(...features.map(f => f.display_order), 0);
        const { error } = await supabase
          .from('homepage_features')
          .insert({
            icon: featureForm.icon,
            title: featureForm.title,
            description: featureForm.description,
            href: featureForm.href,
            is_visible: featureForm.is_visible,
            display_order: maxOrder + 1
          });
        
        if (error) throw error;
        toast.success('Đã thêm section mới');
      }
      
      setFeatureDialogOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error('Lỗi: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  // Quote handlers
  const openQuoteDialog = (quote?: HomepageQuote) => {
    if (quote) {
      setEditingQuote(quote);
      setQuoteForm({
        quote: quote.quote,
        author: quote.author,
        is_visible: quote.is_visible
      });
    } else {
      setEditingQuote(null);
      setQuoteForm({
        quote: '',
        author: 'Tục ngữ Việt Nam',
        is_visible: true
      });
    }
    setQuoteDialogOpen(true);
  };

  const saveQuote = async () => {
    if (!quoteForm.quote.trim()) {
      toast.error('Vui lòng nhập câu nói');
      return;
    }

    setSaving(true);
    try {
      if (editingQuote) {
        const { error } = await supabase
          .from('homepage_quotes')
          .update({
            quote: quoteForm.quote,
            author: quoteForm.author,
            is_visible: quoteForm.is_visible
          })
          .eq('id', editingQuote.id);
        
        if (error) throw error;
        toast.success('Đã cập nhật câu nói');
      } else {
        const { error } = await supabase
          .from('homepage_quotes')
          .insert({
            quote: quoteForm.quote,
            author: quoteForm.author,
            is_visible: quoteForm.is_visible
          });
        
        if (error) throw error;
        toast.success('Đã thêm câu nói mới');
      }
      
      setQuoteDialogOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error('Lỗi: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  // Event handlers
  const openEventDialog = (event?: FamilyEvent) => {
    if (event) {
      setEditingEvent(event);
      setEventForm({
        title: event.title,
        description: event.description || '',
        event_date: event.event_date,
        is_recurring: event.is_recurring,
        is_visible: event.is_visible
      });
    } else {
      setEditingEvent(null);
      setEventForm({
        title: '',
        description: '',
        event_date: format(new Date(), 'yyyy-MM-dd'),
        is_recurring: true,
        is_visible: true
      });
    }
    setEventDialogOpen(true);
  };

  const saveEvent = async () => {
    if (!eventForm.title.trim()) {
      toast.error('Vui lòng nhập tên sự kiện');
      return;
    }

    setSaving(true);
    try {
      if (editingEvent) {
        const { error } = await supabase
          .from('family_events')
          .update({
            title: eventForm.title,
            description: eventForm.description || null,
            event_date: eventForm.event_date,
            is_recurring: eventForm.is_recurring,
            is_visible: eventForm.is_visible
          })
          .eq('id', editingEvent.id);
        
        if (error) throw error;
        toast.success('Đã cập nhật sự kiện');
      } else {
        const maxOrder = Math.max(...events.map(e => e.display_order), 0);
        const { error } = await supabase
          .from('family_events')
          .insert({
            title: eventForm.title,
            description: eventForm.description || null,
            event_date: eventForm.event_date,
            is_recurring: eventForm.is_recurring,
            is_visible: eventForm.is_visible,
            display_order: maxOrder + 1
          });
        
        if (error) throw error;
        toast.success('Đã thêm sự kiện mới');
      }
      
      setEventDialogOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error('Lỗi: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  // Delete handler
  const confirmDelete = (type: 'feature' | 'quote' | 'event', id: string) => {
    setDeleteTarget({ type, id });
    setDeleteDialogOpen(true);
  };

  const executeDelete = async () => {
    if (!deleteTarget) return;

    setSaving(true);
    try {
      let error;
      if (deleteTarget.type === 'feature') {
        const result = await supabase.from('homepage_features').delete().eq('id', deleteTarget.id);
        error = result.error;
      } else if (deleteTarget.type === 'quote') {
        const result = await supabase.from('homepage_quotes').delete().eq('id', deleteTarget.id);
        error = result.error;
      } else if (deleteTarget.type === 'event') {
        const result = await supabase.from('family_events').delete().eq('id', deleteTarget.id);
        error = result.error;
      }
      
      if (error) throw error;
      toast.success('Đã xóa thành công');
      setDeleteDialogOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error('Lỗi: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link to="/admin/settings/pages">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Quản lý Trang chủ</h1>
            <p className="text-muted-foreground">
              Quản lý nội dung hiển thị trên trang chủ website
            </p>
          </div>
        </div>

        <Tabs defaultValue="hero" className="space-y-4">
          <TabsList className="flex-wrap">
            <TabsTrigger value="hero" className="gap-2">
              <Sparkles className="h-4 w-4" />
              Hero Section
            </TabsTrigger>
            <TabsTrigger value="features" className="gap-2">
              <Home className="h-4 w-4" />
              Khám phá nguồn cội
            </TabsTrigger>
            <TabsTrigger value="events" className="gap-2">
              <CalendarDays className="h-4 w-4" />
              Ngày quan trọng
            </TabsTrigger>
            <TabsTrigger value="quotes" className="gap-2">
              <Quote className="h-4 w-4" />
              Câu nói tục ngữ
            </TabsTrigger>
          </TabsList>

          {/* Hero Tab */}
          <TabsContent value="hero">
            <Card>
              <CardHeader>
                <CardTitle>Nội dung Hero Section</CardTitle>
                <CardDescription>
                  Quản lý nội dung hiển thị ở phần đầu trang chủ
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {loading ? (
                  <div className="py-8 text-center text-muted-foreground">Đang tải...</div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="tagline">Tagline (dòng chữ nhỏ phía trên)</Label>
                      <Input
                        id="tagline"
                        value={heroForm.tagline}
                        onChange={(e) => setHeroForm({ ...heroForm, tagline: e.target.value })}
                        placeholder="Gìn giữ truyền thống - Kết nối thế hệ"
                      />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="title_part1">Tiêu đề phần 1 (màu trắng)</Label>
                        <Input
                          id="title_part1"
                          value={heroForm.title_part1}
                          onChange={(e) => setHeroForm({ ...heroForm, title_part1: e.target.value })}
                          placeholder="Gia Phả"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="title_part2">Tiêu đề phần 2 (màu vàng)</Label>
                        <Input
                          id="title_part2"
                          value={heroForm.title_part2}
                          onChange={(e) => setHeroForm({ ...heroForm, title_part2: e.target.value })}
                          placeholder="Dòng Họ Hà"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Mô tả</Label>
                      <Textarea
                        id="description"
                        value={heroForm.description}
                        onChange={(e) => setHeroForm({ ...heroForm, description: e.target.value })}
                        placeholder="Nơi lưu giữ và kết nối các thế hệ trong gia đình..."
                        rows={3}
                      />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-4 rounded-lg border p-4">
                        <h4 className="font-medium">Nút chính (màu vàng)</h4>
                        <div className="space-y-2">
                          <Label htmlFor="button1_text">Text</Label>
                          <Input
                            id="button1_text"
                            value={heroForm.button1_text}
                            onChange={(e) => setHeroForm({ ...heroForm, button1_text: e.target.value })}
                            placeholder="Xem Cây Gia Phả"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="button1_href">Link</Label>
                          <Input
                            id="button1_href"
                            value={heroForm.button1_href}
                            onChange={(e) => setHeroForm({ ...heroForm, button1_href: e.target.value })}
                            placeholder="/cay-gia-pha"
                          />
                        </div>
                      </div>

                      <div className="space-y-4 rounded-lg border p-4">
                        <h4 className="font-medium">Nút phụ (viền trắng)</h4>
                        <div className="space-y-2">
                          <Label htmlFor="button2_text">Text</Label>
                          <Input
                            id="button2_text"
                            value={heroForm.button2_text}
                            onChange={(e) => setHeroForm({ ...heroForm, button2_text: e.target.value })}
                            placeholder="Tìm Hiểu Thêm"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="button2_href">Link</Label>
                          <Input
                            id="button2_href"
                            value={heroForm.button2_href}
                            onChange={(e) => setHeroForm({ ...heroForm, button2_href: e.target.value })}
                            placeholder="/gioi-thieu"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button onClick={saveHero} disabled={saving}>
                        <Save className="mr-2 h-4 w-4" />
                        {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Features Tab */}
          <TabsContent value="features">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Các section "Khám phá nguồn cội"</CardTitle>
                    <CardDescription>
                      Tối đa 4 sections. Mỗi section gồm icon, tiêu đề, mô tả và link.
                    </CardDescription>
                  </div>
                  <Button 
                    onClick={() => openFeatureDialog()} 
                    disabled={features.length >= 4}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Thêm section
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="py-8 text-center text-muted-foreground">Đang tải...</div>
                ) : features.length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground">
                    Chưa có section nào. Nhấn "Thêm section" để bắt đầu.
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12"></TableHead>
                        <TableHead>Icon</TableHead>
                        <TableHead>Tiêu đề</TableHead>
                        <TableHead>Mô tả</TableHead>
                        <TableHead>Link</TableHead>
                        <TableHead>Hiển thị</TableHead>
                        <TableHead className="w-24">Thao tác</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {features.map((feature) => {
                        const IconComp = getIconComponent(feature.icon);
                        return (
                          <TableRow key={feature.id}>
                            <TableCell>
                              <GripVertical className="h-4 w-4 text-muted-foreground" />
                            </TableCell>
                            <TableCell>
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                                <IconComp className="h-5 w-5 text-primary" />
                              </div>
                            </TableCell>
                            <TableCell className="font-medium">{feature.title}</TableCell>
                            <TableCell className="max-w-[200px] truncate text-muted-foreground">
                              {feature.description}
                            </TableCell>
                            <TableCell className="text-muted-foreground">{feature.href}</TableCell>
                            <TableCell>
                              <Switch 
                                checked={feature.is_visible} 
                                onCheckedChange={async (checked) => {
                                  await supabase
                                    .from('homepage_features')
                                    .update({ is_visible: checked })
                                    .eq('id', feature.id);
                                  fetchData();
                                }}
                              />
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => openFeatureDialog(feature)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => confirmDelete('feature', feature.id)}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Events Tab */}
          <TabsContent value="events">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Các ngày quan trọng</CardTitle>
                    <CardDescription>
                      Ngày giỗ, lễ hội, họp mặt dòng họ hiển thị trên timeline trang chủ.
                    </CardDescription>
                  </div>
                  <Button onClick={() => openEventDialog()}>
                    <Plus className="mr-2 h-4 w-4" />
                    Thêm sự kiện
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="py-8 text-center text-muted-foreground">Đang tải...</div>
                ) : events.length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground">
                    Chưa có sự kiện nào. Nhấn "Thêm sự kiện" để bắt đầu.
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Ngày</TableHead>
                        <TableHead>Tên sự kiện</TableHead>
                        <TableHead>Mô tả</TableHead>
                        <TableHead>Lặp lại</TableHead>
                        <TableHead>Hiển thị</TableHead>
                        <TableHead className="w-24">Thao tác</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {events.map((event) => (
                        <TableRow key={event.id}>
                          <TableCell className="whitespace-nowrap">
                            {format(parseISO(event.event_date), 'dd/MM/yyyy', { locale: vi })}
                          </TableCell>
                          <TableCell className="font-medium">{event.title}</TableCell>
                          <TableCell className="max-w-[200px] truncate text-muted-foreground">
                            {event.description || '—'}
                          </TableCell>
                          <TableCell>
                            {event.is_recurring ? (
                              <div className="flex items-center gap-1 text-primary">
                                <Repeat className="h-4 w-4" />
                                <span className="text-sm">Hàng năm</span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">Một lần</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Switch 
                              checked={event.is_visible} 
                              onCheckedChange={async (checked) => {
                                await supabase
                                  .from('family_events')
                                  .update({ is_visible: checked })
                                  .eq('id', event.id);
                                fetchData();
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => openEventDialog(event)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => confirmDelete('event', event.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Quotes Tab */}
          <TabsContent value="quotes">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Câu nói tục ngữ</CardTitle>
                    <CardDescription>
                      Các câu nói sẽ được hiển thị ngẫu nhiên trên trang chủ, thay đổi mỗi 5 giây.
                    </CardDescription>
                  </div>
                  <Button onClick={() => openQuoteDialog()}>
                    <Plus className="mr-2 h-4 w-4" />
                    Thêm câu nói
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="py-8 text-center text-muted-foreground">Đang tải...</div>
                ) : quotes.length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground">
                    Chưa có câu nói nào. Nhấn "Thêm câu nói" để bắt đầu.
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Câu nói</TableHead>
                        <TableHead>Tác giả</TableHead>
                        <TableHead>Hiển thị</TableHead>
                        <TableHead className="w-24">Thao tác</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {quotes.map((quote) => (
                        <TableRow key={quote.id}>
                          <TableCell className="max-w-[400px]">
                            <p className="line-clamp-2 italic">"{quote.quote}"</p>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            — {quote.author} —
                          </TableCell>
                          <TableCell>
                            <Switch 
                              checked={quote.is_visible} 
                              onCheckedChange={async (checked) => {
                                await supabase
                                  .from('homepage_quotes')
                                  .update({ is_visible: checked })
                                  .eq('id', quote.id);
                                fetchData();
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => openQuoteDialog(quote)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => confirmDelete('quote', quote.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Feature Dialog */}
      <Dialog open={featureDialogOpen} onOpenChange={setFeatureDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingFeature ? 'Chỉnh sửa section' : 'Thêm section mới'}
            </DialogTitle>
            <DialogDescription>
              Điền thông tin cho section hiển thị trên trang chủ
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Icon</Label>
              <Select 
                value={featureForm.icon} 
                onValueChange={(value) => setFeatureForm({ ...featureForm, icon: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AVAILABLE_ICONS.map((icon) => {
                    const IconComp = icon.Icon;
                    return (
                      <SelectItem key={icon.value} value={icon.value}>
                        <div className="flex items-center gap-2">
                          <IconComp className="h-4 w-4" />
                          <span>{icon.label}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="feature-title">Tiêu đề</Label>
              <Input
                id="feature-title"
                value={featureForm.title}
                onChange={(e) => setFeatureForm({ ...featureForm, title: e.target.value })}
                placeholder="VD: Cây Gia Phả"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="feature-description">Mô tả</Label>
              <Textarea
                id="feature-description"
                value={featureForm.description}
                onChange={(e) => setFeatureForm({ ...featureForm, description: e.target.value })}
                placeholder="Mô tả ngắn gọn về section"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="feature-href">Link</Label>
              <Input
                id="feature-href"
                value={featureForm.href}
                onChange={(e) => setFeatureForm({ ...featureForm, href: e.target.value })}
                placeholder="/cay-gia-pha"
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="feature-visible"
                checked={featureForm.is_visible}
                onCheckedChange={(checked) => setFeatureForm({ ...featureForm, is_visible: checked })}
              />
              <Label htmlFor="feature-visible">Hiển thị trên trang chủ</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFeatureDialogOpen(false)}>
              Hủy
            </Button>
            <Button onClick={saveFeature} disabled={saving}>
              {saving ? 'Đang lưu...' : 'Lưu'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quote Dialog */}
      <Dialog open={quoteDialogOpen} onOpenChange={setQuoteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingQuote ? 'Chỉnh sửa câu nói' : 'Thêm câu nói mới'}
            </DialogTitle>
            <DialogDescription>
              Thêm câu nói tục ngữ hiển thị trên trang chủ
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="quote-text">Câu nói</Label>
              <Textarea
                id="quote-text"
                value={quoteForm.quote}
                onChange={(e) => setQuoteForm({ ...quoteForm, quote: e.target.value })}
                placeholder="Nhập câu nói tục ngữ..."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quote-author">Tác giả / Nguồn</Label>
              <Input
                id="quote-author"
                value={quoteForm.author}
                onChange={(e) => setQuoteForm({ ...quoteForm, author: e.target.value })}
                placeholder="Tục ngữ Việt Nam"
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="quote-visible"
                checked={quoteForm.is_visible}
                onCheckedChange={(checked) => setQuoteForm({ ...quoteForm, is_visible: checked })}
              />
              <Label htmlFor="quote-visible">Hiển thị trên trang chủ</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setQuoteDialogOpen(false)}>
              Hủy
            </Button>
            <Button onClick={saveQuote} disabled={saving}>
              {saving ? 'Đang lưu...' : 'Lưu'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Event Dialog */}
      <Dialog open={eventDialogOpen} onOpenChange={setEventDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingEvent ? 'Chỉnh sửa sự kiện' : 'Thêm sự kiện mới'}
            </DialogTitle>
            <DialogDescription>
              Thêm ngày giỗ, lễ hội hoặc sự kiện quan trọng của dòng họ
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="event-title">Tên sự kiện *</Label>
              <Input
                id="event-title"
                value={eventForm.title}
                onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                placeholder="VD: Giỗ Cụ Tổ, Họp mặt đầu năm..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="event-date">Ngày diễn ra *</Label>
              <Input
                id="event-date"
                type="date"
                value={eventForm.event_date}
                onChange={(e) => setEventForm({ ...eventForm, event_date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="event-description">Mô tả (tùy chọn)</Label>
              <Textarea
                id="event-description"
                value={eventForm.description}
                onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                placeholder="Mô tả ngắn gọn về sự kiện..."
                rows={2}
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="event-recurring"
                checked={eventForm.is_recurring}
                onCheckedChange={(checked) => setEventForm({ ...eventForm, is_recurring: checked })}
              />
              <Label htmlFor="event-recurring" className="flex items-center gap-2">
                <Repeat className="h-4 w-4" />
                Lặp lại hàng năm (ngày giỗ, lễ cố định)
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="event-visible"
                checked={eventForm.is_visible}
                onCheckedChange={(checked) => setEventForm({ ...eventForm, is_visible: checked })}
              />
              <Label htmlFor="event-visible">Hiển thị trên trang chủ</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEventDialogOpen(false)}>
              Hủy
            </Button>
            <Button onClick={saveEvent} disabled={saving}>
              {saving ? 'Đang lưu...' : 'Lưu'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận xóa</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa? Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Hủy
            </Button>
            <Button variant="destructive" onClick={executeDelete} disabled={saving}>
              {saving ? 'Đang xóa...' : 'Xóa'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default HomepageManagement;
