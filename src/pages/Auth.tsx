import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppAuth } from '@/hooks/useAppAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, User, Lock, Phone, UserPlus, LogIn, CheckCircle2, Home } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export default function Auth() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register, user } = useAppAuth();
  
  // Get the page user was trying to access before being redirected
  const from = (location.state as { from?: Location })?.from?.pathname || '/';
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  
  // Login state
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<{ message: string; field?: string } | null>(null);

  // Register state
  const [registerUsername, setRegisterUsername] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerFullName, setRegisterFullName] = useState('');
  const [registerPhone, setRegisterPhone] = useState('');
  const [registerLoading, setRegisterLoading] = useState(false);
  const [registerError, setRegisterError] = useState<{ message: string; field?: string } | null>(null);
  
  // Success dialog
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

  // Redirect if already logged in - go to the page they were trying to access
  if (user) {
    navigate(from, { replace: true });
    return null;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoginLoading(true);

    const result = await login(loginIdentifier, loginPassword);
    
    setLoginLoading(false);
    
    if (result.success) {
      // Redirect to the page user was trying to access before login
      navigate(from, { replace: true });
    } else {
      setLoginError({ message: result.error || 'Đăng nhập thất bại', field: result.field });
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError(null);

    // Client-side validation
    if (registerPassword.length < 8) {
      setRegisterError({ message: 'Mật khẩu phải có ít nhất 8 ký tự', field: 'password' });
      return;
    }

    setRegisterLoading(true);

    const result = await register({
      username: registerUsername,
      password: registerPassword,
      full_name: registerFullName,
      phone: registerPhone,
    });
    
    setRegisterLoading(false);
    
    if (result.success) {
      // Clear form
      setRegisterUsername('');
      setRegisterPassword('');
      setRegisterFullName('');
      setRegisterPhone('');
      // Show success dialog
      setShowSuccessDialog(true);
    } else {
      setRegisterError({ message: result.error || 'Đăng ký thất bại', field: result.field });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Button variant="ghost" asChild className="mb-4">
          <Link to="/" className="flex items-center gap-2">
            <Home className="h-4 w-4" />
            Về trang chủ
          </Link>
        </Button>
        <Card className="shadow-xl border-border/50">
        <CardHeader className="space-y-1 text-center pb-4">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-2">
            <User className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Gia Phả Họ Hà</CardTitle>
          <CardDescription>
            Đăng nhập hoặc đăng ký để tiếp tục
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'login' | 'register')}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login" className="flex items-center gap-2">
                <LogIn className="w-4 h-4" />
                Đăng nhập
              </TabsTrigger>
              <TabsTrigger value="register" className="flex items-center gap-2">
                <UserPlus className="w-4 h-4" />
                Đăng ký
              </TabsTrigger>
            </TabsList>

            {/* Login Tab */}
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-identifier">Tên đăng nhập hoặc Số điện thoại</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="login-identifier"
                      placeholder="Nhập tên đăng nhập hoặc SĐT"
                      value={loginIdentifier}
                      onChange={(e) => setLoginIdentifier(e.target.value)}
                      className={`pl-10 ${loginError?.field === 'identifier' ? 'border-destructive' : ''}`}
                      required
                    />
                  </div>
                  {loginError?.field === 'identifier' && (
                    <p className="text-sm text-destructive">{loginError.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="login-password">Mật khẩu</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="Nhập mật khẩu"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className={`pl-10 ${loginError?.field === 'password' ? 'border-destructive' : ''}`}
                      required
                    />
                  </div>
                  {loginError?.field === 'password' && (
                    <p className="text-sm text-destructive">{loginError.message}</p>
                  )}
                </div>

                {loginError?.field === 'status' && (
                  <Alert variant="destructive">
                    <AlertDescription>{loginError.message}</AlertDescription>
                  </Alert>
                )}

                {loginError && !loginError.field && (
                  <Alert variant="destructive">
                    <AlertDescription>{loginError.message}</AlertDescription>
                  </Alert>
                )}

                <Button type="submit" className="w-full" disabled={loginLoading}>
                  {loginLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Đang đăng nhập...
                    </>
                  ) : (
                    <>
                      <LogIn className="mr-2 h-4 w-4" />
                      Đăng nhập
                    </>
                  )}
                </Button>
              </form>
            </TabsContent>

            {/* Register Tab */}
            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="register-fullname">Họ và tên</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="register-fullname"
                      placeholder="Nhập họ và tên"
                      value={registerFullName}
                      onChange={(e) => setRegisterFullName(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-username">Tên đăng nhập</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="register-username"
                      placeholder="Nhập tên đăng nhập"
                      value={registerUsername}
                      onChange={(e) => setRegisterUsername(e.target.value)}
                      className={`pl-10 ${registerError?.field === 'username' ? 'border-destructive' : ''}`}
                      required
                    />
                  </div>
                  {registerError?.field === 'username' && (
                    <p className="text-sm text-destructive">{registerError.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-phone">Số điện thoại</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="register-phone"
                      type="tel"
                      placeholder="Nhập số điện thoại"
                      value={registerPhone}
                      onChange={(e) => setRegisterPhone(e.target.value)}
                      className={`pl-10 ${registerError?.field === 'phone' ? 'border-destructive' : ''}`}
                      required
                    />
                  </div>
                  {registerError?.field === 'phone' && (
                    <p className="text-sm text-destructive">{registerError.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-password">Mật khẩu</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="register-password"
                      type="password"
                      placeholder="Tối thiểu 8 ký tự"
                      value={registerPassword}
                      onChange={(e) => setRegisterPassword(e.target.value)}
                      className={`pl-10 ${registerError?.field === 'password' ? 'border-destructive' : ''}`}
                      required
                      minLength={8}
                    />
                  </div>
                  {registerError?.field === 'password' && (
                    <p className="text-sm text-destructive">{registerError.message}</p>
                  )}
                </div>

                {registerError && !registerError.field && (
                  <Alert variant="destructive">
                    <AlertDescription>{registerError.message}</AlertDescription>
                  </Alert>
                )}

                <Button type="submit" className="w-full" disabled={registerLoading}>
                  {registerLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Đang đăng ký...
                    </>
                  ) : (
                    <>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Đăng ký
                    </>
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      </div>

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <DialogTitle className="text-xl">Đăng ký thành công!</DialogTitle>
            <DialogDescription className="text-base pt-2">
              Tài khoản đã được tạo. Vui lòng liên hệ <strong>Hà Quang Thông</strong> để được duyệt.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center pt-4">
            <Button onClick={() => {
              setShowSuccessDialog(false);
              setActiveTab('login');
            }}>
              Đã hiểu
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
