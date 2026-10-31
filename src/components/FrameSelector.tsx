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
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleSelectFrame = (frame: FrameConfig) => {
    setSelectedFrame(frame);
    if (frame.photoCount === 4) {
      setSelectedPhotoIndices([0, 1, 2, 3]);
    } else if (frame.photoCount === 3) {
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

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const frameImg = new Image();
    frameImg.src = selectedFrame.image;

    frameImg.onload = () => {
      let loadedCount = 0;
      const totalSlots = selectedFrame.slots.length;

      selectedFrame.slots.forEach((slot: FrameSlot, index: number) => {
        const photoImg = new Image();
        const photoSrcIndex = selectedPhotoIndices[index] ?? index;
        photoImg.src = photos[photoSrcIndex];

        photoImg.onload = () => {
          drawImageCover(
            ctx,
            photoImg,
            slot.x,
            slot.y,
            slot.width,
            slot.height,
          );
          loadedCount++;

          if (loadedCount === totalSlots) {
            ctx.drawImage(frameImg, 0, 0, canvas.width, canvas.height);
          }
        };
      });
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
    <div className="flex flex-col lg:flex-row gap-8 items-center justify-center p-4 md:p-6 w-full max-w-7xl relative z-10 select-none font-sans pointer-events-auto my-auto">
      {/* PREVIEW CANVAS HITAM (UKURAN DIPERBESAR KONSISTEN DENGAN KAMERA) */}
      <div className="w-[360px] sm:w-[420px] md:w-[460px] aspect-[9/16] relative shadow-2xl rounded-3xl overflow-hidden border-4 border-slate-900 bg-black shrink-0">
        <canvas ref={canvasRef} className="w-full h-full object-contain" />
      </div>

      {/* PANEL KENDALI KANAN */}
      <div className="flex flex-col justify-between gap-6 w-full max-w-lg bg-white/95 p-6 md:p-8 rounded-3xl border border-slate-200 shadow-xl relative z-20 pointer-events-auto">
        <div>
          <h3 className="text-[#388D93] text-lg font-bold mb-3 tracking-wide">
            1. Pilih Jenis Frame
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {FRAMES.map((frame: FrameConfig) => (
              <button
                key={frame.id}
                type="button"
                onClick={() => handleSelectFrame(frame)}
                className={`p-3.5 rounded-xl border-2 text-xs md:text-sm font-bold transition cursor-pointer active:scale-95 ${
                  selectedFrame.id === frame.id
                    ? "bg-[#388D93] border-[#388D93] text-white shadow-md"
                    : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                }`}
              >
                {frame.name}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-[#388D93] text-lg font-bold mb-3 tracking-wide">
            2. Atur Posisi Foto
          </h3>
          <div className="flex flex-col gap-3.5 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            {selectedFrame.slots.map((_: FrameSlot, slotIdx: number) => (
              <div key={slotIdx} className="flex items-center gap-3">
                <span className="text-slate-500 font-semibold text-xs w-16">
                  Slot {slotIdx + 1}:
                </span>
                <div className="flex gap-2.5">
                  {photos.map((p: string, pIdx: number) => (
                    <img
                      key={pIdx}
                      src={p}
                      alt={`Photo ${pIdx + 1}`}
                      onClick={() => handleSwapSlotPhoto(slotIdx, pIdx)}
                      className={`w-12 h-12 md:w-14 md:h-14 rounded-xl object-cover cursor-pointer border-3 transition transform ${
                        selectedPhotoIndices[slotIdx] === pIdx
                          ? "border-[#388D93] scale-105 shadow-md"
                          : "border-transparent opacity-50 hover:opacity-100"
                      }`}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-4 mt-2">
          <button
            type="button"
            onClick={onRetake}
            className="w-1/2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold py-4 rounded-2xl transition active:scale-95 cursor-pointer text-base"
          >
            Ulang Foto
          </button>
          <button
            type="button"
            onClick={handleGenerateFinalImage}
            className="w-1/2 bg-[#388D93] hover:bg-[#2e7479] text-white font-extrabold py-4 rounded-2xl shadow-lg transition active:scale-95 cursor-pointer text-base"
          >
            Cetak QR Code
          </button>
        </div>
      </div>
    </div>
  );
}
