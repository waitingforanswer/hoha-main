import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { 
  BookOpen, 
  Users, 
  UserCog, 
  Lock, 
  Shield, 
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  LogIn,
  LayoutDashboard,
  QrCode
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const Help = () => {
  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <BookOpen className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="font-serif text-2xl font-bold">Hướng dẫn sử dụng</h1>
            <p className="text-muted-foreground">Tài liệu dành cho Sub-Admin quản lý hệ thống</p>
          </div>
        </div>

        {/* Quick intro */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Giới thiệu vai trò Sub-Admin
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              <strong>Sub-Admin</strong> là người được phân quyền hỗ trợ quản trị viên chính trong việc 
              vận hành website. Tùy theo quyền được cấp, Sub-Admin có thể thực hiện các công việc sau:
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="flex items-start gap-2 rounded-lg border p-3">
                <UserCog className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium">MANAGE_USERS</p>
                  <p className="text-sm text-muted-foreground">Quản lý tài khoản người dùng</p>
                </div>
              </div>
              <div className="flex items-start gap-2 rounded-lg border p-3">
                <Users className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium">MANAGE_MEMBERS</p>
                  <p className="text-sm text-muted-foreground">Quản lý thành viên gia phả</p>
                </div>
              </div>
              <div className="flex items-start gap-2 rounded-lg border p-3">
                <BookOpen className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium">MANAGE_POSTS</p>
                  <p className="text-sm text-muted-foreground">Quản lý bài viết</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main content - Accordion */}
        <Accordion type="multiple" className="space-y-4" defaultValue={["login", "interface"]}>
          {/* Login guide */}
          <AccordionItem value="login" className="rounded-lg border bg-card px-6">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3">
                <LogIn className="h-5 w-5 text-primary" />
                <span className="font-semibold">Đăng nhập hệ thống</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pb-4">
              <div className="space-y-3">
                <h4 className="font-medium">Các bước thực hiện:</h4>
                <ol className="list-inside list-decimal space-y-2 text-muted-foreground">
                  <li>Truy cập vào địa chỉ: <code className="rounded bg-muted px-2 py-1 text-sm">/admin/login</code></li>
                  <li>Nhập <strong>Tên đăng nhập</strong> hoặc <strong>Số điện thoại</strong> đã được cấp</li>
                  <li>Nhập <strong>Mật khẩu</strong></li>
                  <li>Nhấn nút <strong>"Đăng nhập"</strong></li>
                </ol>
              </div>
              <Alert>
                <HelpCircle className="h-4 w-4" />
                <AlertDescription>
                  Nếu quên mật khẩu, vui lòng liên hệ Quản trị viên chính để được reset mật khẩu.
                </AlertDescription>
              </Alert>
            </AccordionContent>
          </AccordionItem>

          {/* Interface overview */}
          <AccordionItem value="interface" className="rounded-lg border bg-card px-6">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3">
                <LayoutDashboard className="h-5 w-5 text-primary" />
                <span className="font-semibold">Giao diện trang quản trị</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pb-4">
              <p className="text-muted-foreground">
                Sau khi đăng nhập thành công, bạn sẽ thấy giao diện quản trị với các thành phần:
              </p>
              <div className="space-y-3">
                <div className="rounded-lg border p-4">
                  <h4 className="font-medium mb-2">Menu bên trái</h4>
                  <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                    <li><strong>Dashboard</strong> - Tổng quan hệ thống</li>
                    <li><strong>Thành viên</strong> - Quản lý thông tin thành viên gia phả (nếu có quyền)</li>
                    <li><strong>Bài viết</strong> - Quản lý bài viết (nếu có quyền)</li>
                    <li><strong>Cài đặt → Người dùng</strong> - Quản lý tài khoản user (nếu có quyền)</li>
                    <li><strong>Hướng dẫn</strong> - Trang tài liệu này</li>
                  </ul>
                </div>
                <div className="rounded-lg border p-4">
                  <h4 className="font-medium mb-2">Thông tin tài khoản (góc dưới trái)</h4>
                  <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                    <li>Hiển thị tên của bạn và vai trò (Sub-Admin)</li>
                    <li>Nút <strong>Đăng xuất</strong> để thoát khỏi hệ thống</li>
                  </ul>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* User management */}
          <AccordionItem value="users" className="rounded-lg border bg-card px-6">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3">
                <UserCog className="h-5 w-5 text-primary" />
                <span className="font-semibold">Quản lý tài khoản người dùng</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-6 pb-4">
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  Yêu cầu quyền: <strong>MANAGE_USERS</strong>
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <h4 className="font-medium">Truy cập trang quản lý:</h4>
                <p className="text-muted-foreground">
                  Menu <strong>Cài đặt</strong> → <strong>Người dùng</strong>
                </p>
              </div>

              {/* Activate account */}
              <div className="space-y-3 rounded-lg border p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <h4 className="font-medium">Kích hoạt tài khoản (Phê duyệt)</h4>
                </div>
                <p className="text-sm text-muted-foreground">
                  Khi người dùng mới đăng ký, tài khoản ở trạng thái <strong>PENDING</strong>. 
                  Bạn cần phê duyệt để họ có thể sử dụng.
                </p>
                <ol className="list-inside list-decimal space-y-1 text-sm text-muted-foreground">
                  <li>Tìm tài khoản có trạng thái <span className="rounded bg-yellow-100 px-1.5 py-0.5 text-yellow-800">PENDING</span></li>
                  <li>Nhấn nút <strong>"Kích hoạt"</strong> (màu xanh) ở cột Thao tác</li>
                  <li>Xác nhận trong hộp thoại xuất hiện</li>
                  <li>Trạng thái sẽ chuyển thành <span className="rounded bg-green-100 px-1.5 py-0.5 text-green-800">ACTIVE</span></li>
                </ol>
              </div>

              {/* Deactivate account */}
              <div className="space-y-3 rounded-lg border p-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                  <h4 className="font-medium">Vô hiệu hóa tài khoản</h4>
                </div>
                <p className="text-sm text-muted-foreground">
                  Khi cần tạm khóa tài khoản vi phạm hoặc theo yêu cầu.
                </p>
                <ol className="list-inside list-decimal space-y-1 text-sm text-muted-foreground">
                  <li>Tìm tài khoản cần vô hiệu hóa</li>
                  <li>Nhấn nút <strong>"Vô hiệu hóa"</strong> (màu cam) ở cột Thao tác</li>
                  <li>Xác nhận trong hộp thoại</li>
                  <li>Trạng thái sẽ chuyển thành <span className="rounded bg-gray-100 px-1.5 py-0.5 text-gray-800">INACTIVE</span></li>
                </ol>
              </div>

              {/* Reset password */}
              <div className="space-y-3 rounded-lg border p-4">
                <div className="flex items-center gap-2">
                  <Lock className="h-5 w-5 text-blue-600" />
                  <h4 className="font-medium">Reset mật khẩu</h4>
                </div>
                <p className="text-sm text-muted-foreground">
                  Khi người dùng quên mật khẩu và yêu cầu hỗ trợ.
                </p>
                <ol className="list-inside list-decimal space-y-1 text-sm text-muted-foreground">
                  <li>Tìm tài khoản cần reset mật khẩu</li>
                  <li>Nhấn nút <strong>"Reset MK"</strong> ở cột Thao tác</li>
                  <li>Nhập mật khẩu mới (tối thiểu 6 ký tự)</li>
                  <li>Nhấn <strong>"Xác nhận"</strong></li>
                  <li>Thông báo cho người dùng mật khẩu mới</li>
                </ol>
                <Alert variant="destructive" className="mt-3">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Lưu ý bảo mật:</strong> Yêu cầu người dùng đổi mật khẩu ngay sau khi nhận được mật khẩu mới.
                  </AlertDescription>
                </Alert>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Member management */}
          <AccordionItem value="members" className="rounded-lg border bg-card px-6">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-primary" />
                <span className="font-semibold">Quản lý thành viên gia phả</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-6 pb-4">
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  Yêu cầu quyền: <strong>MANAGE_MEMBERS</strong>
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <h4 className="font-medium">Truy cập trang quản lý:</h4>
                <p className="text-muted-foreground">
                  Menu <strong>Thành viên</strong>
                </p>
              </div>

              {/* Add member */}
              <div className="space-y-3 rounded-lg border p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <h4 className="font-medium">Thêm thành viên mới</h4>
                </div>
                <ol className="list-inside list-decimal space-y-1 text-sm text-muted-foreground">
                  <li>Nhấn nút <strong>"Thêm thành viên"</strong> (góc trên phải)</li>
                  <li>Điền thông tin bắt buộc:
                    <ul className="list-inside list-disc ml-4 mt-1">
                      <li><strong>Họ và tên</strong> - Tên đầy đủ của thành viên</li>
                      <li><strong>Đời thứ</strong> - Thế hệ trong gia phả (1, 2, 3...)</li>
                    </ul>
                  </li>
                  <li>Điền thông tin tùy chọn: giới tính, ngày sinh, cha, mẹ, vợ/chồng, nghề nghiệp...</li>
                  <li>Tải ảnh đại diện nếu có</li>
                  <li>Nhấn <strong>"Lưu"</strong></li>
                </ol>
              </div>

              {/* Edit member */}
              <div className="space-y-3 rounded-lg border p-4">
                <div className="flex items-center gap-2">
                  <HelpCircle className="h-5 w-5 text-blue-600" />
                  <h4 className="font-medium">Sửa thông tin thành viên</h4>
                </div>
                <ol className="list-inside list-decimal space-y-1 text-sm text-muted-foreground">
                  <li>Tìm thành viên trong danh sách</li>
                  <li>Nhấn vào biểu tượng <strong>bút chì</strong> (Edit) ở cột Thao tác</li>
                  <li>Chỉnh sửa thông tin cần thay đổi</li>
                  <li>Nhấn <strong>"Lưu"</strong></li>
                </ol>
              </div>

              {/* Delete member */}
              <div className="space-y-3 rounded-lg border p-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <h4 className="font-medium">Xóa thành viên</h4>
                </div>
                <ol className="list-inside list-decimal space-y-1 text-sm text-muted-foreground">
                  <li>Tìm thành viên cần xóa</li>
                  <li>Nhấn vào biểu tượng <strong>thùng rác</strong> (Delete) ở cột Thao tác</li>
                  <li>Xác nhận xóa trong hộp thoại</li>
                </ol>
                <Alert variant="destructive" className="mt-3">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Cảnh báo:</strong> Thao tác xóa không thể hoàn tác! Hãy cân nhắc kỹ trước khi xóa.
                  </AlertDescription>
                </Alert>
              </div>

              {/* QR Code */}
              <div className="space-y-3 rounded-lg border p-4">
                <div className="flex items-center gap-2">
                  <QrCode className="h-5 w-5 text-primary" />
                  <h4 className="font-medium">Tạo mã QR</h4>
                </div>
                <p className="text-sm text-muted-foreground">
                  Mã QR cho phép truy cập nhanh thông tin thành viên bằng điện thoại.
                </p>
                <ol className="list-inside list-decimal space-y-1 text-sm text-muted-foreground">
                  <li>Tìm thành viên cần tạo QR</li>
                  <li>Nhấn vào biểu tượng <strong>QR Code</strong> ở cột Thao tác</li>
                  <li>Mã QR sẽ hiển thị, có thể tải về hoặc in</li>
                </ol>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Troubleshooting */}
          <AccordionItem value="troubleshooting" className="rounded-lg border bg-card px-6">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                <span className="font-semibold">Xử lý sự cố thường gặp</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-4">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="py-3 text-left font-medium">Sự cố</th>
                      <th className="py-3 text-left font-medium">Cách xử lý</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    <tr>
                      <td className="py-3 text-muted-foreground">Không đăng nhập được</td>
                      <td className="py-3">
                        Kiểm tra username/password. Liên hệ Admin nếu cần reset mật khẩu.
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 text-muted-foreground">Không thấy menu "Thành viên"</td>
                      <td className="py-3">
                        Bạn chưa được cấp quyền MANAGE_MEMBERS. Liên hệ Admin.
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 text-muted-foreground">Không thấy menu "Người dùng"</td>
                      <td className="py-3">
                        Bạn chưa được cấp quyền MANAGE_USERS. Liên hệ Admin.
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 text-muted-foreground">Lỗi khi thêm/sửa thành viên</td>
                      <td className="py-3">
                        Kiểm tra các trường bắt buộc. Thử tải lại trang và thực hiện lại.
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 text-muted-foreground">Ảnh không tải lên được</td>
                      <td className="py-3">
                        Kiểm tra dung lượng file (tối đa 5MB) và định dạng (JPG, PNG).
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 text-muted-foreground">Trang tải chậm</td>
                      <td className="py-3">
                        Kiểm tra kết nối internet. Thử làm mới trang (F5 hoặc Ctrl+R).
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* Contact support */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <HelpCircle className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-medium">Cần hỗ trợ thêm?</h3>
                <p className="text-sm text-muted-foreground">
                  Liên hệ Quản trị viên chính qua email hoặc số điện thoại đã được cung cấp.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default Help;
