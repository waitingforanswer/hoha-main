import { Link } from "react-router-dom";
import { Mail, Phone, MapPin, Heart } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface FooterContent {
  familyName?: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  quote?: string;
  text?: string;
  tagline?: string;
  links?: { label: string; href: string }[];
}

interface FooterSection {
  section_key: string;
  content: FooterContent;
  is_visible: boolean;
}

export function Footer() {
  const [sections, setSections] = useState<Record<string, FooterSection>>({});

  useEffect(() => {
    const fetchFooterSettings = async () => {
      const { data } = await supabase
        .from("footer_settings")
        .select("section_key, content, is_visible")
        .eq("is_visible", true);

      if (data) {
        const sectionsMap: Record<string, FooterSection> = {};
        data.forEach((section) => {
          sectionsMap[section.section_key] = {
            section_key: section.section_key,
            content: section.content as FooterContent,
            is_visible: section.is_visible,
          };
        });
        setSections(sectionsMap);
      }
    };

    fetchFooterSettings();
  }, []);

  const about = sections.about?.content || {};
  const contact = sections.contact?.content || {};
  const message = sections.message?.content || {};
  const copyright = sections.copyright?.content || {};
  const quickLinks = sections.quick_links?.content?.links || [];

  return (
    <footer className="border-t border-border bg-card">
      <div className="container py-12 md:py-16">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* About */}
          {sections.about?.is_visible !== false && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <img src="/logo-gia-pha.svg" alt="Logo Dòng Họ Hà Quang" className="h-10 w-10 rounded-full" />
                <div>
                  <h3 className="font-serif text-lg font-semibold">
                    {about.familyName || "Dòng Họ Hà"}
                  </h3>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                {about.description ||
                  "Website gia phả dòng họ - Nơi lưu giữ và kết nối các thế hệ trong gia đình, giúp con cháu nhớ về nguồn cội."}
              </p>
            </div>
          )}

          {/* Quick Links */}
          {sections.quick_links?.is_visible !== false && quickLinks.length > 0 && (
            <div className="space-y-4">
              <h4 className="font-serif text-lg font-semibold">Liên kết</h4>
              <nav className="flex flex-col gap-2">
                {quickLinks.map((link, index) => (
                  <Link
                    key={index}
                    to={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-primary"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>
          )}

          {/* Contact */}
          {sections.contact?.is_visible !== false && (
            <div className="space-y-4">
              <h4 className="font-serif text-lg font-semibold">Liên hệ</h4>
              <div className="space-y-3 text-sm text-muted-foreground">
                {contact.address && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    <span>{contact.address}</span>
                  </div>
                )}
                {contact.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-primary" />
                    <span>{contact.phone}</span>
                  </div>
                )}
                {contact.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-primary" />
                    <span>{contact.email}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Message */}
          {sections.message?.is_visible !== false && message.quote && (
            <div className="space-y-4">
              <h4 className="font-serif text-lg font-semibold">Thông điệp</h4>
              <blockquote className="border-l-2 border-primary pl-4 text-sm italic text-muted-foreground">
                "{message.quote}"
              </blockquote>
            </div>
          )}
        </div>
      </div>

      {/* Bottom */}
      <div className="border-t border-border">
        <div className="container flex flex-col items-center justify-between gap-4 py-6 md:flex-row">
          <p className="text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} {copyright.text || "Dòng Họ Hà. Bảo lưu mọi quyền."}
          </p>
          <p className="flex items-center gap-1 text-sm text-muted-foreground">
            {copyright.tagline || (
              <>
                Xây dựng với{" "}
                <Heart className="h-4 w-4 fill-primary text-primary" /> cho gia đình
              </>
            )}
          </p>
        </div>
      </div>
    </footer>
  );
}
