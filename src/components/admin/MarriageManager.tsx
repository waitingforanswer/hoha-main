import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
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
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Edit2, Check, X, Heart, HeartOff } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type FamilyMember = Tables<"family_members">;

interface Marriage {
  id: string;
  husband_id: string;
  wife_id: string;
  marriage_order: number;
  marriage_date: string | null;
  divorce_date: string | null;
  is_active: boolean;
  notes: string | null;
}

interface MarriageManagerProps {
  memberId: string | null; // null for new members
  memberGender: string | null;
  allMembers: FamilyMember[];
  authToken: string | null;
  onMarriagesChange?: (marriages: Marriage[]) => void;
}

function getWifeLabel(order: number): string {
  switch (order) {
    case 1: return "Vợ cả";
    case 2: return "Vợ hai";
    case 3: return "Vợ ba";
    case 4: return "Vợ tư";
    case 5: return "Vợ năm";
    default: return `Vợ ${order}`;
  }
}

export default function MarriageManager({
  memberId,
  memberGender,
  allMembers,
  authToken,
  onMarriagesChange,
}: MarriageManagerProps) {
  const [marriages, setMarriages] = useState<Marriage[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const { toast } = useToast();

  // Form state for adding/editing
  const [formData, setFormData] = useState({
    spouse_id: "",
    marriage_order: 1,
    marriage_date: "",
    divorce_date: "",
    is_active: true,
    notes: "",
  });

  const isMale = memberGender === "male";
  const isFemale = memberGender === "female";

  // Filter potential spouses (opposite gender, not already married to this person)
  const potentialSpouses = allMembers.filter(m => {
    if (m.id === memberId) return false;
    if (isMale && m.gender !== "female") return false;
    if (isFemale && m.gender !== "male") return false;
    // Check if already in a marriage with this member
    const isAlreadyMarried = marriages.some(
      mar => (mar.husband_id === memberId && mar.wife_id === m.id) ||
             (mar.wife_id === memberId && mar.husband_id === m.id)
    );
    return !isAlreadyMarried;
  });

  // Fetch marriages when memberId changes
  useEffect(() => {
    if (memberId && authToken) {
      fetchMarriages();
    } else {
      setMarriages([]);
    }
  }, [memberId, authToken]);

  // Notify parent of changes
  useEffect(() => {
    onMarriagesChange?.(marriages);
  }, [marriages, onMarriagesChange]);

  const fetchMarriages = async () => {
    if (!memberId || !authToken) return;
    
    setLoading(true);
    try {
      const response = await supabase.functions.invoke("manage-family-member", {
        headers: { Authorization: `Bearer ${authToken}` },
        body: {
          action: "list_marriages",
          memberId,
        },
      });

      if (response.error) throw new Error(response.error.message);
      if (response.data?.error) throw new Error(response.data.error);
      
      setMarriages(response.data || []);
    } catch (error: any) {
      console.error("Error fetching marriages:", error);
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách hôn nhân",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddMarriage = async () => {
    if (!memberId || !authToken || !formData.spouse_id) return;

    setLoading(true);
    try {
      const marriageData = {
        husband_id: isMale ? memberId : formData.spouse_id,
        wife_id: isMale ? formData.spouse_id : memberId,
        marriage_order: formData.marriage_order,
        marriage_date: formData.marriage_date || null,
        divorce_date: formData.divorce_date || null,
        is_active: formData.is_active,
        notes: formData.notes || null,
      };

      const response = await supabase.functions.invoke("manage-family-member", {
        headers: { Authorization: `Bearer ${authToken}` },
        body: {
          action: "create_marriage",
          marriageData,
        },
      });

      if (response.error) throw new Error(response.error.message);
      if (response.data?.error) throw new Error(response.data.error);

      toast({ title: "Đã thêm hôn nhân!" });
      setShowAddForm(false);
      resetForm();
      fetchMarriages();
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

  const handleUpdateMarriage = async (marriageId: string) => {
    if (!authToken) return;

    setLoading(true);
    try {
      const response = await supabase.functions.invoke("manage-family-member", {
        headers: { Authorization: `Bearer ${authToken}` },
        body: {
          action: "update_marriage",
          marriageId,
          marriageData: {
            marriage_order: formData.marriage_order,
            marriage_date: formData.marriage_date || null,
            divorce_date: formData.divorce_date || null,
            is_active: formData.is_active,
            notes: formData.notes || null,
          },
        },
      });

      if (response.error) throw new Error(response.error.message);
      if (response.data?.error) throw new Error(response.data.error);

      toast({ title: "Đã cập nhật!" });
      setEditingId(null);
      resetForm();
      fetchMarriages();
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

  const handleDeleteMarriage = async (marriageId: string) => {
    if (!authToken) return;

    setLoading(true);
    try {
      const response = await supabase.functions.invoke("manage-family-member", {
        headers: { Authorization: `Bearer ${authToken}` },
        body: {
          action: "delete_marriage",
          marriageId,
        },
      });

      if (response.error) throw new Error(response.error.message);
      if (response.data?.error) throw new Error(response.data.error);

      toast({ title: "Đã xóa hôn nhân!" });
      setDeleteConfirmId(null);
      fetchMarriages();
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

  const startEditing = (marriage: Marriage) => {
    setFormData({
      spouse_id: isMale ? marriage.wife_id : marriage.husband_id,
      marriage_order: marriage.marriage_order,
      marriage_date: marriage.marriage_date || "",
      divorce_date: marriage.divorce_date || "",
      is_active: marriage.is_active,
      notes: marriage.notes || "",
    });
    setEditingId(marriage.id);
    setShowAddForm(false);
  };

  const resetForm = () => {
    setFormData({
      spouse_id: "",
      marriage_order: marriages.length + 1,
      marriage_date: "",
      divorce_date: "",
      is_active: true,
      notes: "",
    });
  };

  const getSpouseName = (marriage: Marriage): string => {
    const spouseId = isMale ? marriage.wife_id : marriage.husband_id;
    const spouse = allMembers.find(m => m.id === spouseId);
    return spouse?.full_name || "Không rõ";
  };

  // If no memberId, show message
  if (!memberId) {
    return (
      <div className="rounded-lg border border-dashed border-muted-foreground/30 p-4 text-center text-sm text-muted-foreground">
        Lưu thành viên trước để quản lý hôn nhân
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-base font-medium">
          {isMale ? "Vợ" : isFemale ? "Chồng" : "Vợ/Chồng"} 
          <span className="ml-1 text-sm text-muted-foreground">({marriages.length})</span>
        </Label>
        {!showAddForm && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              resetForm();
              setShowAddForm(true);
              setEditingId(null);
            }}
            disabled={loading || potentialSpouses.length === 0}
          >
            <Plus className="mr-1 h-3 w-3" />
            Thêm
          </Button>
        )}
      </div>

      {/* Existing marriages list */}
      {marriages.length > 0 && (
        <div className="space-y-2">
          {marriages.map((marriage) => (
            <Card key={marriage.id} className={`${!marriage.is_active ? 'opacity-60' : ''}`}>
              <CardContent className="p-3">
                {editingId === marriage.id ? (
                  // Edit mode
                  <div className="space-y-3">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1">
                        <Label className="text-xs">Thứ tự</Label>
                        <Input
                          type="number"
                          min={1}
                          max={10}
                          value={formData.marriage_order}
                          onChange={(e) => setFormData({ ...formData, marriage_order: parseInt(e.target.value) || 1 })}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Trạng thái</Label>
                        <Select
                          value={formData.is_active ? "active" : "inactive"}
                          onValueChange={(v) => setFormData({ ...formData, is_active: v === "active" })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Đang có hiệu lực</SelectItem>
                            <SelectItem value="inactive">Đã ly hôn</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Ngày cưới</Label>
                        <Input
                          type="date"
                          value={formData.marriage_date}
                          onChange={(e) => setFormData({ ...formData, marriage_date: e.target.value })}
                        />
                      </div>
                      {!formData.is_active && (
                        <div className="space-y-1">
                          <Label className="text-xs">Ngày ly hôn</Label>
                          <Input
                            type="date"
                            value={formData.divorce_date}
                            onChange={(e) => setFormData({ ...formData, divorce_date: e.target.value })}
                          />
                        </div>
                      )}
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingId(null);
                          resetForm();
                        }}
                      >
                        <X className="mr-1 h-3 w-3" />
                        Hủy
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => handleUpdateMarriage(marriage.id)}
                        disabled={loading}
                      >
                        <Check className="mr-1 h-3 w-3" />
                        Lưu
                      </Button>
                    </div>
                  </div>
                ) : (
                  // View mode
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {marriage.is_active ? (
                        <Heart className="h-4 w-4 text-pink-500" />
                      ) : (
                        <HeartOff className="h-4 w-4 text-muted-foreground" />
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{getSpouseName(marriage)}</span>
                          {isMale && (
                            <span className="text-xs px-1.5 py-0.5 rounded bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300">
                              {getWifeLabel(marriage.marriage_order)}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {marriage.marriage_date && `Cưới: ${marriage.marriage_date}`}
                          {!marriage.is_active && marriage.divorce_date && ` • Ly hôn: ${marriage.divorce_date}`}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => startEditing(marriage)}
                      >
                        <Edit2 className="h-3 w-3" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => setDeleteConfirmId(marriage.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add new marriage form */}
      {showAddForm && (
        <Card>
          <CardContent className="p-3 space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1 sm:col-span-2">
                <Label className="text-xs">{isMale ? "Chọn vợ" : isFemale ? "Chọn chồng" : "Chọn vợ/chồng"} *</Label>
                <Select
                  value={formData.spouse_id}
                  onValueChange={(v) => setFormData({ ...formData, spouse_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn..." />
                  </SelectTrigger>
                  <SelectContent>
                    {potentialSpouses.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.full_name} (Đời {m.generation})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {isMale && (
                <div className="space-y-1">
                  <Label className="text-xs">Thứ tự (1 = Vợ cả)</Label>
                  <Input
                    type="number"
                    min={1}
                    max={10}
                    value={formData.marriage_order}
                    onChange={(e) => setFormData({ ...formData, marriage_order: parseInt(e.target.value) || 1 })}
                  />
                </div>
              )}
              <div className="space-y-1">
                <Label className="text-xs">Ngày cưới</Label>
                <Input
                  type="date"
                  value={formData.marriage_date}
                  onChange={(e) => setFormData({ ...formData, marriage_date: e.target.value })}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowAddForm(false);
                  resetForm();
                }}
              >
                <X className="mr-1 h-3 w-3" />
                Hủy
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleAddMarriage}
                disabled={loading || !formData.spouse_id}
              >
                <Check className="mr-1 h-3 w-3" />
                Thêm
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {marriages.length === 0 && !showAddForm && (
        <div className="rounded-lg border border-dashed border-muted-foreground/30 p-4 text-center text-sm text-muted-foreground">
          Chưa có thông tin hôn nhân
        </div>
      )}

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa thông tin hôn nhân này? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirmId && handleDeleteMarriage(deleteConfirmId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
