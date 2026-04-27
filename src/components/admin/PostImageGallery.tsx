import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useImageUpload } from "@/hooks/useImageUpload";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Plus,
  X,
  GripVertical,
  Loader2,
  ImagePlus,
  Trash2,
} from "lucide-react";

interface PostImage {
  id: string;
  post_id: string;
  image_url: string;
  caption: string | null;
  sort_order: number;
  created_at: string;
}

interface PostImageGalleryProps {
  postId: string | null;
  images: PostImage[];
  onImagesChange: (images: PostImage[]) => void;
  tempImages: { url: string; caption: string }[];
  onTempImagesChange: (images: { url: string; caption: string }[]) => void;
}

export default function PostImageGallery({
  postId,
  images,
  onImagesChange,
  tempImages,
  onTempImagesChange,
}: PostImageGalleryProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const { uploading, progress, uploadImages, deleteImage } = useImageUpload({
    bucket: "post-images",
    folder: "gallery",
    maxSizeMB: 2,
    maxWidthOrHeight: 1920,
  });

  const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    const results = await uploadImages(fileArray);

    if (results.length > 0) {
      if (postId) {
        // If we have a postId, save to database
        const newImages = results.map((result, index) => ({
          post_id: postId,
          image_url: result.url,
          caption: null,
          sort_order: images.length + index,
        }));

        const { data, error } = await supabase
          .from("post_images")
          .insert(newImages)
          .select();

        if (error) {
          toast({
            title: "Lỗi",
            description: "Không thể lưu ảnh vào cơ sở dữ liệu",
            variant: "destructive",
          });
        } else if (data) {
          onImagesChange([...images, ...data]);
        }
      } else {
        // No postId yet (new post), store temporarily
        const newTempImages = results.map((result) => ({
          url: result.url,
          caption: "",
        }));
        onTempImagesChange([...tempImages, ...newTempImages]);
      }
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDeleteImage = async (image: PostImage) => {
    setDeletingId(image.id);
    try {
      // Delete from storage
      await deleteImage(image.image_url);

      // Delete from database
      const { error } = await supabase
        .from("post_images")
        .delete()
        .eq("id", image.id);

      if (error) throw error;

      // Update local state
      const updatedImages = images.filter((img) => img.id !== image.id);
      
      // Update sort_order for remaining images
      const reorderedImages = updatedImages.map((img, index) => ({
        ...img,
        sort_order: index,
      }));

      onImagesChange(reorderedImages);
      toast({ title: "Đã xóa ảnh" });
    } catch (error) {
      console.error("Delete error:", error);
      toast({
        title: "Lỗi",
        description: "Không thể xóa ảnh",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteTempImage = async (index: number) => {
    const imageToDelete = tempImages[index];
    await deleteImage(imageToDelete.url);
    const newTempImages = tempImages.filter((_, i) => i !== index);
    onTempImagesChange(newTempImages);
  };

  const handleCaptionChange = async (imageId: string, caption: string) => {
    // Update local state immediately
    const updatedImages = images.map((img) =>
      img.id === imageId ? { ...img, caption } : img
    );
    onImagesChange(updatedImages);

    // Debounced save to database
    try {
      await supabase
        .from("post_images")
        .update({ caption })
        .eq("id", imageId);
    } catch (error) {
      console.error("Caption update error:", error);
    }
  };

  const handleTempCaptionChange = (index: number, caption: string) => {
    const newTempImages = [...tempImages];
    newTempImages[index] = { ...newTempImages[index], caption };
    onTempImagesChange(newTempImages);
  };

  const moveImage = async (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= images.length) return;

    const reorderedImages = [...images];
    const [movedImage] = reorderedImages.splice(fromIndex, 1);
    reorderedImages.splice(toIndex, 0, movedImage);

    // Update sort_order
    const updatedImages = reorderedImages.map((img, index) => ({
      ...img,
      sort_order: index,
    }));

    onImagesChange(updatedImages);

    // Save to database
    try {
      for (const img of updatedImages) {
        await supabase
          .from("post_images")
          .update({ sort_order: img.sort_order })
          .eq("id", img.id);
      }
    } catch (error) {
      console.error("Reorder error:", error);
    }
  };

  const allImages = [
    ...images.map((img) => ({ type: "saved" as const, data: img })),
    ...tempImages.map((img, index) => ({ type: "temp" as const, data: img, index })),
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-medium">
          Thư viện ảnh ({allImages.length} ảnh)
        </Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Đang tải ({progress}%)
            </>
          ) : (
            <>
              <ImagePlus className="h-4 w-4 mr-2" />
              Thêm ảnh
            </>
          )}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.heic,.heif"
          multiple
          onChange={handleFilesSelected}
          className="hidden"
        />
      </div>

      {allImages.length === 0 ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors"
        >
          <ImagePlus className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">
            Click để thêm ảnh vào thư viện
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Hỗ trợ JPEG, PNG, HEIC • Tối đa 20MB/ảnh • Tự động nén
          </p>
        </div>
      ) : (
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex gap-4 pb-4">
            {allImages.map((item, idx) => (
              <Card
                key={item.type === "saved" ? item.data.id : `temp-${item.index}`}
                className="relative flex-shrink-0 w-48 overflow-hidden group"
              >
                <div className="aspect-square relative">
                  <img
                    src={item.type === "saved" ? item.data.image_url : item.data.url}
                    alt={item.type === "saved" ? item.data.caption || "" : item.data.caption}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Overlay with actions */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    {item.type === "saved" && (
                      <>
                        {idx > 0 && (
                          <Button
                            type="button"
                            size="icon"
                            variant="secondary"
                            className="h-8 w-8"
                            onClick={() => moveImage(idx, idx - 1)}
                          >
                            ←
                          </Button>
                        )}
                        {idx < images.length - 1 && (
                          <Button
                            type="button"
                            size="icon"
                            variant="secondary"
                            className="h-8 w-8"
                            onClick={() => moveImage(idx, idx + 1)}
                          >
                            →
                          </Button>
                        )}
                      </>
                    )}
                    <Button
                      type="button"
                      size="icon"
                      variant="destructive"
                      className="h-8 w-8"
                      onClick={() => {
                        if (item.type === "saved") {
                          handleDeleteImage(item.data);
                        } else {
                          handleDeleteTempImage(item.index!);
                        }
                      }}
                      disabled={item.type === "saved" && deletingId === item.data.id}
                    >
                      {item.type === "saved" && deletingId === item.data.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>

                  {/* Order badge */}
                  <div className="absolute top-2 left-2 bg-background/80 backdrop-blur-sm text-foreground text-xs font-medium px-2 py-1 rounded">
                    {idx + 1}
                  </div>
                </div>

                {/* Caption input */}
                <div className="p-2">
                  <Input
                    placeholder="Chú thích ảnh..."
                    value={
                      item.type === "saved"
                        ? item.data.caption || ""
                        : item.data.caption
                    }
                    onChange={(e) => {
                      if (item.type === "saved") {
                        handleCaptionChange(item.data.id, e.target.value);
                      } else {
                        handleTempCaptionChange(item.index!, e.target.value);
                      }
                    }}
                    className="text-xs h-8"
                  />
                </div>
              </Card>
            ))}

            {/* Add more button */}
            <Card
              onClick={() => fileInputRef.current?.click()}
              className="flex-shrink-0 w-48 aspect-square flex items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors border-dashed"
            >
              <div className="text-center">
                <Plus className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Thêm ảnh</p>
              </div>
            </Card>
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      )}
    </div>
  );
}
