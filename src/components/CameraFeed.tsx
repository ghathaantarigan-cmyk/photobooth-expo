"use client";

import { useState, useRef, useEffect } from "react";

interface CameraFeedProps {
  onCaptureComplete: (photos: string[]) => void;
}

export default function CameraFeed({ onCaptureComplete }: CameraFeedProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [capturedPhotos, setCapturedPhotos] = useState<string[]>([]);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [timerDuration, setTimerDuration] = useState<number>(3);
  const [isShooting, setIsShooting] = useState<boolean>(false);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);

  useEffect(() => {
    async function setupCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 1280, height: 720 },
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Gagal mengakses kamera:", err);
      }
    }
    setupCamera();

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const playBeep = () => {
    try {
      const ctx = new (
        window.AudioContext || (window as any).webkitAudioContext
      )();
      const osc = ctx.createOscillator();
      osc.connect(ctx.destination);
      osc.frequency.value = 800;
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch (e) {}
  };

  const grabFrame = (): string | null => {
    const video = videoRef.current;
    if (!video) return null;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    return canvas.toDataURL("image/png");
  };

  const runCountdown = (duration: number): Promise<void> => {
    return new Promise((resolve) => {
      let count = duration;
      setCountdown(count);
      playBeep();

      const timer = setInterval(() => {
        count -= 1;
        if (count > 0) {
          setCountdown(count);
          playBeep();
        } else {
          clearInterval(timer);
          setCountdown(null);
          resolve();
        }
      }, 1000);
    });
  };

  const startFullSequence = async () => {
    setIsShooting(true);
    const newPhotos: string[] = [];
    setCapturedPhotos([]);

    for (let i = 0; i < 3; i++) {
      await runCountdown(timerDuration);
      const photoData = grabFrame();
      if (photoData) {
        newPhotos.push(photoData);
        setCapturedPhotos([...newPhotos]);
      }
      if (i < 2) {
        await new Promise((res) => setTimeout(res, 1200));
      }
    }

    setIsShooting(false);
  };

  const retakeSinglePhoto = async (index: number) => {
    setPreviewIndex(null);
    setIsShooting(true);

    await runCountdown(timerDuration);
    const photoData = grabFrame();

    if (photoData) {
      setCapturedPhotos((prev) => {
        const updated = [...prev];
        updated[index] = photoData;
        return updated;
      });
    }

    setIsShooting(false);
  };

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-7xl p-2 sm:p-4 relative z-10 font-sans select-none my-auto">
      <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 md:gap-8 items-center justify-center w-full">
        {/* KAMERA UTAMA */}
        <div className="flex flex-col items-center w-full max-w-3xl shrink-0">
          <div className="relative w-full aspect-[16/9] bg-black rounded-3xl overflow-hidden shadow-2xl border-4 border-white">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover transform -scale-x-100"
            />

            {/* Countdown Overlay (Tanpa Blur) */}
            {countdown !== null && (
              <div className="absolute inset-0 bg-black/30 flex flex-col items-center justify-center z-20 pointer-events-none">
                <span className="text-white text-7xl sm:text-8xl md:text-9xl font-black animate-ping drop-shadow-lg">
                  {countdown}
                </span>
                <span className="text-white text-sm sm:text-lg font-bold mt-2 tracking-widest uppercase drop-shadow-md">
                  Bersiap!
                </span>
              </div>
            )}
          </div>

          {/* Panel Kontrol di Bawah Kamera */}
          <div className="flex flex-col sm:flex-row items-center justify-between w-full mt-3 sm:mt-4 gap-3 bg-white/90 p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-md">
            {/* Opsi Timer 3 & 5 Detik */}
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-bold text-[#388D93]">
                Timer:
              </span>
              {[3, 5].map((sec) => (
                <button
                  key={sec}
                  type="button"
                  disabled={isShooting}
                  onClick={() => setTimerDuration(sec)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all duration-150 cursor-pointer active:scale-95 ${
                    timerDuration === sec
                      ? "bg-[#388D93] text-white shadow-sm"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {sec} Detik
                </button>
              ))}
            </div>

            {/* Tombol Utama */}
            <div className="w-full sm:w-auto">
              {capturedPhotos.length < 3 ? (
                <button
                  type="button"
                  disabled={isShooting}
                  onClick={startFullSequence}
                  className="w-full sm:w-auto px-6 sm:px-8 py-3 bg-[#388D93] hover:bg-[#2e7479] disabled:opacity-50 text-white font-extrabold rounded-xl shadow-lg transition-all duration-150 active:scale-95 cursor-pointer text-sm sm:text-base"
                >
                  {isShooting ? "Sedang Memfoto..." : "Mulai Foto (3x)"}
                </button>
              ) : (
                <button
                  type="button"
                  disabled={isShooting}
                  onClick={() => onCaptureComplete(capturedPhotos)}
                  className="w-full sm:w-auto px-6 sm:px-8 py-3 bg-[#388D93] hover:bg-[#2e7479] text-white font-extrabold rounded-xl shadow-lg transition-all duration-150 active:scale-95 cursor-pointer text-sm sm:text-base"
                >
                  Lanjut Pilih Bingkai →
                </button>
              )}
            </div>
          </div>
        </div>

        {/* PANEL SAMPING: 3 THUMBNAIL (Horizontal di HP, Vertikal di Laptop) */}
        <div className="flex flex-col gap-3 w-full max-w-3xl lg:max-w-xs bg-white/95 p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-xl shrink-0">
          <div className="flex items-center justify-between">
            <h3 className="text-[#388D93] text-sm sm:text-base font-extrabold tracking-wide">
              Hasil Jepretan (3 Foto)
            </h3>
            <span className="text-[10px] text-slate-400 font-bold bg-slate-100 px-2 py-0.5 rounded-full">
              {capturedPhotos.length}/3
            </span>
          </div>

          <div className="grid grid-cols-3 lg:grid-cols-1 gap-2.5">
            {[0, 1, 2].map((idx) => {
              const photoSrc = capturedPhotos[idx];
              return (
                <div
                  key={idx}
                  onClick={() =>
                    photoSrc && !isShooting && setPreviewIndex(idx)
                  }
                  className={`relative w-full aspect-[4/3] rounded-2xl overflow-hidden border-2 transition-all duration-200 cursor-pointer group ${
                    photoSrc
                      ? "border-[#388D93] hover:ring-4 hover:ring-[#388D93]/20 shadow-xs"
                      : "border-dashed border-slate-300 bg-slate-50"
                  }`}
                >
                  {photoSrc ? (
                    <>
                      <img
                        src={photoSrc}
                        alt={`Foto ${idx + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-[11px] font-bold">
                        🔍 Lihat #{idx + 1}
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs font-bold">
                      #{idx + 1}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* MODAL PREVIEW FOTO */}
      {previewIndex !== null && capturedPhotos[previewIndex] && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white p-5 sm:p-6 rounded-3xl max-w-md w-full flex flex-col items-center gap-4 shadow-2xl relative">
            <h4 className="text-[#388D93] text-base sm:text-lg font-extrabold">
              Preview Foto #{previewIndex + 1}
            </h4>

            <div className="w-full aspect-[4/3] rounded-2xl overflow-hidden border-2 border-slate-200 shadow-md">
              <img
                src={capturedPhotos[previewIndex]}
                alt="Preview"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="flex gap-3 w-full mt-1">
              <button
                type="button"
                onClick={() => setPreviewIndex(null)}
                className="w-1/2 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition active:scale-95 cursor-pointer text-xs sm:text-sm border border-slate-200"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={() => retakeSinglePhoto(previewIndex)}
                className="w-1/2 py-3 bg-[#388D93] hover:bg-[#2e7479] text-white font-extrabold rounded-xl shadow-md transition active:scale-95 cursor-pointer text-xs sm:text-sm"
              >
                Ulang Foto Ini 📸
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
