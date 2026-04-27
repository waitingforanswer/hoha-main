import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { AppAuthProvider } from "@/hooks/useAppAuth";
import { AdminAuthProvider } from "@/hooks/useAdminAuth";
import { PermissionProtectedRoute } from "@/components/PermissionProtectedRoute";
import { AdminProtectedRoute } from "@/components/admin/AdminProtectedRoute";
import { PERMISSIONS } from "@/hooks/usePermissions";
import Index from "./pages/Index";
import FamilyTree from "./pages/FamilyTree";
import MemberDetail from "./pages/MemberDetail";
import About from "./pages/About";
import Auth from "./pages/Auth";
import Posts from "./pages/Posts";
import PostDetail from "./pages/PostDetail";
import AdminLogin from "./pages/admin/Login";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminMembers from "./pages/admin/Members";
import AdminSettings from "./pages/admin/Settings";
import MenuManagement from "./pages/admin/MenuManagement";
import FooterManagement from "./pages/admin/FooterManagement";
import PagesManagement from "./pages/admin/PagesManagement";
import HomepageManagement from "./pages/admin/HomepageManagement";
import AboutManagement from "./pages/admin/AboutManagement";
import PostsManagement from "./pages/admin/PostsManagement";
import AdminHelp from "./pages/admin/Help";
import FeedbackManagement from "./pages/admin/FeedbackManagement";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <AppAuthProvider>
        <AdminAuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/gioi-thieu" element={<About />} />
                <Route path="/bai-viet" element={<Posts />} />
                <Route path="/bai-viet/:id" element={<PostDetail />} />
                <Route path="/login" element={<Auth />} />
                <Route path="/auth" element={<Auth />} />
                <Route
                  path="/cay-gia-pha" 
                  element={
                    <PermissionProtectedRoute requiredPermission={PERMISSIONS.VIEW_FAMILY_TREE}>
                      <FamilyTree />
                    </PermissionProtectedRoute>
                  } 
                />
                <Route 
                  path="/thanh-vien/:id" 
                  element={
                    <PermissionProtectedRoute requiredPermission={PERMISSIONS.VIEW_MEMBER_DETAIL}>
                      <MemberDetail />
                    </PermissionProtectedRoute>
                  } 
                />
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route 
                  path="/admin" 
                  element={
                    <AdminProtectedRoute>
                      <AdminDashboard />
                    </AdminProtectedRoute>
                  } 
                />
                <Route 
                  path="/admin/members" 
                  element={
                    <AdminProtectedRoute requiredPermission="MANAGE_MEMBERS">
                      <AdminMembers />
                    </AdminProtectedRoute>
                  } 
                />
                <Route 
                  path="/admin/settings" 
                  element={
                    <AdminProtectedRoute requiredPermission="MANAGE_USERS">
                      <AdminSettings />
                    </AdminProtectedRoute>
                  } 
                />
                <Route 
                  path="/admin/settings/menu" 
                  element={
                    <AdminProtectedRoute requireAdmin>
                      <MenuManagement />
                    </AdminProtectedRoute>
                  } 
                />
                <Route 
                  path="/admin/settings/footer" 
                  element={
                    <AdminProtectedRoute requireAdmin>
                      <FooterManagement />
                    </AdminProtectedRoute>
                  } 
                />
                <Route 
                  path="/admin/settings/pages" 
                  element={
                    <AdminProtectedRoute requireAdmin>
                      <PagesManagement />
                    </AdminProtectedRoute>
                  } 
                />
                <Route 
                  path="/admin/settings/pages/homepage" 
                  element={
                    <AdminProtectedRoute requireAdmin>
                      <HomepageManagement />
                    </AdminProtectedRoute>
                  } 
                />
                <Route 
                  path="/admin/settings/pages/gioi-thieu" 
                  element={
                    <AdminProtectedRoute requireAdmin>
                      <AboutManagement />
                    </AdminProtectedRoute>
                  } 
                />
                <Route 
                  path="/admin/posts" 
                  element={
                    <AdminProtectedRoute requireAdmin>
                      <PostsManagement />
                    </AdminProtectedRoute>
                  } 
                />
                <Route 
                  path="/admin/help" 
                  element={
                    <AdminProtectedRoute>
                      <AdminHelp />
                    </AdminProtectedRoute>
                  } 
                />
                <Route 
                  path="/admin/gopy" 
                  element={
                    <AdminProtectedRoute requireAdmin>
                      <FeedbackManagement />
                    </AdminProtectedRoute>
                  } 
                />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </AdminAuthProvider>
      </AppAuthProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
