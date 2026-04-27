import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Upload, X, RefreshCw, Eye } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";
import AvatarCropper from "./AvatarCropper";
import MarriageManager from "./MarriageManager";

type FamilyMember = Tables<"family_members">;

const memberSchema = z.object({
  full_name: z.string().min(1, "Tên không được để trống").max(100),
  gender: z.string().optional(),
  birth_date: z.string().optional(),
  death_date: z.string().optional(),
  phone: z.string().max(20).optional(),
  email: z.string().email("Email không hợp lệ").optional().or(z.literal("")),
  occupation: z.string().max(100).optional(),
  address: z.string().max(255).optional(),
  bio: z.string().max(1000).optional(),
  generation: z.number().min(1).max(20),
  is_alive: z.boolean(),
  lineage_type: z.enum(["primary", "maternal"]),
  father_id: z.string().optional(),
  mother_id: z.string().optional(),
  spouse_id: z.string().optional(),
  is_default_view: z.boolean().optional(),
});

type MemberFormData = z.infer<typeof memberSchema>;

interface MemberFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member?: FamilyMember | null;
  allMembers: FamilyMember[];
  onSuccess: () => void;
}

const MemberForm = ({
  open,
  onOpenChange,
  member,
  allMembers,
  onSuccess,
}: MemberFormProps) => {
  const { supabaseSession, appSession } = useAdminAuth();
  const [loading, setLoading] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [cropperOpen, setCropperOpen] = useState(false);
  const [rawImageSrc, setRawImageSrc] = useState<string | null>(null);
  const [hasExistingAvatar, setHasExistingAvatar] = useState(false);
  const { toast } = useToast();

  // Get auth token for Edge Function calls
  const getAuthToken = (): string | null => {
    return supabaseSession?.access_token || appSession?.token || null;
  };

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<MemberFormData>({
    resolver: zodResolver(memberSchema),
    defaultValues: {
      full_name: "",
      gender: "",
      birth_date: "",
      death_date: "",
      phone: "",
      email: "",
      occupation: "",
      address: "",
      bio: "",
      generation: 1,
      is_alive: true,
      lineage_type: "primary" as const,
      father_id: "",
      mother_id: "",
      spouse_id: "",
      is_default_view: false,
    },
  });

  const isAlive = watch("is_alive");
  const lineageType = watch("lineage_type");
  const currentGender = watch("gender");
  const isDefaultView = watch("is_default_view");

  useEffect(() => {
    if (member) {
      let lineageTypeValue: "primary" | "maternal" = "primary";
      if ((member as any).lineage_type === "maternal" || (member as any).lineage_type === "spouse") {
        lineageTypeValue = "maternal";
      } else if (member.is_primary_lineage === false) {
        lineageTypeValue = "maternal";
      }
      
      reset({
        full_name: member.full_name,
        gender: member.gender || "",
        birth_date: member.birth_date || "",
        death_date: member.death_date || "",
        phone: member.phone || "",
        email: member.email || "",
        occupation: member.occupation || "",
        address: member.address || "",
        bio: member.bio || "",
        generation: member.generation,
        is_alive: member.is_alive ?? true,
        lineage_type: lineageTypeValue,
        father_id: member.father_id || "",
        mother_id: member.mother_id || "",
        spouse_id: member.spouse_id || "",
        is_default_view: (member as any).is_default_view ?? false,
      });
      setAvatarPreview(member.avatar_url);
      setHasExistingAvatar(!!member.avatar_url);
    } else {
      reset({
        full_name: "",
        gender: "",
        birth_date: "",
        death_date: "",
        phone: "",
        email: "",
        occupation: "",
        address: "",
        bio: "",
        generation: 1,
        is_alive: true,
        lineage_type: "primary",
        father_id: "",
        mother_id: "",
        spouse_id: "",
        is_default_view: false,
      });
      setAvatarPreview(null);
      setHasExistingAvatar(false);
    }
    setAvatarFile(null);
    setRawImageSrc(null);
  }, [member, reset]);

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Lỗi",
          description: "Kích thước ảnh tối đa là 5MB",
          variant: "destructive",
        });
        return;
      }
      const imageUrl = URL.createObjectURL(file);
      setRawImageSrc(imageUrl);
      setCropperOpen(true);
    }
    // Reset input to allow selecting the same file again
    e.target.value = "";
  };

  const handleCropComplete = (croppedBlob: Blob) => {
    const file = new File([croppedBlob], "avatar.jpg", { type: "image/jpeg" });
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(croppedBlob));
    setRawImageSrc(null);
  };

  const handleRemoveAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
    setHasExistingAvatar(false);
  };

  const handleChangeAvatar = () => {
    const input = document.getElementById("avatar-input") as HTMLInputElement;
    input?.click();
  };

  const uploadAvatarViaEdgeFunction = async (memberId: string, file: File): Promise<string | null> => {
    const token = getAuthToken();
    if (!token) return null;

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64Data = reader.result as string;
          
          const response = await supabase.functions.invoke("manage-family-member", {
            headers: { Authorization: `Bearer ${token}` },
            body: {
              action: "upload_avatar",
              memberId,
              avatarData: base64Data,
            },
          });

          if (response.error) {
            console.error("Upload error:", response.error);
            reject(response.error);
            return;
          }

          if (response.data?.error) {
            console.error("Upload error:", response.data.error);
            reject(new Error(response.data.error));
            return;
          }

          resolve(response.data?.avatar_url || null);
        } catch (err) {
          console.error("Upload error:", err);
          reject(err);
        }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  };

  const uploadAvatar = async (memberId: string): Promise<string | null> => {
    // If avatar was removed
    if (!avatarPreview && !avatarFile) {
      return null;
    }
    
    // If no new file selected, return existing URL
    if (!avatarFile) {
      return member?.avatar_url || null;
    }

    // Upload via Edge Function (works for both admin and sub-admin)
    return uploadAvatarViaEdgeFunction(memberId, avatarFile);
  };

  const onSubmit = async (data: MemberFormData) => {
    setLoading(true);

    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error("Phiên đăng nhập không hợp lệ");
      }

      const memberData = {
        full_name: data.full_name,
        gender: data.gender || null,
        birth_date: data.birth_date || null,
        death_date: data.death_date || null,
        phone: data.phone || null,
        email: data.email || null,
        occupation: data.occupation || null,
        address: data.address || null,
        bio: data.bio || null,
        generation: data.generation,
        is_alive: data.is_alive,
        lineage_type: data.lineage_type,
        is_primary_lineage: data.lineage_type === 'primary',
        father_id: data.father_id || null,
        mother_id: data.mother_id || null,
        spouse_id: data.spouse_id || null,
        is_default_view: data.is_default_view || false,
      };

      if (member) {
        // Update existing member via Edge Function
        const avatarUrl = await uploadAvatar(member.id);
        
        const response = await supabase.functions.invoke("manage-family-member", {
          headers: { Authorization: `Bearer ${token}` },
          body: {
            action: "update",
            memberId: member.id,
            memberData: { ...memberData, avatar_url: avatarUrl },
          },
        });

        if (response.error) throw new Error(response.error.message);
        if (response.data?.error) throw new Error(response.data.error);

        toast({ title: "Đã cập nhật thành viên!" });
      } else {
        // Create new member via Edge Function
        const response = await supabase.functions.invoke("manage-family-member", {
          headers: { Authorization: `Bearer ${token}` },
          body: {
            action: "create",
            memberData,
          },
        });

        if (response.error) throw new Error(response.error.message);
        if (response.data?.error) throw new Error(response.data.error);

        const newMember = response.data;

        if (avatarFile && newMember?.id) {
          const avatarUrl = await uploadAvatar(newMember.id);
          if (avatarUrl) {
            // Update avatar via Edge Function
            await supabase.functions.invoke("manage-family-member", {
              headers: { Authorization: `Bearer ${token}` },
              body: {
                action: "update",
                memberId: newMember.id,
                memberData: { avatar_url: avatarUrl },
              },
            });
          }
        }

        toast({ title: "Đã thêm thành viên mới!" });
      }

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const maleMembers = allMembers.filter(
    (m) => m.gender === "male" && m.id !== member?.id
  );
  const femaleMembers = allMembers.filter(
    (m) => m.gender === "female" && m.id !== member?.id
  );

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">
              {member ? "Chỉnh sửa thành viên" : "Thêm thành viên mới"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Avatar upload */}
            <div className="flex items-start gap-4">
              <div className="relative h-24 w-24 overflow-hidden rounded-lg border-2 border-dashed border-muted-foreground/30 flex-shrink-0">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Avatar"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <label className="flex h-full w-full cursor-pointer flex-col items-center justify-center text-muted-foreground hover:text-foreground">
                    <Upload className="h-6 w-6" />
                    <span className="mt-1 text-xs">Upload</span>
                    <input
                      id="avatar-input"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarSelect}
                    />
                  </label>
                )}
              </div>
              <div className="flex-1 space-y-2">
                <p className="text-sm font-medium">Ảnh đại diện</p>
                <p className="text-xs text-muted-foreground">
                  Định dạng: JPG, PNG. Tối đa: 5MB. Ảnh sẽ được cắt thành hình vuông.
                </p>
                {avatarPreview && (
                  <div className="flex gap-2 pt-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleChangeAvatar}
                    >
                      <RefreshCw className="mr-1 h-3 w-3" />
                      Thay đổi
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleRemoveAvatar}
                      className="text-destructive hover:text-destructive"
                    >
                      <X className="mr-1 h-3 w-3" />
                      Xóa
                    </Button>
                    <input
                      id="avatar-input"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarSelect}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Basic info */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="full_name">Họ và tên *</Label>
                <Input
                  id="full_name"
                  {...register("full_name")}
                  placeholder="Nguyễn Văn A"
                />
                {errors.full_name && (
                  <p className="text-sm text-destructive">
                    {errors.full_name.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Giới tính</Label>
                <Select
                  value={watch("gender")}
                  onValueChange={(value) => setValue("gender", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn giới tính" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Nam</SelectItem>
                    <SelectItem value="female">Nữ</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="birth_date">Ngày sinh</Label>
                <Input id="birth_date" type="date" {...register("birth_date")} />
              </div>

              <div className="space-y-2">
                <Label>Còn sống</Label>
                <Select
                  value={isAlive ? "true" : "false"}
                  onValueChange={(value) => setValue("is_alive", value === "true")}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Còn sống</SelectItem>
                    <SelectItem value="false">Đã mất</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {!isAlive && (
                <div className="space-y-2">
                  <Label htmlFor="death_date">Ngày mất</Label>
                  <Input id="death_date" type="date" {...register("death_date")} />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="generation">Đời thứ *</Label>
                <Input
                  id="generation"
                  type="number"
                  min={1}
                  max={20}
                  {...register("generation", { valueAsNumber: true })}
                />
              </div>
            </div>

            {/* Lineage info */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Phân loại dòng tộc</Label>
                <Select
                  value={lineageType}
                  onValueChange={(value) => setValue("lineage_type", value as "primary" | "maternal")}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="primary">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded border-2 border-lineage-primary" />
                        <span>Họ Hà (Huyết Thống Chính)</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="maternal">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded border-2 border-foreground/50" />
                        <span>Khác</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Phân loại thành viên trong dòng họ
                </p>
              </div>

              {/* Default View setting */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is_default_view"
                    checked={isDefaultView}
                    onCheckedChange={(checked) => setValue("is_default_view", !!checked)}
                  />
                  <Label 
                    htmlFor="is_default_view" 
                    className="flex items-center gap-2 cursor-pointer font-normal"
                  >
                    <Eye className="h-4 w-4 text-primary" />
                    Đặt làm vị trí mặc định cây gia phả
                  </Label>
                </div>
                <p className="text-xs text-muted-foreground">
                  Khi truy cập cây gia phả, view sẽ tự động focus vào thành viên này. Chỉ có thể đặt cho 1 thành viên.
                </p>
              </div>

              {/* Marriage Manager - only show for existing members */}
              {member && (
                <div className="sm:col-span-2">
                  <MarriageManager
                    memberId={member.id}
                    memberGender={currentGender || null}
                    allMembers={allMembers}
                    authToken={getAuthToken()}
                  />
                </div>
              )}

              {/* Simple spouse select for new members */}
              {!member && (
                <div className="space-y-2">
                  <Label>Vợ/Chồng (có thể thêm sau)</Label>
                  <Select
                    value={watch("spouse_id") || ""}
                    onValueChange={(value) => setValue("spouse_id", value === "none" ? "" : value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn vợ/chồng" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">-- Không có --</SelectItem>
                      {allMembers
                        .filter(m => m.id !== member?.id && m.gender !== currentGender)
                        .map((m) => (
                          <SelectItem key={m.id} value={m.id}>
                            {m.full_name} (Đời {m.generation})
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Sau khi lưu, bạn có thể quản lý nhiều hôn nhân chi tiết hơn
                  </p>
                </div>
              )}
            </div>

            {/* Parent info */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Bố</Label>
                <Select
                  value={watch("father_id") || ""}
                  onValueChange={(value) => setValue("father_id", value === "none" ? "" : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn bố" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">-- Không có --</SelectItem>
                    {maleMembers.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.full_name} (Đời {m.generation})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Mẹ</Label>
                <Select
                  value={watch("mother_id") || ""}
                  onValueChange={(value) => setValue("mother_id", value === "none" ? "" : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn mẹ" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">-- Không có --</SelectItem>
                    {femaleMembers.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.full_name} (Đời {m.generation})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Contact info */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="phone">Số điện thoại</Label>
                <Input
                  id="phone"
                  {...register("phone")}
                  placeholder="0123456789"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  {...register("email")}
                  placeholder="example@email.com"
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="occupation">Nghề nghiệp</Label>
                <Input
                  id="occupation"
                  {...register("occupation")}
                  placeholder="Kỹ sư, Bác sĩ..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Địa chỉ</Label>
                <Input
                  id="address"
                  {...register("address")}
                  placeholder="Hà Nội, Việt Nam"
                />
              </div>
            </div>

            {/* Bio */}
            <div className="space-y-2">
              <Label htmlFor="bio">Tiểu sử</Label>
              <Textarea
                id="bio"
                {...register("bio")}
                placeholder="Mô tả ngắn về thành viên..."
                rows={3}
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Hủy
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Đang lưu..." : member ? "Cập nhật" : "Thêm mới"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Avatar Cropper */}
      {rawImageSrc && (
        <AvatarCropper
          open={cropperOpen}
          onOpenChange={(open) => {
            setCropperOpen(open);
            if (!open) setRawImageSrc(null);
          }}
          imageSrc={rawImageSrc}
          onCropComplete={handleCropComplete}
        />
      )}
    </>
  );
};

export default MemberForm;
