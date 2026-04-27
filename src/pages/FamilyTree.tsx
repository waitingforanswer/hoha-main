import { MainLayout } from "@/components/layout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, User, Loader2 } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FamilyTreeView } from "@/components/family-tree/FamilyTreeView";
import { useAppAuth } from "@/hooks/useAppAuth";
import { useAuth } from "@/hooks/useAuth";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export interface FamilyMember {
  id: string;
  full_name: string;
  avatar_url: string | null;
  birth_date: string | null;
  death_date: string | null;
  is_alive: boolean | null;
  address: string | null;
  gender: string | null;
  father_id: string | null;
  mother_id: string | null;
  generation: number;
  spouse_id: string | null;
  is_primary_lineage: boolean | null;
  lineage_type?: string | null;
  is_default_view?: boolean | null;
}

export interface FamilyMarriage {
  id: string;
  husband_id: string;
  wife_id: string;
  marriage_order: number;
  marriage_date: string | null;
  divorce_date: string | null;
  is_active: boolean;
  notes: string | null;
}

const FamilyTree = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const { session: appSession } = useAppAuth();
  const { session: supabaseSession } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["family-members", appSession?.token, supabaseSession?.access_token],
    queryFn: async () => {
      // Get authorization token - prefer app session, fallback to supabase session
      const token = appSession?.token || supabaseSession?.access_token;
      
      const response = await fetch(`${SUPABASE_URL}/functions/v1/get-family-members`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {}),
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to fetch family members");
      }

      const result = await response.json();
      
      // Handle both old format (array) and new format ({ members, marriages })
      if (Array.isArray(result)) {
        return { members: result as FamilyMember[], marriages: [] as FamilyMarriage[] };
      }
      
      return result as { members: FamilyMember[]; marriages: FamilyMarriage[] };
    },
  });

  const members = data?.members || [];
  const marriages = data?.marriages || [];

  const filteredMembers = members.filter(member =>
    member.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.address?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <MainLayout>
      <section className="bg-gradient-hero py-12 text-primary-foreground">
        <div className="container text-center">
          <h1 className="mb-4 font-serif text-3xl font-bold md:text-4xl">
            Cây Gia Phả
          </h1>
          <p className="opacity-90">Khám phá các thế hệ trong dòng họ</p>
        </div>
      </section>

      <section className="py-8">
        <div className="container">
          <div className="mx-auto mb-6 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm thành viên..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {isLoading ? (
            <Card className="mx-auto max-w-4xl">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="mt-4 text-muted-foreground">Đang tải dữ liệu...</p>
              </CardContent>
            </Card>
          ) : filteredMembers.length === 0 ? (
            <Card className="mx-auto max-w-4xl">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <div className="mb-4 rounded-full bg-muted p-6">
                  <User className="h-12 w-12 text-muted-foreground" />
                </div>
                <h3 className="mb-2 font-serif text-xl font-semibold">
                  {searchTerm ? "Không tìm thấy thành viên" : "Chưa có dữ liệu gia phả"}
                </h3>
                <p className="text-muted-foreground">
                  {searchTerm 
                    ? "Thử tìm kiếm với từ khóa khác." 
                    : "Admin cần thêm thành viên vào cây gia phả để hiển thị ở đây."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <FamilyTreeView members={filteredMembers} marriages={marriages} />
          )}
        </div>
      </section>
    </MainLayout>
  );
};

export default FamilyTree;
