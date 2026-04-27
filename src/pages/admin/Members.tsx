import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import AdminLayout from "@/components/admin/AdminLayout";
import MemberForm from "@/components/admin/MemberForm";
import MemberQRCode from "@/components/admin/MemberQRCode";
import ExcelImport from "@/components/admin/ExcelImport";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Pencil, Trash2, QrCode, User, ArrowUp, ArrowDown, ArrowUpDown, Upload } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";
import { format } from "date-fns";

type FamilyMember = Tables<"family_members">;

type SortField = "full_name" | "generation" | "gender" | "birth_date" | "is_alive" | "updated_at";
type SortDirection = "asc" | "desc";

const ITEMS_PER_PAGE = 20;

const AdminMembers = () => {
  const { supabaseSession, appSession, isAdmin } = useAdminAuth();
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<FamilyMember | null>(null);
  const [sortField, setSortField] = useState<SortField>("updated_at");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const { toast } = useToast();
  
  const token = supabaseSession?.access_token || appSession?.token;

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const token = supabaseSession?.access_token || appSession?.token;
      
      if (!token) {
        toast({
          title: "Lỗi",
          description: "Phiên đăng nhập không hợp lệ",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const response = await supabase.functions.invoke("get-family-members", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      if (response.data?.error) {
        throw new Error(response.data.message || response.data.error);
      }

      const data: any = response.data;
      if (Array.isArray(data)) {
        setMembers(data as FamilyMember[]);
      } else if (data && Array.isArray(data.members)) {
        setMembers(data.members as FamilyMember[]);
      } else {
        setMembers([]);
      }
    } catch (error: any) {
      console.error("Fetch members error:", error);
      toast({
        title: "Lỗi",
        description: error.message || "Không thể tải danh sách thành viên",
        variant: "destructive",
      });
      setMembers([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMembers();
  }, [supabaseSession, appSession]);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection(field === "updated_at" ? "desc" : "asc");
    }
    setCurrentPage(1); // Reset to page 1 when sorting changes
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="ml-1 h-3 w-3 opacity-50" />;
    }
    return sortDirection === "asc" ? (
      <ArrowUp className="ml-1 h-3 w-3" />
    ) : (
      <ArrowDown className="ml-1 h-3 w-3" />
    );
  };

  // Filter and sort all members (search works across all)
  const sortedAndFilteredMembers = useMemo(() => {
    let filtered = members.filter((m) =>
      m.full_name.toLowerCase().includes(search.toLowerCase())
    );

    return filtered.sort((a, b) => {
      let aVal: any;
      let bVal: any;

      switch (sortField) {
        case "full_name":
          aVal = a.full_name.toLowerCase();
          bVal = b.full_name.toLowerCase();
          break;
        case "generation":
          aVal = a.generation;
          bVal = b.generation;
          break;
        case "gender":
          aVal = a.gender || "";
          bVal = b.gender || "";
          break;
        case "birth_date":
          aVal = a.birth_date ? new Date(a.birth_date).getTime() : 0;
          bVal = b.birth_date ? new Date(b.birth_date).getTime() : 0;
          break;
        case "is_alive":
          aVal = a.is_alive ? 1 : 0;
          bVal = b.is_alive ? 1 : 0;
          break;
        case "updated_at":
          aVal = new Date(a.updated_at).getTime();
          bVal = new Date(b.updated_at).getTime();
          break;
        default:
          return 0;
      }

      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [members, search, sortField, sortDirection]);

  // Pagination calculations
  const totalPages = Math.ceil(sortedAndFilteredMembers.length / ITEMS_PER_PAGE);
  const paginatedMembers = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedAndFilteredMembers.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [sortedAndFilteredMembers, currentPage]);

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: (number | "ellipsis")[] = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push("ellipsis");
      
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      
      for (let i = start; i <= end; i++) pages.push(i);
      
      if (currentPage < totalPages - 2) pages.push("ellipsis");
      pages.push(totalPages);
    }
    
    return pages;
  };

  const handleEdit = (member: FamilyMember) => {
    setSelectedMember(member);
    setFormOpen(true);
  };

  const handleAdd = () => {
    setSelectedMember(null);
    setFormOpen(true);
  };

  const handleQR = (member: FamilyMember) => {
    setSelectedMember(member);
    setQrOpen(true);
  };

  const handleDeleteClick = (member: FamilyMember) => {
    setMemberToDelete(member);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!memberToDelete) return;

    try {
      const token = supabaseSession?.access_token || appSession?.token;
      if (!token) {
        toast({
          title: "Lỗi",
          description: "Phiên đăng nhập không hợp lệ",
          variant: "destructive",
        });
        return;
      }

      const response = await supabase.functions.invoke("manage-family-member", {
        headers: { Authorization: `Bearer ${token}` },
        body: {
          action: "delete",
          memberId: memberToDelete.id,
        },
      });

      if (response.error) throw new Error(response.error.message);
      if (response.data?.error) throw new Error(response.data.error);

      toast({ title: "Đã xóa thành viên!" });
      fetchMembers();
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể xóa thành viên",
        variant: "destructive",
      });
    }

    setDeleteDialogOpen(false);
    setMemberToDelete(null);
  };

  const formatUpdatedAt = (dateStr: string) => {
    try {
      return format(new Date(dateStr), "HH:mm dd/MM/yyyy");
    } catch {
      return "-";
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-serif text-3xl font-bold">Quản lý thành viên</h1>
            <p className="mt-1 text-muted-foreground">
              {sortedAndFilteredMembers.length} thành viên {search && `(tìm thấy từ ${members.length} thành viên)`}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setImportOpen(true)}>
              <Upload className="mr-2 h-4 w-4" />
              Import Excel
            </Button>
            <Button onClick={handleAdd}>
              <Plus className="mr-2 h-4 w-4" />
              Thêm thành viên
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm theo tên..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Table */}
        <div className="rounded-lg border bg-card shadow-elegant overflow-x-auto">
          {loading ? (
            <div className="flex h-48 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : sortedAndFilteredMembers.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center text-muted-foreground">
              <User className="mb-2 h-12 w-12" />
              <p>{search ? "Không tìm thấy thành viên phù hợp" : "Chưa có thành viên nào"}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ảnh</TableHead>
                  <TableHead>
                    <button
                      onClick={() => handleSort("full_name")}
                      className="flex items-center font-medium hover:text-foreground"
                    >
                      Họ tên
                      {getSortIcon("full_name")}
                    </button>
                  </TableHead>
                  <TableHead>
                    <button
                      onClick={() => handleSort("generation")}
                      className="flex items-center font-medium hover:text-foreground"
                    >
                      Đời
                      {getSortIcon("generation")}
                    </button>
                  </TableHead>
                  <TableHead>
                    <button
                      onClick={() => handleSort("gender")}
                      className="flex items-center font-medium hover:text-foreground"
                    >
                      Giới tính
                      {getSortIcon("gender")}
                    </button>
                  </TableHead>
                  <TableHead>
                    <button
                      onClick={() => handleSort("birth_date")}
                      className="flex items-center font-medium hover:text-foreground"
                    >
                      Năm sinh
                      {getSortIcon("birth_date")}
                    </button>
                  </TableHead>
                  <TableHead>
                    <button
                      onClick={() => handleSort("is_alive")}
                      className="flex items-center font-medium hover:text-foreground"
                    >
                      Trạng thái
                      {getSortIcon("is_alive")}
                    </button>
                  </TableHead>
                  <TableHead>
                    <button
                      onClick={() => handleSort("updated_at")}
                      className="flex items-center font-medium hover:text-foreground"
                    >
                      Cập nhật
                      {getSortIcon("updated_at")}
                    </button>
                  </TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedMembers.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div className="h-10 w-10 overflow-hidden rounded-full bg-muted">
                        {member.avatar_url ? (
                          <img
                            src={member.avatar_url}
                            alt={member.full_name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <User className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {member.full_name}
                    </TableCell>
                    <TableCell>Đời {member.generation}</TableCell>
                    <TableCell>
                      {member.gender === "male"
                        ? "Nam"
                        : member.gender === "female"
                        ? "Nữ"
                        : "-"}
                    </TableCell>
                    <TableCell>
                      {member.birth_date
                        ? new Date(member.birth_date).getFullYear()
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                          member.is_alive
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {member.is_alive ? "Còn sống" : "Đã mất"}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {formatUpdatedAt(member.updated_at)}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleQR(member)}
                          title="Tạo mã QR"
                        >
                          <QrCode className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(member)}
                          title="Chỉnh sửa"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteClick(member)}
                          className="text-destructive hover:text-destructive"
                          title="Xóa"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              Hiển thị {((currentPage - 1) * ITEMS_PER_PAGE) + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, sortedAndFilteredMembers.length)} / {sortedAndFilteredMembers.length} thành viên
            </p>
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
                {getPageNumbers().map((page, idx) =>
                  page === "ellipsis" ? (
                    <PaginationItem key={`ellipsis-${idx}`}>
                      <PaginationEllipsis />
                    </PaginationItem>
                  ) : (
                    <PaginationItem key={page}>
                      <PaginationLink
                        onClick={() => setCurrentPage(page)}
                        isActive={currentPage === page}
                        className="cursor-pointer"
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  )
                )}
                <PaginationItem>
                  <PaginationNext
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>

      {/* Form Dialog */}
      <MemberForm
        open={formOpen}
        onOpenChange={setFormOpen}
        member={selectedMember}
        allMembers={members}
        onSuccess={fetchMembers}
      />

      {/* QR Code Dialog */}
      <MemberQRCode
        open={qrOpen}
        onOpenChange={setQrOpen}
        member={selectedMember}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa?</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa thành viên "{memberToDelete?.full_name}"?
              Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Excel Import Dialog */}
      <ExcelImport
        open={importOpen}
        onOpenChange={setImportOpen}
        onSuccess={fetchMembers}
        token={token}
      />
    </AdminLayout>
  );
};

export default AdminMembers;
