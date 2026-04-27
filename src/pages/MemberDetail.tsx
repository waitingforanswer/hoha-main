import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { MainLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  User,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Briefcase,
  Users,
  ArrowLeft,
} from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";
import { useAppAuth } from "@/hooks/useAppAuth";
import { useAuth } from "@/hooks/useAuth";

type FamilyMember = Tables<"family_members">;

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

const MemberDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [member, setMember] = useState<FamilyMember | null>(null);
  const [father, setFather] = useState<FamilyMember | null>(null);
  const [mother, setMother] = useState<FamilyMember | null>(null);
  const [children, setChildren] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  
  const { session: appSession } = useAppAuth();
  const { session: supabaseSession } = useAuth();

  useEffect(() => {
    const fetchMember = async () => {
      if (!id) return;

      setLoading(true);

      try {
        // Get authorization token - prefer app session, fallback to supabase session
        const token = appSession?.token || supabaseSession?.access_token;

        const response = await fetch(`${SUPABASE_URL}/functions/v1/get-family-member`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { "Authorization": `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ memberId: id }),
        });

        if (!response.ok) {
          console.error("Failed to fetch member");
          setMember(null);
          setLoading(false);
          return;
        }

        const data = await response.json();
        setMember(data.member);
        setFather(data.father);
        setMother(data.mother);
        setChildren(data.children || []);
      } catch (error) {
        console.error("Error fetching member:", error);
        setMember(null);
      }

      setLoading(false);
    };

    fetchMember();
  }, [id, appSession?.token, supabaseSession?.access_token]);

  if (loading) {
    return (
      <MainLayout>
        <div className="flex min-h-[50vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </MainLayout>
    );
  }

  if (!member) {
    return (
      <MainLayout>
        <div className="container py-16 text-center">
          <User className="mx-auto h-16 w-16 text-muted-foreground" />
          <h1 className="mt-4 font-serif text-2xl font-bold">
            Không tìm thấy thành viên
          </h1>
          <p className="mt-2 text-muted-foreground">
            Thành viên này không tồn tại hoặc đã bị xóa.
          </p>
          <Button asChild className="mt-6">
            <Link to="/cay-gia-pha">Về trang gia phả</Link>
          </Button>
        </div>
      </MainLayout>
    );
  }

  const formatDate = (date: string | null) => {
    if (!date) return null;
    return new Date(date).toLocaleDateString("vi-VN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <MainLayout>
      <div className="container py-8">
        <Button variant="ghost" asChild className="mb-6">
          <Link to="/cay-gia-pha">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Quay lại
          </Link>
        </Button>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main info */}
          <div className="lg:col-span-2">
            <Card className="shadow-elegant">
              <CardContent className="p-6 sm:p-8">
                <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
                  {/* Avatar */}
                  <div className="h-32 w-32 flex-shrink-0 overflow-hidden rounded-full border-4 border-primary/20 bg-muted">
                    {member.avatar_url ? (
                      <img
                        src={member.avatar_url}
                        alt={member.full_name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <User className="h-16 w-16 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  {/* Basic info */}
                  <div className="flex-1 text-center sm:text-left">
                    <h1 className="font-serif text-3xl font-bold">
                      {member.full_name}
                    </h1>
                    <p className="mt-1 text-lg text-primary">
                      Đời thứ {member.generation}
                    </p>
                    <div className="mt-4 flex flex-wrap justify-center gap-3 sm:justify-start">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${
                          member.is_alive
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {member.is_alive ? "Còn sống" : "Đã mất"}
                      </span>
                      {member.gender && (
                        <span className="inline-flex rounded-full bg-muted px-3 py-1 text-sm font-medium">
                          {member.gender === "male" ? "Nam" : "Nữ"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Details */}
                <div className="mt-8 grid gap-4 sm:grid-cols-2">
                  {member.birth_date && (
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Ngày sinh
                        </p>
                        <p className="font-medium">
                          {formatDate(member.birth_date)}
                        </p>
                      </div>
                    </div>
                  )}

                  {!member.is_alive && member.death_date && (
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Ngày mất
                        </p>
                        <p className="font-medium">
                          {formatDate(member.death_date)}
                        </p>
                      </div>
                    </div>
                  )}

                  {member.occupation && (
                    <div className="flex items-center gap-3">
                      <Briefcase className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Nghề nghiệp
                        </p>
                        <p className="font-medium">{member.occupation}</p>
                      </div>
                    </div>
                  )}

                  {member.address && (
                    <div className="flex items-center gap-3">
                      <MapPin className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-sm text-muted-foreground">Địa chỉ</p>
                        <p className="font-medium">{member.address}</p>
                      </div>
                    </div>
                  )}

                  {member.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Điện thoại
                        </p>
                        <p className="font-medium">{member.phone}</p>
                      </div>
                    </div>
                  )}

                  {member.email && (
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-sm text-muted-foreground">Email</p>
                        <p className="font-medium">{member.email}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Bio */}
                {member.bio && (
                  <div className="mt-8">
                    <h2 className="font-serif text-xl font-semibold">
                      Tiểu sử
                    </h2>
                    <p className="mt-3 leading-relaxed text-muted-foreground">
                      {member.bio}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Family relations */}
          <div className="space-y-6">
            {/* Parents */}
            {(father || mother) && (
              <Card className="shadow-elegant">
                <CardContent className="p-6">
                  <h2 className="mb-4 flex items-center gap-2 font-serif text-lg font-semibold">
                    <Users className="h-5 w-5 text-primary" />
                    Cha mẹ
                  </h2>
                  <div className="space-y-3">
                    {father && (
                      <Link
                        to={`/thanh-vien/${father.id}`}
                        className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-muted"
                      >
                        <div className="h-10 w-10 overflow-hidden rounded-full bg-muted">
                          {father.avatar_url ? (
                            <img
                              src={father.avatar_url}
                              alt={father.full_name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center">
                              <User className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{father.full_name}</p>
                          <p className="text-xs text-muted-foreground">Bố</p>
                        </div>
                      </Link>
                    )}
                    {mother && (
                      <Link
                        to={`/thanh-vien/${mother.id}`}
                        className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-muted"
                      >
                        <div className="h-10 w-10 overflow-hidden rounded-full bg-muted">
                          {mother.avatar_url ? (
                            <img
                              src={mother.avatar_url}
                              alt={mother.full_name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center">
                              <User className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{mother.full_name}</p>
                          <p className="text-xs text-muted-foreground">Mẹ</p>
                        </div>
                      </Link>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Children */}
            {children.length > 0 && (
              <Card className="shadow-elegant">
                <CardContent className="p-6">
                  <h2 className="mb-4 flex items-center gap-2 font-serif text-lg font-semibold">
                    <Users className="h-5 w-5 text-primary" />
                    Con ({children.length})
                  </h2>
                  <div className="space-y-3">
                    {children.map((child) => (
                      <Link
                        key={child.id}
                        to={`/thanh-vien/${child.id}`}
                        className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-muted"
                      >
                        <div className="h-10 w-10 overflow-hidden rounded-full bg-muted">
                          {child.avatar_url ? (
                            <img
                              src={child.avatar_url}
                              alt={child.full_name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center">
                              <User className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{child.full_name}</p>
                          <p className="text-xs text-muted-foreground">
                            Đời {child.generation}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default MemberDetail;
