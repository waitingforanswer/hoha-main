import { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ChevronUp, ChevronDown, Plus, Pencil, Eye, EyeOff, Loader2 } from "lucide-react";

interface MenuItem {
  id: string;
  label: string;
  page_key: string;
  display_order: number;
  is_visible: boolean;
  permission_code: string | null;
  require_auth: boolean;
  created_at: string;
  updated_at: string;
}

const MenuManagement = () => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [formData, setFormData] = useState({
    label: "",
    page_key: "",
    permission_code: "",
    require_auth: false,
  });
  const { toast } = useToast();

  const fetchMenuItems = async () => {
    try {
      const { data, error } = await supabase
        .from("menu_items")
        .select("*")
        .order("display_order", { ascending: true });

      if (error) throw error;
      setMenuItems(data || []);
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách menu",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenuItems();
  }, []);

  const handleOpenDialog = (item?: MenuItem) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        label: item.label,
        page_key: item.page_key,
        permission_code: item.permission_code || "",
        require_auth: item.require_auth,
      });
    } else {
      setEditingItem(null);
      setFormData({
        label: "",
        page_key: "",
        permission_code: "",
        require_auth: false,
      });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.label || !formData.page_key) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập đầy đủ thông tin",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      if (editingItem) {
        const { error } = await supabase
          .from("menu_items")
          .update({
            label: formData.label,
            page_key: formData.page_key,
            permission_code: formData.permission_code || null,
            require_auth: formData.require_auth,
          })
          .eq("id", editingItem.id);

        if (error) throw error;
        toast({ title: "Thành công", description: "Đã cập nhật menu item" });
      } else {
        const maxOrder = Math.max(...menuItems.map((i) => i.display_order), 0);
        const { error } = await supabase.from("menu_items").insert({
          label: formData.label,
          page_key: formData.page_key,
          permission_code: formData.permission_code || null,
          require_auth: formData.require_auth,
          display_order: maxOrder + 1,
        });

        if (error) throw error;
        toast({ title: "Thành công", description: "Đã thêm menu item mới" });
      }

      setDialogOpen(false);
      fetchMenuItems();
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể lưu menu item",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleVisibility = async (item: MenuItem) => {
    try {
      const { error } = await supabase
        .from("menu_items")
        .update({ is_visible: !item.is_visible })
        .eq("id", item.id);

      if (error) throw error;
      fetchMenuItems();
      toast({
        title: "Thành công",
        description: `Đã ${!item.is_visible ? "hiện" : "ẩn"} menu item`,
      });
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật trạng thái",
        variant: "destructive",
      });
    }
  };

  const handleMoveOrder = async (item: MenuItem, direction: "up" | "down") => {
    const currentIndex = menuItems.findIndex((i) => i.id === item.id);
    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;

    if (targetIndex < 0 || targetIndex >= menuItems.length) return;

    const targetItem = menuItems[targetIndex];

    try {
      await supabase
        .from("menu_items")
        .update({ display_order: targetItem.display_order })
        .eq("id", item.id);

      await supabase
        .from("menu_items")
        .update({ display_order: item.display_order })
        .eq("id", targetItem.id);

      fetchMenuItems();
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: "Không thể thay đổi thứ tự",
        variant: "destructive",
      });
    }
  };

  const getPageRoute = (pageKey: string): string => {
    const routes: Record<string, string> = {
      home: "/",
      about: "/gioi-thieu",
      "ho-ha": "/ho-ha",
      "family-tree": "/cay-gia-pha",
      articles: "/bai-viet",
    };
    return routes[pageKey] || `/${pageKey}`;
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Menu điều hướng</h1>
            <p className="text-muted-foreground">
              Quản lý các mục menu hiển thị trên website
            </p>
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" />
            Thêm menu
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Danh sách Menu</CardTitle>
            <CardDescription>
              Sắp xếp và quản lý các mục menu trên thanh điều hướng
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">STT</TableHead>
                    <TableHead>Nhãn</TableHead>
                    <TableHead>Page Key</TableHead>
                    <TableHead>Đường dẫn</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Yêu cầu</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {menuItems.map((item, index) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        {item.display_order}
                      </TableCell>
                      <TableCell className="font-medium">{item.label}</TableCell>
                      <TableCell>
                        <code className="rounded bg-muted px-2 py-1 text-sm">
                          {item.page_key}
                        </code>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {getPageRoute(item.page_key)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={item.is_visible ? "default" : "secondary"}>
                          {item.is_visible ? "Hiển thị" : "Ẩn"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {item.require_auth && (
                            <Badge variant="outline">Đăng nhập</Badge>
                          )}
                          {item.permission_code && (
                            <Badge variant="outline">{item.permission_code}</Badge>
                          )}
                          {!item.require_auth && !item.permission_code && (
                            <span className="text-muted-foreground text-sm">Công khai</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleMoveOrder(item, "up")}
                            disabled={index === 0}
                          >
                            <ChevronUp className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleMoveOrder(item, "down")}
                            disabled={index === menuItems.length - 1}
                          >
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenDialog(item)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleToggleVisibility(item)}
                          >
                            {item.is_visible ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
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

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingItem ? "Chỉnh sửa Menu Item" : "Thêm Menu Item"}
              </DialogTitle>
              <DialogDescription>
                Nhập thông tin cho mục menu
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="label">Nhãn hiển thị *</Label>
                <Input
                  id="label"
                  value={formData.label}
                  onChange={(e) =>
                    setFormData({ ...formData, label: e.target.value })
                  }
                  placeholder="VD: Trang chủ"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="page_key">Page Key *</Label>
                <Input
                  id="page_key"
                  value={formData.page_key}
                  onChange={(e) =>
                    setFormData({ ...formData, page_key: e.target.value })
                  }
                  placeholder="VD: home, about, family-tree"
                />
                <p className="text-xs text-muted-foreground">
                  Định danh duy nhất cho trang (không có dấu và khoảng trắng)
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="permission_code">Mã quyền (tùy chọn)</Label>
                <Input
                  id="permission_code"
                  value={formData.permission_code}
                  onChange={(e) =>
                    setFormData({ ...formData, permission_code: e.target.value })
                  }
                  placeholder="VD: VIEW_FAMILY_TREE"
                />
                <p className="text-xs text-muted-foreground">
                  Để trống nếu không yêu cầu quyền đặc biệt
                </p>
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Yêu cầu đăng nhập</Label>
                  <p className="text-xs text-muted-foreground">
                    Người dùng phải đăng nhập để xem menu này
                  </p>
                </div>
                <Switch
                  checked={formData.require_auth}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, require_auth: checked })
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Hủy
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingItem ? "Cập nhật" : "Thêm mới"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default MenuManagement;
