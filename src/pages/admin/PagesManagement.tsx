import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Home, ChevronRight, Info } from "lucide-react";
import { Link } from "react-router-dom";

const PAGES = [
  {
    key: 'homepage',
    name: 'Trang chủ',
    description: 'Quản lý nội dung Hero, Features và Quotes trên trang chủ',
    icon: Home,
    href: '/admin/settings/pages/homepage'
  },
  {
    key: 'about',
    name: 'Giới thiệu',
    description: 'Quản lý nội dung trang giới thiệu (Hero, Mục đích, Đóng góp...)',
    icon: Info,
    href: '/admin/settings/pages/gioi-thieu'
  }
];

const PagesManagement = () => {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Quản lý Trang</h1>
          <p className="text-muted-foreground">
            Chọn trang để quản lý nội dung
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {PAGES.map((page) => {
            const IconComp = page.icon;
            return (
              <Link key={page.key} to={page.href}>
                <Card className="group h-full transition-all duration-300 hover:shadow-md hover:border-primary/50">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 transition-colors group-hover:bg-primary/20">
                        <IconComp className="h-6 w-6 text-primary" />
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardTitle className="mb-2">{page.name}</CardTitle>
                    <CardDescription>{page.description}</CardDescription>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </AdminLayout>
  );
};

export default PagesManagement;
