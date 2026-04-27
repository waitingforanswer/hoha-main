import { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { MessageCircle, Eye, Trash2, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

type FeedbackStatus = "new" | "processing" | "done";

interface Feedback {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  message: string;
  status: FeedbackStatus;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

const STATUS_CONFIG: Record<FeedbackStatus, { label: string; variant: "default" | "secondary" | "outline" }> = {
  new: { label: "Mới", variant: "default" },
  processing: { label: "Đang xử lý", variant: "secondary" },
  done: { label: "Xong", variant: "outline" },
};

const FeedbackManagement = () => {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [feedbackToDelete, setFeedbackToDelete] = useState<Feedback | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchFeedbacks = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("feedbacks")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setFeedbacks((data as Feedback[]) || []);
    } catch (error) {
      console.error("Error fetching feedbacks:", error);
      toast.error("Không thể tải danh sách góp ý");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const handleViewFeedback = (feedback: Feedback) => {
    setSelectedFeedback(feedback);
    setAdminNotes(feedback.admin_notes || "");
    setViewDialogOpen(true);
  };

  const handleStatusChange = async (feedbackId: string, newStatus: FeedbackStatus) => {
    try {
      const { error } = await supabase
        .from("feedbacks")
        .update({ status: newStatus })
        .eq("id", feedbackId);

      if (error) throw error;

      setFeedbacks((prev) =>
        prev.map((f) => (f.id === feedbackId ? { ...f, status: newStatus } : f))
      );
      
      if (selectedFeedback?.id === feedbackId) {
        setSelectedFeedback({ ...selectedFeedback, status: newStatus });
      }

      toast.success("Đã cập nhật trạng thái");
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Không thể cập nhật trạng thái");
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedFeedback) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("feedbacks")
        .update({ admin_notes: adminNotes })
        .eq("id", selectedFeedback.id);

      if (error) throw error;

      setFeedbacks((prev) =>
        prev.map((f) =>
          f.id === selectedFeedback.id ? { ...f, admin_notes: adminNotes } : f
        )
      );
      setSelectedFeedback({ ...selectedFeedback, admin_notes: adminNotes });
      toast.success("Đã lưu ghi chú");
    } catch (error) {
      console.error("Error saving notes:", error);
      toast.error("Không thể lưu ghi chú");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteFeedback = async () => {
    if (!feedbackToDelete) return;

    try {
      const { error } = await supabase
        .from("feedbacks")
        .delete()
        .eq("id", feedbackToDelete.id);

      if (error) throw error;

      setFeedbacks((prev) => prev.filter((f) => f.id !== feedbackToDelete.id));
      toast.success("Đã xóa góp ý");
    } catch (error) {
      console.error("Error deleting feedback:", error);
      toast.error("Không thể xóa góp ý");
    } finally {
      setDeleteDialogOpen(false);
      setFeedbackToDelete(null);
    }
  };

  const confirmDelete = (feedback: Feedback) => {
    setFeedbackToDelete(feedback);
    setDeleteDialogOpen(true);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold">
              <MessageCircle className="h-6 w-6" />
              Quản lý góp ý
            </h1>
            <p className="text-muted-foreground">
              Xem và quản lý các góp ý, đề xuất từ người dùng
            </p>
          </div>
          <Button variant="outline" onClick={fetchFeedbacks} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Làm mới
          </Button>
        </div>

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : feedbacks.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center rounded-lg border bg-card text-muted-foreground">
            <MessageCircle className="mb-2 h-12 w-12" />
            <p>Chưa có góp ý nào</p>
          </div>
        ) : (
          <div className="rounded-lg border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Người gửi</TableHead>
                  <TableHead>Nội dung</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Ngày gửi</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {feedbacks.map((feedback) => (
                  <TableRow key={feedback.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{feedback.name}</p>
                        {feedback.phone && (
                          <p className="text-sm text-muted-foreground">{feedback.phone}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="max-w-xs truncate">{feedback.message}</p>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={feedback.status}
                        onValueChange={(value: FeedbackStatus) =>
                          handleStatusChange(feedback.id, value)
                        }
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue>
                            <Badge variant={STATUS_CONFIG[feedback.status].variant}>
                              {STATUS_CONFIG[feedback.status].label}
                            </Badge>
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {(Object.keys(STATUS_CONFIG) as FeedbackStatus[]).map((status) => (
                            <SelectItem key={status} value={status}>
                              <Badge variant={STATUS_CONFIG[status].variant}>
                                {STATUS_CONFIG[status].label}
                              </Badge>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      {format(new Date(feedback.created_at), "dd/MM/yyyy HH:mm", {
                        locale: vi,
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewFeedback(feedback)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => confirmDelete(feedback)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Chi tiết góp ý</DialogTitle>
          </DialogHeader>
          {selectedFeedback && (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Người gửi</p>
                  <p className="font-medium">{selectedFeedback.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Số điện thoại</p>
                  <p className="font-medium">{selectedFeedback.phone || "Không có"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{selectedFeedback.email || "Không có"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Ngày gửi</p>
                  <p className="font-medium">
                    {format(new Date(selectedFeedback.created_at), "dd/MM/yyyy HH:mm", {
                      locale: vi,
                    })}
                  </p>
                </div>
              </div>

              <div>
                <p className="mb-1 text-sm text-muted-foreground">Trạng thái</p>
                <Select
                  value={selectedFeedback.status}
                  onValueChange={(value: FeedbackStatus) =>
                    handleStatusChange(selectedFeedback.id, value)
                  }
                >
                  <SelectTrigger className="w-40">
                    <SelectValue>
                      <Badge variant={STATUS_CONFIG[selectedFeedback.status].variant}>
                        {STATUS_CONFIG[selectedFeedback.status].label}
                      </Badge>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(STATUS_CONFIG) as FeedbackStatus[]).map((status) => (
                      <SelectItem key={status} value={status}>
                        <Badge variant={STATUS_CONFIG[status].variant}>
                          {STATUS_CONFIG[status].label}
                        </Badge>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <p className="mb-1 text-sm text-muted-foreground">Nội dung góp ý</p>
                <div className="rounded-lg border bg-muted/50 p-3">
                  <p className="whitespace-pre-wrap">{selectedFeedback.message}</p>
                </div>
              </div>

              <div>
                <p className="mb-1 text-sm text-muted-foreground">Ghi chú của Admin</p>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Thêm ghi chú về góp ý này..."
                  className="min-h-[100px]"
                />
                <Button
                  className="mt-2"
                  size="sm"
                  onClick={handleSaveNotes}
                  disabled={saving}
                >
                  {saving ? "Đang lưu..." : "Lưu ghi chú"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa góp ý từ "{feedbackToDelete?.name}"? Hành động
              này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteFeedback}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default FeedbackManagement;
