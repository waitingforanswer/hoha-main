import { useState, useRef } from "react";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ExcelImportProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  token: string | undefined;
}

interface ParsedMember {
  full_name: string;
  gender?: string;
  birth_date?: string;
  death_date?: string;
  is_alive?: boolean;
  generation?: number;
  phone?: string;
  email?: string;
  occupation?: string;
  address?: string;
  bio?: string;
  lineage_type?: string;
  is_primary_lineage?: boolean;
}

interface ImportResult {
  row: number;
  name: string;
  success: boolean;
  error?: string;
}

const ExcelImport = ({ open, onOpenChange, onSuccess, token }: ExcelImportProps) => {
  const [parsedData, setParsedData] = useState<ParsedMember[]>([]);
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState<ImportResult[]>([]);
  const [step, setStep] = useState<"upload" | "preview" | "result">("upload");
  const [fileName, setFileName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const resetState = () => {
    setParsedData([]);
    setResults([]);
    setStep("upload");
    setFileName("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClose = () => {
    resetState();
    onOpenChange(false);
  };

  const downloadTemplate = () => {
    const templateData = [
      {
        "Họ và tên (*)": "Nguyễn Văn A",
        "Giới tính (nam/nữ)": "nam",
        "Ngày sinh (DD/MM/YYYY)": "01/01/1990",
        "Ngày mất (DD/MM/YYYY)": "",
        "Còn sống (có/không)": "có",
        "Đời thứ": 1,
        "Số điện thoại": "0123456789",
        "Email": "email@example.com",
        "Nghề nghiệp": "Kỹ sư",
        "Địa chỉ": "Hà Nội",
        "Tiểu sử": "Mô tả về thành viên...",
        "Loại dòng (primary/married_in)": "primary",
        "Dòng chính (có/không)": "có",
      },
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    
    // Set column widths
    ws["!cols"] = [
      { wch: 25 }, // Họ và tên
      { wch: 15 }, // Giới tính
      { wch: 20 }, // Ngày sinh
      { wch: 20 }, // Ngày mất
      { wch: 15 }, // Còn sống
      { wch: 10 }, // Đời thứ
      { wch: 15 }, // SĐT
      { wch: 25 }, // Email
      { wch: 15 }, // Nghề nghiệp
      { wch: 25 }, // Địa chỉ
      { wch: 30 }, // Tiểu sử
      { wch: 20 }, // Loại dòng
      { wch: 15 }, // Dòng chính
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Thành viên");
    XLSX.writeFile(wb, "mau_thanh_vien.xlsx");

    toast({
      title: "Đã tải file mẫu",
      description: "File mau_thanh_vien.xlsx đã được tải xuống",
    });
  };

  const parseDate = (value: any): string | undefined => {
    if (!value) return undefined;
    
    // If it's already a Date object (Excel date)
    if (value instanceof Date) {
      return value.toISOString().split("T")[0];
    }
    
    // If it's a string in DD/MM/YYYY format
    if (typeof value === "string") {
      const parts = value.split("/");
      if (parts.length === 3) {
        const [day, month, year] = parts;
        return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
      }
    }
    
    // If it's a number (Excel serial date)
    if (typeof value === "number") {
      const date = XLSX.SSF.parse_date_code(value);
      if (date) {
        return `${date.y}-${String(date.m).padStart(2, "0")}-${String(date.d).padStart(2, "0")}`;
      }
    }
    
    return undefined;
  };

  const parseBoolean = (value: any): boolean => {
    if (typeof value === "boolean") return value;
    if (typeof value === "string") {
      const lower = value.toLowerCase().trim();
      return lower === "có" || lower === "yes" || lower === "true" || lower === "1";
    }
    if (typeof value === "number") return value === 1;
    return true; // Default to true (còn sống)
  };

  const parseGender = (value: any): string | undefined => {
    if (!value) return undefined;
    const lower = String(value).toLowerCase().trim();
    if (lower === "nam" || lower === "male" || lower === "m") return "male";
    if (lower === "nữ" || lower === "nu" || lower === "female" || lower === "f") return "female";
    return undefined;
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array", cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        const parsed: ParsedMember[] = jsonData.map((row: any) => ({
          full_name: row["Họ và tên (*)"] || row["Họ và tên"] || row["full_name"] || "",
          gender: parseGender(row["Giới tính (nam/nữ)"] || row["Giới tính"] || row["gender"]),
          birth_date: parseDate(row["Ngày sinh (DD/MM/YYYY)"] || row["Ngày sinh"] || row["birth_date"]),
          death_date: parseDate(row["Ngày mất (DD/MM/YYYY)"] || row["Ngày mất"] || row["death_date"]),
          is_alive: parseBoolean(row["Còn sống (có/không)"] || row["Còn sống"] || row["is_alive"]),
          generation: parseInt(row["Đời thứ"] || row["generation"]) || 1,
          phone: row["Số điện thoại"] || row["phone"] || undefined,
          email: row["Email"] || row["email"] || undefined,
          occupation: row["Nghề nghiệp"] || row["occupation"] || undefined,
          address: row["Địa chỉ"] || row["address"] || undefined,
          bio: row["Tiểu sử"] || row["bio"] || undefined,
          lineage_type: row["Loại dòng (primary/married_in)"] || row["Loại dòng"] || row["lineage_type"] || "primary",
          is_primary_lineage: parseBoolean(row["Dòng chính (có/không)"] || row["Dòng chính"] || row["is_primary_lineage"]),
        })).filter((member: ParsedMember) => member.full_name.trim() !== "");

        if (parsed.length === 0) {
          toast({
            title: "File trống",
            description: "Không tìm thấy dữ liệu thành viên trong file",
            variant: "destructive",
          });
          return;
        }

        setParsedData(parsed);
        setStep("preview");
      } catch (error) {
        console.error("Error parsing Excel:", error);
        toast({
          title: "Lỗi đọc file",
          description: "Không thể đọc file Excel. Vui lòng kiểm tra định dạng file.",
          variant: "destructive",
        });
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleImport = async () => {
    if (!token) {
      toast({
        title: "Lỗi",
        description: "Phiên đăng nhập không hợp lệ",
        variant: "destructive",
      });
      return;
    }

    setImporting(true);
    const importResults: ImportResult[] = [];

    for (let i = 0; i < parsedData.length; i++) {
      const member = parsedData[i];
      try {
        const response = await supabase.functions.invoke("manage-family-member", {
          headers: { Authorization: `Bearer ${token}` },
          body: {
            action: "create",
            memberData: {
              full_name: member.full_name,
              gender: member.gender,
              birth_date: member.birth_date,
              death_date: member.death_date,
              is_alive: member.is_alive ?? true,
              generation: member.generation || 1,
              phone: member.phone,
              email: member.email,
              occupation: member.occupation,
              address: member.address,
              bio: member.bio,
              lineage_type: member.lineage_type || "primary",
              is_primary_lineage: member.is_primary_lineage ?? true,
            },
          },
        });

        if (response.error || response.data?.error) {
          throw new Error(response.data?.error || response.error?.message || "Unknown error");
        }

        importResults.push({
          row: i + 2, // Row number in Excel (1-indexed + header)
          name: member.full_name,
          success: true,
        });
      } catch (error: any) {
        importResults.push({
          row: i + 2,
          name: member.full_name,
          success: false,
          error: error.message || "Lỗi không xác định",
        });
      }
    }

    setResults(importResults);
    setStep("result");
    setImporting(false);

    const successCount = importResults.filter((r) => r.success).length;
    if (successCount > 0) {
      onSuccess();
    }

    toast({
      title: "Hoàn thành import",
      description: `Thành công: ${successCount}/${importResults.length} thành viên`,
      variant: successCount === importResults.length ? "default" : "destructive",
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Import thành viên từ Excel
          </DialogTitle>
          <DialogDescription>
            Tải lên file Excel chứa thông tin thành viên để thêm hàng loạt
          </DialogDescription>
        </DialogHeader>

        {step === "upload" && (
          <div className="space-y-6 py-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Lưu ý:</strong> File Excel cần có cột "Họ và tên (*)" là bắt buộc. 
                Các cột khác có thể để trống. Tải file mẫu để xem định dạng chuẩn.
              </AlertDescription>
            </Alert>

            <div className="flex flex-col items-center gap-4 p-8 border-2 border-dashed rounded-lg">
              <Upload className="h-12 w-12 text-muted-foreground" />
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">
                  Kéo thả file Excel vào đây hoặc
                </p>
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileUpload}
                  className="max-w-xs"
                />
              </div>
            </div>

            <div className="flex justify-center">
              <Button variant="outline" onClick={downloadTemplate}>
                <Download className="mr-2 h-4 w-4" />
                Tải file mẫu Excel
              </Button>
            </div>
          </div>
        )}

        {step === "preview" && (
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">
                File: <strong>{fileName}</strong> - {parsedData.length} thành viên
              </p>
              <Button variant="outline" size="sm" onClick={resetState}>
                Chọn file khác
              </Button>
            </div>

            <ScrollArea className="flex-1 border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="sticky top-0 bg-background">STT</TableHead>
                    <TableHead className="sticky top-0 bg-background">Họ tên</TableHead>
                    <TableHead className="sticky top-0 bg-background">Giới tính</TableHead>
                    <TableHead className="sticky top-0 bg-background">Năm sinh</TableHead>
                    <TableHead className="sticky top-0 bg-background">Đời</TableHead>
                    <TableHead className="sticky top-0 bg-background">Trạng thái</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedData.map((member, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{idx + 1}</TableCell>
                      <TableCell className="font-medium">{member.full_name}</TableCell>
                      <TableCell>
                        {member.gender === "male" ? "Nam" : member.gender === "female" ? "Nữ" : "-"}
                      </TableCell>
                      <TableCell>
                        {member.birth_date ? new Date(member.birth_date).getFullYear() : "-"}
                      </TableCell>
                      <TableCell>Đời {member.generation || 1}</TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                            member.is_alive !== false
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {member.is_alive !== false ? "Còn sống" : "Đã mất"}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>

            <DialogFooter className="mt-4">
              <Button variant="outline" onClick={handleClose}>
                Hủy
              </Button>
              <Button onClick={handleImport} disabled={importing}>
                {importing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang import...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Import {parsedData.length} thành viên
                  </>
                )}
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === "result" && (
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="h-5 w-5" />
                <span>Thành công: {results.filter((r) => r.success).length}</span>
              </div>
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-5 w-5" />
                <span>Thất bại: {results.filter((r) => !r.success).length}</span>
              </div>
            </div>

            <ScrollArea className="flex-1 border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="sticky top-0 bg-background">Dòng</TableHead>
                    <TableHead className="sticky top-0 bg-background">Họ tên</TableHead>
                    <TableHead className="sticky top-0 bg-background">Kết quả</TableHead>
                    <TableHead className="sticky top-0 bg-background">Chi tiết</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map((result, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{result.row}</TableCell>
                      <TableCell className="font-medium">{result.name}</TableCell>
                      <TableCell>
                        {result.success ? (
                          <span className="inline-flex items-center gap-1 text-green-600">
                            <CheckCircle2 className="h-4 w-4" />
                            Thành công
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-destructive">
                            <AlertCircle className="h-4 w-4" />
                            Thất bại
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {result.error || "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>

            <DialogFooter className="mt-4">
              <Button variant="outline" onClick={resetState}>
                Import thêm
              </Button>
              <Button onClick={handleClose}>
                Đóng
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ExcelImport;
