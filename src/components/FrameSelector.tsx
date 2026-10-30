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
  const [selectedFrame, setSelectedFrame] = useState<FrameConfig>(FRAMES[1]); // Default 3 Photos
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
          ctx.drawImage(photoImg, slot.x, slot.y, slot.width, slot.height);
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
    <div className="flex flex-col md:flex-row gap-8 items-center justify-center p-6 w-full max-w-6xl">
      {/* Live Preview Canvas */}
      <div className="w-[300px] h-[533px] relative shadow-2xl rounded-xl overflow-hidden border-2 border-slate-700 bg-black">
        <canvas ref={canvasRef} className="w-full h-full object-contain" />
      </div>

      {/* Control Panel */}
      <div className="flex flex-col gap-6 w-full max-w-md">
        <div>
          <h3 className="text-white text-lg font-bold mb-2">
            1. Pilih Jenis Frame
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {FRAMES.map((frame: FrameConfig) => (
              <button
                key={frame.id}
                onClick={() => handleSelectFrame(frame)}
                className={`p-3 rounded-xl border text-sm font-bold transition ${
                  selectedFrame.id === frame.id
                    ? "bg-blue-600 border-blue-400 text-white"
                    : "bg-slate-800 border-slate-700 text-slate-300"
                }`}
              >
                {frame.name}
              </button>
            ))}
          </div>
        </div>

        {/* Pemilihan Foto untuk Frame 2 atau 3 */}
        {selectedFrame.photoCount < 4 && (
          <div>
            <h3 className="text-white text-lg font-bold mb-2">
              2. Pilih Foto Yang Dipakai
            </h3>
            <div className="flex flex-col gap-3">
              {selectedFrame.slots.map((_: FrameSlot, slotIdx: number) => (
                <div key={slotIdx} className="flex items-center gap-2">
                  <span className="text-slate-400 text-xs w-16">
                    Slot {slotIdx + 1}:
                  </span>
                  <div className="flex gap-2">
                    {photos.map((p: string, pIdx: number) => (
                      <img
                        key={pIdx}
                        src={p}
                        alt={`Photo ${pIdx + 1}`}
                        onClick={() => handleSwapSlotPhoto(slotIdx, pIdx)}
                        className={`w-12 h-12 rounded-lg object-cover cursor-pointer border-2 transition ${
                          selectedPhotoIndices[slotIdx] === pIdx
                            ? "border-emerald-500 scale-110"
                            : "border-transparent opacity-60"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-4 mt-4">
          <button
            onClick={onRetake}
            className="w-1/2 bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-xl"
          >
            Ulang Foto
          </button>
          <button
            onClick={handleGenerateFinalImage}
            className="w-1/2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-xl shadow-lg"
          >
            Cetak QR Code
          </button>
        </div>
      </div>
    </div>
  );
}
