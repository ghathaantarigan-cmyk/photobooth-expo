"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { FRAMES, FrameConfig, FrameSlot } from "@/lib/framesConfig";

interface FrameSelectorProps {
  photos: string[];
  orientation?: "PORTRAIT" | "LANDSCAPE";
  onConfirm: (finalBlob: Blob) => void;
  onRetake: () => void;
}

export default function FrameSelector({
  photos,
  orientation = "LANDSCAPE",
  onConfirm,
  onRetake,
}: FrameSelectorProps) {
  // Filter daftar frame berdasarkan orientasi
  const filteredFrames = useMemo(() => {
    const list = FRAMES.filter((frame) => frame.orientation === orientation);
    return list.length > 0 ? list : FRAMES;
  }, [orientation]);

  const [selectedFrame, setSelectedFrame] = useState<FrameConfig>(
    filteredFrames[0] || FRAMES[0],
  );

  const [selectedPhotoIndices, setSelectedPhotoIndices] = useState<number[]>([
    0, 1, 2,
  ]);

  const [isRendering, setIsRendering] = useState(true);
  const [renderError, setRenderError] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderIdRef = useRef(0);

  // Otomatis sinkronkan frame ketika orientasi atau list frame berubah
  useEffect(() => {
    if (filteredFrames.length > 0) {
      const activeFrame = filteredFrames[0];
      setSelectedFrame(activeFrame);
      setSelectedPhotoIndices(
        Array.from(
          { length: activeFrame.slots.length },
          (_, i) => i % photos.length,
        ),
      );
    }
  }, [filteredFrames, photos.length]);

  const handleSelectFrame = (frame: FrameConfig) => {
    setSelectedFrame(frame);
    setSelectedPhotoIndices(
      Array.from({ length: frame.slots.length }, (_, i) => i % photos.length),
    );
  };

  const handleSwapSlotPhoto = (slotIndex: number, rawPhotoIndex: number) => {
    setSelectedPhotoIndices((previous) => {
      const updated = [...previous];
      updated[slotIndex] = rawPhotoIndex;
      return updated;
    });
  };

  const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      if (!src) {
        reject(new Error("Sumber gambar tidak tersedia"));
        return;
      }

      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error(`Gagal memuat gambar: ${src}`));
      image.src = src;
    });
  };

  const drawImageCover = (
    ctx: CanvasRenderingContext2D,
    image: HTMLImageElement,
    slot: FrameSlot,
  ) => {
    const imgWidth = image.naturalWidth;
    const imgHeight = image.naturalHeight;
    const { x, y, width, height } = slot;

    if (imgWidth <= 0 || imgHeight <= 0 || width <= 0 || height <= 0) return;

    const scale = Math.max(width / imgWidth, height / imgHeight);
    const sourceWidth = width / scale;
    const sourceHeight = height / scale;
    const sourceX = (imgWidth - sourceWidth) / 2;
    const sourceY = (imgHeight - sourceHeight) / 2;

    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, width, height);
    ctx.clip();

    ctx.drawImage(
      image,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      x,
      y,
      width,
      height,
    );

    ctx.restore();
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setRenderError("Browser tidak mendukung Canvas 2D.");
      setIsRendering(false);
      return;
    }

    let cancelled = false;
    const currentRenderId = ++renderIdRef.current;

    const renderCanvas = async () => {
      setIsRendering(true);
      setRenderError(null);

      try {
        const framePromise = loadImage(selectedFrame.image);

        const photoPromises = selectedFrame.slots.map((_, index) => {
          const photoIndex =
            selectedPhotoIndices[index] !== undefined
              ? selectedPhotoIndices[index]
              : index % photos.length;

          return loadImage(photos[photoIndex] || photos[0]);
        });

        const [frameImage, ...loadedPhotos] = await Promise.all([
          framePromise,
          ...photoPromises,
        ]);

        if (cancelled || currentRenderId !== renderIdRef.current) return;

        const frameWidth = frameImage.naturalWidth;
        const frameHeight = frameImage.naturalHeight;

        canvas.width = frameWidth;
        canvas.height = frameHeight;

        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, frameWidth, frameHeight);

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";

        // LAYER 1: FOTO HASIL JEPRETAN
        selectedFrame.slots.forEach((slot: FrameSlot, index: number) => {
          const photo = loadedPhotos[index];
          if (photo) {
            drawImageCover(ctx, photo, slot);
          }
        });

        // LAYER 2: FRAME PNG TRANSPARAN
        ctx.drawImage(frameImage, 0, 0, frameWidth, frameHeight);

        if (!cancelled && currentRenderId === renderIdRef.current) {
          setIsRendering(false);
        }
      } catch (error) {
        if (cancelled || currentRenderId !== renderIdRef.current) return;
        console.error("Gagal merender frame:", error);
        setRenderError("Gagal memuat foto atau bingkai.");
        setIsRendering(false);
      }
    };

    renderCanvas();

    return () => {
      cancelled = true;
      renderIdRef.current += 1;
    };
  }, [selectedFrame, selectedPhotoIndices, photos]);

  const handleGenerateFinalImage = () => {
    const canvas = canvasRef.current;
    if (!canvas || isRendering || renderError) return;

    canvas.toBlob((blob) => {
      if (blob) {
        onConfirm(blob);
      } else {
        setRenderError("Gagal membuat file PNG.");
      }
    }, "image/png");
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 lg:gap-10 items-center justify-center p-4 md:p-6 w-full max-w-7xl relative z-10 select-none font-sans pointer-events-auto my-auto">
      {/* CANVAS PREVIEW */}
      <div className="relative shadow-2xl rounded-3xl overflow-hidden border-4 border-slate-900 bg-white shrink-0 w-[280px] sm:w-[360px] md:w-[420px] aspect-[9/16]">
        <canvas ref={canvasRef} className="w-full h-full object-contain" />

        {isRendering && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-xs flex items-center justify-center">
            <span className="text-[#388D93] text-sm font-bold animate-pulse bg-white/90 px-4 py-2 rounded-full border border-slate-200 shadow-sm">
              Memproses Bingkai...
            </span>
          </div>
        )}

        {renderError && (
          <div className="absolute inset-0 bg-white/90 flex items-center justify-center p-6">
            <p className="text-red-600 text-sm font-bold text-center">
              {renderError}
            </p>
          </div>
        )}
      </div>

      {/* PANEL KONTROL */}
      <div className="flex flex-col justify-between gap-5 w-full max-w-lg bg-white/95 p-5 md:p-7 rounded-3xl border border-slate-200 shadow-xl relative z-20 pointer-events-auto">
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[#388D93] text-base md:text-lg font-extrabold tracking-wide">
              1. Pilih Jenis Frame
            </h3>

            <span className="text-[11px] text-slate-400 font-semibold bg-slate-100 px-2.5 py-1 rounded-full">
              {filteredFrames.length} Pilihan
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5 max-h-56 overflow-y-auto pr-1">
            {filteredFrames.map((frame: FrameConfig, index: number) => (
              <button
                key={frame.id}
                type="button"
                onClick={() => handleSelectFrame(frame)}
                className={`p-3 rounded-2xl border-2 text-xs font-bold transition-all duration-200 cursor-pointer active:scale-95 flex items-center justify-between ${
                  selectedFrame.id === frame.id
                    ? "bg-[#388D93] border-[#388D93] text-white shadow-md"
                    : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                }`}
              >
                <span>Frame {index + 1}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ATUR POSISI FOTO */}
        <div>
          <h3 className="text-[#388D93] text-base md:text-lg font-extrabold mb-3 tracking-wide">
            2. Atur Posisi Foto ({selectedFrame.slots.length} Slot)
          </h3>

          <div className="flex flex-col gap-3 bg-slate-50/90 p-3.5 md:p-4 rounded-2xl border border-slate-200/80">
            {selectedFrame.slots.map((_: FrameSlot, slotIdx: number) => (
              <div
                key={slotIdx}
                className="flex items-center justify-between gap-2"
              >
                <span className="text-slate-600 font-bold text-xs shrink-0 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                  Slot {slotIdx + 1}
                </span>

                <div className="flex gap-2">
                  {photos.map((photo: string, photoIndex: number) => {
                    const isSelected =
                      selectedPhotoIndices[slotIdx] === photoIndex;

                    return (
                      <button
                        key={photoIndex}
                        type="button"
                        onClick={() => handleSwapSlotPhoto(slotIdx, photoIndex)}
                        className={`relative rounded-xl overflow-hidden transition-all duration-200 active:scale-90 cursor-pointer border-2 ${
                          isSelected
                            ? "border-[#388D93] ring-2 ring-[#388D93]/30 shadow-md scale-105"
                            : "border-transparent opacity-40 hover:opacity-100"
                        }`}
                      >
                        <img
                          src={photo}
                          alt={`Foto ${photoIndex + 1}`}
                          className="w-11 h-11 md:w-13 md:h-13 object-cover"
                        />
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* TOMBOL UTAMA */}
        <div className="flex gap-3 mt-1">
          <button
            type="button"
            onClick={onRetake}
            className="w-1/2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3.5 rounded-2xl transition active:scale-95 cursor-pointer text-sm border border-slate-200"
          >
            Ulang Foto
          </button>

          <button
            type="button"
            onClick={handleGenerateFinalImage}
            disabled={isRendering || !!renderError}
            className="w-1/2 bg-[#388D93] hover:bg-[#2e7479] disabled:opacity-50 disabled:cursor-not-allowed text-white font-extrabold py-3.5 rounded-2xl shadow-lg transition active:scale-95 cursor-pointer text-sm"
          >
            {isRendering ? "Memproses..." : "Cetak QR Code"}
          </button>
        </div>
      </div>
    </div>
  );
}
