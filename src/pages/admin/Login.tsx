import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Lock, Mail, UserPlus, LogIn, Info, Home, User, Phone } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Link } from "react-router-dom";
import { useAdminAuth } from "@/hooks/useAdminAuth";

const AdminLogin = () => {
  // Email login state
  const [email, setEmail] = useState("");
  const [emailPassword, setEmailPassword] = useState("");
  const [fullName, setFullName] = useState("");
  
  // Username/phone login state
  const [identifier, setIdentifier] = useState("");
  const [appPassword, setAppPassword] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [hasAdmin, setHasAdmin] = useState<boolean | null>(null);
  const [loginMethod, setLoginMethod] = useState<"username" | "email">("username");
  
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAuthenticated, canAccessAdmin, loginWithAppUser } = useAdminAuth();

  // Redirect if already authenticated with admin access
  useEffect(() => {
    if (isAuthenticated && canAccessAdmin) {
      navigate("/admin");
    }
  }, [isAuthenticated, canAccessAdmin, navigate]);

  useEffect(() => {
    checkExistingAdmin();
  }, []);

  const checkExistingAdmin = async () => {
    const { count } = await supabase
      .from("user_roles")
      .select("*", { count: "exact", head: true })
      .eq("role", "admin");
    
    setHasAdmin((count ?? 0) > 0);
  };

  const handleAppUserLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const result = await loginWithAppUser(identifier, appPassword);
    
    if (result.success) {
      toast({ title: "Đăng nhập thành công!" });
      navigate("/admin");
    } else {
      toast({
        title: "Đăng nhập thất bại",
        description: result.error,
        variant: "destructive",
      });
    }

    setLoading(false);
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: emailPassword,
    });

    if (error) {
      toast({
        title: "Đăng nhập thất bại",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({ title: "Đăng nhập thành công!" });
      navigate("/admin");
    }

    setLoading(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const redirectUrl = `${window.location.origin}/admin`;

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password: emailPassword,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) {
      toast({
        title: "Đăng ký thất bại",
        description: error.message,
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    if (data.user) {
      toast({
        title: "Đăng ký thành công!",
        description: "Tài khoản đã được tạo. Hãy liên hệ admin hiện tại để được cấp quyền, hoặc xem hướng dẫn bên dưới nếu đây là admin đầu tiên.",
      });
      setEmail("");
      setEmailPassword("");
      setFullName("");
      checkExistingAdmin();
    }

    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-subtle p-4">
      <div className="w-full max-w-md space-y-4">
        <Button variant="ghost" asChild className="mb-2">
          <Link to="/" className="flex items-center gap-2">
            <Home className="h-4 w-4" />
            Về trang chủ
          </Link>
        </Button>
        <Card className="shadow-elegant">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <span className="font-serif text-2xl font-bold">H</span>
            </div>
            <CardTitle className="font-serif text-2xl">Quản Trị Gia Phả</CardTitle>
            <CardDescription>
              Đăng nhập để truy cập trang quản trị
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login" className="gap-2">
                  <LogIn className="h-4 w-4" /> Đăng Nhập
                </TabsTrigger>
                <TabsTrigger value="signup" className="gap-2">
                  <UserPlus className="h-4 w-4" /> Đăng Ký
                </TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                {/* Login method toggle */}
                <div className="flex gap-2 pt-4 pb-2">
                  <Button
                    type="button"
                    variant={loginMethod === "username" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setLoginMethod("username")}
                    className="flex-1"
                  >
                    <User className="h-4 w-4 mr-1" />
                    Tài khoản
                  </Button>
                  <Button
                    type="button"
                    variant={loginMethod === "email" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setLoginMethod("email")}
                    className="flex-1"
                  >
                    <Mail className="h-4 w-4 mr-1" />
                    Email
                  </Button>
                </div>

                {loginMethod === "username" ? (
                  <form onSubmit={handleAppUserLogin} className="space-y-4 pt-2">
                    <div className="space-y-2">
                      <Label htmlFor="login-identifier">Tên đăng nhập hoặc SĐT</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="login-identifier"
                          type="text"
                          placeholder="username hoặc 0912345678"
                          value={identifier}
                          onChange={(e) => setIdentifier(e.target.value)}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="login-app-password">Mật khẩu</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="login-app-password"
                          type="password"
                          placeholder="••••••••"
                          value={appPassword}
                          onChange={(e) => setAppPassword(e.target.value)}
                          className="pl-10"
                          required
                          minLength={6}
                        />
                      </div>
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? "Đang đăng nhập..." : "Đăng Nhập"}
                    </Button>
                    <p className="text-xs text-center text-muted-foreground">
                      Dành cho tài khoản đã được cấp quyền Sub-Admin
                    </p>
                  </form>
                ) : (
                  <form onSubmit={handleEmailLogin} className="space-y-4 pt-2">
                    <div className="space-y-2">
                      <Label htmlFor="login-email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="login-email"
                          type="email"
                          placeholder="admin@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="login-email-password">Mật khẩu</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="login-email-password"
                          type="password"
                          placeholder="••••••••"
                          value={emailPassword}
                          onChange={(e) => setEmailPassword(e.target.value)}
                          className="pl-10"
                          required
                          minLength={6}
                        />
                      </div>
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? "Đang đăng nhập..." : "Đăng Nhập"}
                    </Button>
                  </form>
                )}
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Họ và tên</Label>
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="Nguyễn Văn A"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="admin@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Mật khẩu</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="Tối thiểu 6 ký tự"
                        value={emailPassword}
                        onChange={(e) => setEmailPassword(e.target.value)}
                        className="pl-10"
                        required
                        minLength={6}
                      />
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Đang đăng ký..." : "Đăng Ký Tài Khoản"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Hướng dẫn setup admin */}
        <Alert className="border-primary/20 bg-primary/5">
          <Info className="h-4 w-4" />
          <AlertTitle className="font-serif">Hướng dẫn cấp quyền Admin</AlertTitle>
          <AlertDescription className="mt-2 space-y-2 text-sm">
            <p><strong>Cách 1:</strong> Dùng tài khoản app (username) đã được cấp quyền Sub-Admin</p>
            <p><strong>Cách 2:</strong> Đăng ký email và thêm quyền thủ công:</p>
            <ol className="list-inside list-decimal space-y-1 text-muted-foreground">
              <li>Mở Backend từ menu Lovable Cloud</li>
              <li>Vào Database → Tables → user_roles</li>
              <li>Thêm dòng mới với <code className="rounded bg-muted px-1">user_id</code> và <code className="rounded bg-muted px-1">role = admin</code></li>
            </ol>
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
};

export default AdminLogin;
