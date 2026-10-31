"use client";

import { useState, useRef, useEffect } from "react";
import { FRAMES, FrameConfig, FrameSlot } from "@/lib/framesConfig";

interface FrameSelectorProps {
  photos: string[];
  onConfirm: (finalBlob: Blob) => void;
  onRetake: () => void;
}

export default function FrameSelector({
  photos,
  onConfirm,
  onRetake,
}: FrameSelectorProps) {
  const [selectedFrame, setSelectedFrame] = useState<FrameConfig>(FRAMES[0]);
  const [selectedPhotoIndices, setSelectedPhotoIndices] = useState<number[]>([
    0, 1, 2,
  ]);
  const [isRendering, setIsRendering] = useState<boolean>(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleSelectFrame = (frame: FrameConfig) => {
    setSelectedFrame(frame);
    if (frame.photoCount === 3) {
      setSelectedPhotoIndices([0, 1, 2]);
    } else {
      setSelectedPhotoIndices([0, 1]);
    }
  };

  const handleSwapSlotPhoto = (slotIndex: number, rawPhotoIndex: number) => {
    const updated = [...selectedPhotoIndices];
    updated[slotIndex] = rawPhotoIndex;
    setSelectedPhotoIndices(updated);
  };

  const drawImageCover = (
    ctx: CanvasRenderingContext2D,
    img: HTMLImageElement,
    x: number,
    y: number,
    w: number,
    h: number,
  ) => {
    const imgRatio = img.width / img.height;
    const slotRatio = w / h;

    let sx = 0;
    let sy = 0;
    let sw = img.width;
    let sh = img.height;

    if (imgRatio > slotRatio) {
      sw = img.height * slotRatio;
      sx = (img.width - sw) / 2;
    } else {
      sh = img.width / slotRatio;
      sy = (img.height - sh) / 2;
    }

    ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = 1080;
    canvas.height = 1920;

    let isMounted = true;
    setIsRendering(true);

    const renderCanvas = async () => {
      // Clear background putih
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Load Foto
      const photoPromises = selectedFrame.slots.map((_, index) => {
        return new Promise<HTMLImageElement>((resolve) => {
          const img = new Image();
          const photoSrcIndex = selectedPhotoIndices[index] ?? index;
          img.src = photos[photoSrcIndex];
          img.onload = () => resolve(img);
          img.onerror = () => resolve(img);
        });
      });

      // Load Frame PNG
      const framePromise = new Promise<HTMLImageElement>((resolve) => {
        const img = new Image();
        img.src = selectedFrame.image;
        img.onload = () => resolve(img);
        img.onerror = () => resolve(img);
      });

      const loadedPhotos = await Promise.all(photoPromises);
      const loadedFrame = await framePromise;

      if (!isMounted) return;

      // 1. Gambar Foto di Slot
      selectedFrame.slots.forEach((slot: FrameSlot, index: number) => {
        const photoImg = loadedPhotos[index];
        if (photoImg && photoImg.width > 0) {
          drawImageCover(
            ctx,
            photoImg,
            slot.x,
            slot.y,
            slot.width,
            slot.height,
          );
        }
      });

      // 2. Gambar Frame PNG di atas Foto
      if (loadedFrame && loadedFrame.width > 0) {
        ctx.drawImage(loadedFrame, 0, 0, canvas.width, canvas.height);
      }

      setIsRendering(false);
    };

    renderCanvas();

    return () => {
      isMounted = false;
    };
  }, [selectedFrame, selectedPhotoIndices, photos]);

  const handleGenerateFinalImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.toBlob((blob) => {
      if (blob) onConfirm(blob);
    }, "image/png");
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 lg:gap-10 items-center justify-center p-4 md:p-6 w-full max-w-7xl relative z-10 select-none font-sans pointer-events-auto my-auto">
      {/* CANVAS PREVIEW (Responsif untuk HP & Desktop) */}
      <div className="w-[280px] sm:w-[360px] md:w-[420px] aspect-[9/16] relative shadow-2xl rounded-3xl overflow-hidden border-4 border-slate-900 bg-white shrink-0 group">
        <canvas ref={canvasRef} className="w-full h-full object-contain" />

        {/* Loading Indicator saat render frame */}
        {isRendering && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-xs flex items-center justify-center">
            <span className="text-[#388D93] text-sm font-bold animate-pulse bg-white/90 px-4 py-2 rounded-full border border-slate-200 shadow-sm">
              Memproses Bingkai...
            </span>
          </div>
        )}
      </div>

      {/* PANEL KENDALI INTERAKTIF */}
      <div className="flex flex-col justify-between gap-5 w-full max-w-lg bg-white/95 p-5 md:p-7 rounded-3xl border border-slate-200 shadow-xl relative z-20 pointer-events-auto">
        {/* 1. Pilih Jenis Frame */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[#388D93] text-base md:text-lg font-extrabold tracking-wide">
              1. Pilih Jenis Frame
            </h3>
            <span className="text-[11px] text-slate-400 font-semibold bg-slate-100 px-2.5 py-1 rounded-full">
              {FRAMES.length} Pilihan
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {FRAMES.map((frame: FrameConfig) => (
              <button
                key={frame.id}
                type="button"
                onClick={() => handleSelectFrame(frame)}
                className={`p-3 md:p-3.5 rounded-2xl border-2 text-xs md:text-sm font-bold transition-all duration-200 cursor-pointer active:scale-95 flex items-center justify-between ${
                  selectedFrame.id === frame.id
                    ? "bg-[#388D93] border-[#388D93] text-white shadow-md ring-2 ring-[#388D93]/30"
                    : "bg-slate-50 border-slate-200/90 text-slate-700 hover:bg-slate-100"
                }`}
              >
                <span>{frame.name}</span>
                {selectedFrame.id === frame.id && (
                  <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* 2. Atur Posisi Foto */}
        <div>
          <h3 className="text-[#388D93] text-base md:text-lg font-extrabold mb-3 tracking-wide">
            2. Atur Posisi Foto
          </h3>
          <div className="flex flex-col gap-3 bg-slate-50/90 p-3.5 md:p-4 rounded-2xl border border-slate-200/80">
            {selectedFrame.slots.map((_: FrameSlot, slotIdx: number) => (
              <div
                key={slotIdx}
                className="flex items-center justify-between gap-2"
              >
                <span className="text-slate-600 font-bold text-xs shrink-0 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
                  Slot {slotIdx + 1}
                </span>

                <div className="flex gap-2">
                  {photos.map((p: string, pIdx: number) => {
                    const isSelected = selectedPhotoIndices[slotIdx] === pIdx;
                    return (
                      <button
                        key={pIdx}
                        type="button"
                        onClick={() => handleSwapSlotPhoto(slotIdx, pIdx)}
                        className={`relative rounded-xl overflow-hidden transition-all duration-200 active:scale-90 cursor-pointer border-2 ${
                          isSelected
                            ? "border-[#388D93] ring-2 ring-[#388D93]/30 shadow-md scale-105"
                            : "border-transparent opacity-40 hover:opacity-100"
                        }`}
                      >
                        <img
                          src={p}
                          alt={`Foto ${pIdx + 1}`}
                          className="w-11 h-11 md:w-13 md:h-13 object-cover"
                        />
                        {isSelected && (
                          <div className="absolute inset-0 bg-[#388D93]/20 flex items-center justify-center">
                            <span className="w-2 h-2 rounded-full bg-white shadow-xs" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mt-1">
          <button
            type="button"
            onClick={onRetake}
            className="w-1/2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3.5 rounded-2xl transition-all duration-150 active:scale-95 cursor-pointer text-sm md:text-base border border-slate-200"
          >
            Ulang Foto
          </button>
          <button
            type="button"
            onClick={handleGenerateFinalImage}
            className="w-1/2 bg-[#388D93] hover:bg-[#2e7479] text-white font-extrabold py-3.5 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-150 active:scale-95 cursor-pointer text-sm md:text-base border border-white/20"
          >
            Cetak QR Code
          </button>
        </div>
      </div>
    </div>
  );
}
