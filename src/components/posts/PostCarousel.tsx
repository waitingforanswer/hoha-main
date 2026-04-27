import { useState, useCallback, useEffect } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
  type CarouselApi,
} from "@/components/ui/carousel";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, X, ZoomIn } from "lucide-react";

interface PostImage {
  id: string;
  image_url: string;
  caption: string | null;
  sort_order: number;
}

interface PostCarouselProps {
  images: PostImage[];
  className?: string;
}

export default function PostCarousel({ images, className = "" }: PostCarouselProps) {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Sort images by sort_order
  const sortedImages = [...images].sort((a, b) => a.sort_order - b.sort_order);

  useEffect(() => {
    if (!api) return;

    setCurrent(api.selectedScrollSnap());

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const navigateLightbox = (direction: "prev" | "next") => {
    if (direction === "prev") {
      setLightboxIndex((prev) => (prev > 0 ? prev - 1 : sortedImages.length - 1));
    } else {
      setLightboxIndex((prev) => (prev < sortedImages.length - 1 ? prev + 1 : 0));
    }
  };

  // Handle keyboard navigation in lightbox
  useEffect(() => {
    if (!lightboxOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") navigateLightbox("prev");
      if (e.key === "ArrowRight") navigateLightbox("next");
      if (e.key === "Escape") setLightboxOpen(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxOpen, sortedImages.length]);

  if (sortedImages.length === 0) return null;

  // Single image - no carousel needed
  if (sortedImages.length === 1) {
    return (
      <div className={`relative ${className}`}>
        <div
          className="aspect-[16/10] md:aspect-video rounded-xl md:rounded-2xl overflow-hidden cursor-zoom-in shadow-card"
          onClick={() => openLightbox(0)}
        >
          <img
            src={sortedImages[0].image_url}
            alt={sortedImages[0].caption || ""}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors flex items-center justify-center">
            <ZoomIn className="w-8 h-8 text-white opacity-0 hover:opacity-100 transition-opacity" />
          </div>
        </div>
        {sortedImages[0].caption && (
          <p className="text-center text-sm text-muted-foreground mt-3">
            {sortedImages[0].caption}
          </p>
        )}

        {/* Lightbox */}
        <LightboxDialog
          open={lightboxOpen}
          onOpenChange={setLightboxOpen}
          images={sortedImages}
          currentIndex={lightboxIndex}
          onNavigate={navigateLightbox}
        />
      </div>
    );
  }

  return (
    <div className={className}>
      <Carousel
        setApi={setApi}
        opts={{
          align: "start",
          loop: true,
        }}
        className="w-full"
      >
        <CarouselContent className="-ml-2 md:-ml-4">
          {sortedImages.map((image, index) => (
            <CarouselItem key={image.id} className="pl-2 md:pl-4 basis-full">
              <div
                className="aspect-[16/10] md:aspect-video rounded-xl md:rounded-2xl overflow-hidden cursor-zoom-in shadow-card relative group"
                onClick={() => openLightbox(index)}
              >
                <img
                  src={image.image_url}
                  alt={image.caption || ""}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                  <ZoomIn className="w-10 h-10 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                {image.caption && (
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                    <p className="text-white text-sm md:text-base">
                      {image.caption}
                    </p>
                  </div>
                )}
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>

        {/* Large navigation buttons for elderly users */}
        <CarouselPrevious className="left-2 md:left-4 h-12 w-12 md:h-14 md:w-14 border-2" />
        <CarouselNext className="right-2 md:right-4 h-12 w-12 md:h-14 md:w-14 border-2" />
      </Carousel>

      {/* Dots indicator */}
      <div className="flex justify-center gap-2 mt-4">
        {sortedImages.map((_, index) => (
          <button
            key={index}
            className={`h-2.5 rounded-full transition-all duration-300 ${
              index === current
                ? "w-8 bg-primary"
                : "w-2.5 bg-muted-foreground/30 hover:bg-muted-foreground/50"
            }`}
            onClick={() => api?.scrollTo(index)}
            aria-label={`Đến ảnh ${index + 1}`}
          />
        ))}
      </div>

      {/* Image count */}
      <p className="text-center text-sm text-muted-foreground mt-2">
        {current + 1} / {sortedImages.length}
      </p>

      {/* Lightbox */}
      <LightboxDialog
        open={lightboxOpen}
        onOpenChange={setLightboxOpen}
        images={sortedImages}
        currentIndex={lightboxIndex}
        onNavigate={navigateLightbox}
      />
    </div>
  );
}

// Lightbox component for fullscreen view
interface LightboxDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  images: PostImage[];
  currentIndex: number;
  onNavigate: (direction: "prev" | "next") => void;
}

function LightboxDialog({
  open,
  onOpenChange,
  images,
  currentIndex,
  onNavigate,
}: LightboxDialogProps) {
  const currentImage = images[currentIndex];

  if (!currentImage) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-black/95 border-0">
        <div className="relative w-full h-full flex items-center justify-center">
          {/* Close button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 z-50 text-white hover:bg-white/20 h-12 w-12"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-6 w-6" />
          </Button>

          {/* Navigation buttons */}
          {images.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-4 top-1/2 -translate-y-1/2 z-50 text-white hover:bg-white/20 h-14 w-14"
                onClick={() => onNavigate("prev")}
              >
                <ChevronLeft className="h-8 w-8" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 top-1/2 -translate-y-1/2 z-50 text-white hover:bg-white/20 h-14 w-14"
                onClick={() => onNavigate("next")}
              >
                <ChevronRight className="h-8 w-8" />
              </Button>
            </>
          )}

          {/* Image */}
          <div className="flex flex-col items-center justify-center max-w-full max-h-full p-4">
            <img
              src={currentImage.image_url}
              alt={currentImage.caption || ""}
              className="max-w-full max-h-[80vh] object-contain"
            />
            {currentImage.caption && (
              <p className="text-white text-center text-lg mt-4 max-w-2xl">
                {currentImage.caption}
              </p>
            )}
            {images.length > 1 && (
              <p className="text-white/60 text-sm mt-2">
                {currentIndex + 1} / {images.length}
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
