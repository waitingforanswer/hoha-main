import { QRCodeSVG } from "qrcode.react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type FamilyMember = Tables<"family_members">;

interface MemberQRCodeProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: FamilyMember | null;
}

const MemberQRCode = ({ open, onOpenChange, member }: MemberQRCodeProps) => {
  if (!member) return null;

  const memberUrl = `${window.location.origin}/thanh-vien/${member.id}`;

  const handleDownload = () => {
    const svg = document.getElementById("qr-code-svg");
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL("image/png");
      
      const downloadLink = document.createElement("a");
      downloadLink.download = `qr-${member.full_name.replace(/\s+/g, "-")}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };

    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">Mã QR</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-6 py-4">
          <div className="rounded-lg bg-white p-4 shadow-md">
            <QRCodeSVG
              id="qr-code-svg"
              value={memberUrl}
              size={200}
              level="H"
              includeMargin
            />
          </div>

          <div className="text-center">
            <p className="font-medium">{member.full_name}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Quét mã QR để xem thông tin
            </p>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={handleDownload}>
              <Download className="mr-2 h-4 w-4" />
              Tải xuống
            </Button>
            <Button
              variant="outline"
              onClick={() => navigator.clipboard.writeText(memberUrl)}
            >
              Sao chép link
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MemberQRCode;
