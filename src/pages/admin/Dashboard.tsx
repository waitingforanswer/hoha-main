import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FileText, FolderTree } from "lucide-react";

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalMembers: 0,
    totalPosts: 0,
    totalGenerations: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await supabase.functions.invoke("admin/dashboard-stats");
        if (response.error) throw response.error;
        setStats(response.data);
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
      }
    };

    fetchStats();
  }, []);

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <h1 className="font-serif text-3xl font-bold">Dashboard</h1>
          <p className="mt-2 text-muted-foreground">
            Tổng quan về hệ thống quản lý gia phả
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="shadow-elegant">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Tổng thành viên
              </CardTitle>
              <Users className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalMembers}</div>
              <p className="text-xs text-muted-foreground">
                Trong cây gia phả
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-elegant">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Số đời
              </CardTitle>
              <FolderTree className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalGenerations}</div>
              <p className="text-xs text-muted-foreground">
                Thế hệ trong gia phả
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-elegant">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Bài viết
              </CardTitle>
              <FileText className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalPosts}</div>
              <p className="text-xs text-muted-foreground">
                Bài viết đã đăng
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-elegant">
          <CardHeader>
            <CardTitle className="font-serif">Hướng dẫn sử dụng</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-muted-foreground">
            <div>
              <h3 className="font-medium text-foreground">1. Quản lý thành viên</h3>
              <p>
                Thêm, sửa, xóa thông tin thành viên trong gia phả. Có thể tải lên
                ảnh đại diện và tạo mã QR cho mỗi thành viên.
              </p>
            </div>
            <div>
              <h3 className="font-medium text-foreground">2. Quản lý bài viết</h3>
              <p>
                Viết và quản lý các bài viết về lịch sử dòng họ, sự kiện gia
                đình.
              </p>
            </div>
            <div>
              <h3 className="font-medium text-foreground">3. Cài đặt</h3>
              <p>Quản lý thông tin tài khoản và cài đặt hệ thống.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
