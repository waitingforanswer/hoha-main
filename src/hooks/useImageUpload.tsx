import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import imageCompression from "browser-image-compression";

interface UploadOptions {
  bucket: string;
  folder?: string;
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
}

interface UploadResult {
  url: string;
  path: string;
}

interface UseImageUploadReturn {
  uploading: boolean;
  progress: number;
  uploadImage: (file: File) => Promise<UploadResult | null>;
  uploadImages: (files: File[]) => Promise<UploadResult[]>;
  deleteImage: (url: string) => Promise<boolean>;
}

const isHEIC = (file: File): boolean => {
  return (
    file.type === "image/heic" ||
    file.type === "image/heif" ||
    file.name.toLowerCase().endsWith(".heic") ||
    file.name.toLowerCase().endsWith(".heif")
  );
};

const convertHEICtoJPEG = async (file: File): Promise<File> => {
  try {
    // Dynamically import heic2any to avoid issues if not needed
    const heic2any = (await import("heic2any")).default;
    const blob = await heic2any({
      blob: file,
      toType: "image/jpeg",
      quality: 0.9,
    });

    // heic2any can return array or single blob
    const resultBlob = Array.isArray(blob) ? blob[0] : blob;

    // Create new file with .jpg extension
    const newFileName = file.name.replace(/\.(heic|heif)$/i, ".jpg");
    return new File([resultBlob], newFileName, { type: "image/jpeg" });
  } catch (error) {
    console.error("HEIC conversion failed:", error);
    throw new Error("Không thể chuyển đổi định dạng HEIC. Vui lòng chuyển ảnh sang JPEG trước khi tải lên.");
  }
};

const compressImage = async (
  file: File,
  maxSizeMB: number = 2,
  maxWidthOrHeight: number = 1920
): Promise<File> => {
  // Skip compression for small files (< 500KB) and non-compressible formats
  if (file.size < 500 * 1024) {
    return file;
  }

  const options = {
    maxSizeMB,
    maxWidthOrHeight,
    useWebWorker: true,
    preserveExif: true,
    fileType: file.type.startsWith("image/png") ? ("image/png" as const) : ("image/jpeg" as const),
  };

  try {
    const compressedFile = await imageCompression(file, options);
    console.log(
      `Image compressed: ${(file.size / 1024 / 1024).toFixed(2)}MB → ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`
    );
    return new File([compressedFile], file.name, { type: compressedFile.type });
  } catch (error) {
    console.error("Compression failed, using original:", error);
    return file;
  }
};

export function useImageUpload(options: UploadOptions): UseImageUploadReturn {
  const { bucket, folder = "", maxSizeMB = 2, maxWidthOrHeight = 1920 } = options;
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const processAndUpload = async (file: File): Promise<UploadResult | null> => {
    try {
      let processedFile = file;

      // Convert HEIC to JPEG
      if (isHEIC(file)) {
        toast({ title: "Đang chuyển đổi định dạng HEIC..." });
        processedFile = await convertHEICtoJPEG(file);
      }

      // Validate file type after conversion
      if (!processedFile.type.startsWith("image/")) {
        toast({
          title: "Lỗi",
          description: "Vui lòng chọn file hình ảnh",
          variant: "destructive",
        });
        return null;
      }

      // Check file size (max 20MB before compression)
      if (processedFile.size > 20 * 1024 * 1024) {
        toast({
          title: "Lỗi",
          description: "Kích thước file không được vượt quá 20MB",
          variant: "destructive",
        });
        return null;
      }

      // Compress image
      processedFile = await compressImage(processedFile, maxSizeMB, maxWidthOrHeight);

      // Generate unique filename
      const fileExt = processedFile.name.split(".").pop()?.toLowerCase() || "jpg";
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = folder ? `${folder}/${fileName}` : fileName;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, processedFile);

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);

      return {
        url: data.publicUrl,
        path: filePath,
      };
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({
        title: "Lỗi tải ảnh",
        description: error.message || "Không thể tải ảnh lên",
        variant: "destructive",
      });
      return null;
    }
  };

  const uploadImage = useCallback(
    async (file: File): Promise<UploadResult | null> => {
      setUploading(true);
      setProgress(0);

      try {
        const result = await processAndUpload(file);
        setProgress(100);
        return result;
      } finally {
        setUploading(false);
      }
    },
    [bucket, folder, maxSizeMB, maxWidthOrHeight]
  );

  const uploadImages = useCallback(
    async (files: File[]): Promise<UploadResult[]> => {
      setUploading(true);
      setProgress(0);

      const results: UploadResult[] = [];
      const total = files.length;

      try {
        for (let i = 0; i < files.length; i++) {
          const result = await processAndUpload(files[i]);
          if (result) {
            results.push(result);
          }
          setProgress(Math.round(((i + 1) / total) * 100));
        }

        if (results.length > 0) {
          toast({
            title: `Đã tải lên ${results.length}/${total} ảnh`,
          });
        }

        return results;
      } finally {
        setUploading(false);
      }
    },
    [bucket, folder, maxSizeMB, maxWidthOrHeight]
  );

  const deleteImage = useCallback(
    async (url: string): Promise<boolean> => {
      try {
        // Extract file path from URL
        const urlObj = new URL(url);
        const pathMatch = urlObj.pathname.match(new RegExp(`/${bucket}/(.+)$`));

        if (pathMatch) {
          const { error } = await supabase.storage.from(bucket).remove([pathMatch[1]]);
          if (error) throw error;
          return true;
        }
        return false;
      } catch (error) {
        console.error("Delete image error:", error);
        return false;
      }
    },
    [bucket]
  );

  return {
    uploading,
    progress,
    uploadImage,
    uploadImages,
    deleteImage,
  };
}
