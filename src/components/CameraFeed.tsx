"use client";

import { useState, useRef, useEffect } from "react";

interface CameraFeedProps {
  onCaptureComplete: (photos: string[]) => void;
}

export default function CameraFeed({ onCaptureComplete }: CameraFeedProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mountedRef = useRef(true);
  const shootingRef = useRef(false);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const audioRef = useRef<AudioContext | null>(null);

  const [capturedPhotos, setCapturedPhotos] = useState<string[]>([]);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [timerDuration, setTimerDuration] = useState(3);
  const [isShooting, setIsShooting] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);

  // ========================================
  // SETUP KAMERA (LANDSCAPE 16:9)
  // ========================================
  useEffect(() => {
    mountedRef.current = true;

    const setupCamera = async () => {
      try {
        setCameraError(null);

        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error("Browser tidak mendukung akses kamera.");
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            width: { ideal: 1920 },
            height: { ideal: 1080 },
            facingMode: "user",
          },
        });

        if (!mountedRef.current) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        const video = videoRef.current;

        if (video) {
          video.srcObject = stream;
          video.play().catch((err) => {
            if (err.name !== "AbortError") {
              console.warn("Autoplay terinterupsi:", err);
            }
          });
        }
      } catch (error: any) {
        console.error("Gagal mengakses kamera:", error);

        if (mountedRef.current) {
          setCameraError(
            "Kamera tidak dapat diakses. Periksa izin kamera dan pastikan tidak sedang digunakan aplikasi lain.",
          );
          setIsCameraReady(false);
        }
      }
    };

    setupCamera();

    return () => {
      mountedRef.current = false;
      shootingRef.current = false;

      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];

      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;

      if (audioRef.current) {
        void audioRef.current.close().catch(() => {});
        audioRef.current = null;
      }
    };
  }, []);

  // ========================================
  // AUDIO BEEP
  // ========================================
  const playBeep = () => {
    try {
      const AudioContextClass = window.AudioContext;
      if (!AudioContextClass) return;

      if (!audioRef.current) {
        audioRef.current = new AudioContextClass();
      }

      const ctx = audioRef.current;
      if (ctx.state === "suspended") {
        void ctx.resume();
      }

      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();

      oscillator.type = "sine";
      oscillator.frequency.value = 800;
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

      oscillator.connect(gain);
      gain.connect(ctx.destination);

      oscillator.start();
      oscillator.stop(ctx.currentTime + 0.15);
    } catch (error) {
      console.warn("Audio beep tidak tersedia:", error);
    }
  };

  const sleep = (ms: number): Promise<boolean> => {
    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        timersRef.current = timersRef.current.filter((t) => t !== timer);
        resolve(mountedRef.current);
      }, ms);
      timersRef.current.push(timer);
    });
  };

  // ========================================
  // CAPTURE FOTO (MURNI LANDSCAPE 16:9)
  // ========================================
  const grabFrame = (): string | null => {
    const video = videoRef.current;

    if (
      !video ||
      video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA ||
      video.videoWidth === 0 ||
      video.videoHeight === 0
    ) {
      return null;
    }

    const sourceWidth = video.videoWidth;
    const sourceHeight = video.videoHeight;
    const targetRatio = 16 / 9;

    let cropWidth = sourceWidth;
    let cropHeight = sourceHeight;

    if (sourceWidth / sourceHeight > targetRatio) {
      cropWidth = sourceHeight * targetRatio;
    } else {
      cropHeight = sourceWidth / targetRatio;
    }

    const cropX = (sourceWidth - cropWidth) / 2;
    const cropY = (sourceHeight - cropHeight) / 2;

    const outputWidth = 1920;
    const outputHeight = 1080;

    const canvas = document.createElement("canvas");
    canvas.width = outputWidth;
    canvas.height = outputHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    ctx.save();
    ctx.translate(outputWidth, 0);
    ctx.scale(-1, 1);

    ctx.drawImage(
      video,
      cropX,
      cropY,
      cropWidth,
      cropHeight,
      0,
      0,
      outputWidth,
      outputHeight,
    );

    ctx.restore();

    return canvas.toDataURL("image/png");
  };

  const runCountdown = async (duration: number): Promise<boolean> => {
    for (let count = duration; count > 0; count--) {
      if (!mountedRef.current || !shootingRef.current) return false;

      setCountdown(count);
      playBeep();

      const stillActive = await sleep(1000);
      if (!stillActive || !shootingRef.current) return false;
    }

    if (mountedRef.current) {
      setCountdown(null);
    }
    return true;
  };

  const startFullSequence = async () => {
    if (shootingRef.current || !isCameraReady || !mountedRef.current) return;

    shootingRef.current = true;
    setIsShooting(true);
    setCapturedPhotos([]);
    setPreviewIndex(null);
    setCameraError(null);

    const newPhotos: string[] = [];

    try {
      for (let i = 0; i < 3; i++) {
        const completed = await runCountdown(timerDuration);
        if (!completed) return;

        const photo = grabFrame();
        if (!photo) {
          throw new Error("Gagal mengambil gambar dari kamera.");
        }

        newPhotos.push(photo);

        if (mountedRef.current) {
          setCapturedPhotos([...newPhotos]);
        }

        if (i < 2) {
          const stillActive = await sleep(1200);
          if (!stillActive) return;
        }
      }
    } catch (error) {
      console.error("Gagal mengambil foto:", error);
      if (mountedRef.current) {
        setCameraError(
          "Terjadi kesalahan saat mengambil foto. Silakan ulangi.",
        );
      }
    } finally {
      shootingRef.current = false;

      if (mountedRef.current) {
        setIsShooting(false);
        setCountdown(null);
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-7xl p-2 sm:p-4 relative z-10 font-sans select-none my-auto">
      <div className="flex flex-col lg:flex-row gap-6 sm:gap-8 items-center justify-center w-full">
        {/* KAMERA UTAMA LANDSCAPE */}
        <div className="flex flex-col items-center w-full max-w-2xl shrink-0">
          <div className="relative w-full aspect-[16/9] bg-black rounded-3xl overflow-hidden shadow-2xl border-4 border-white flex items-center justify-center">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              onLoadedMetadata={() => {
                if (videoRef.current?.videoWidth) {
                  setIsCameraReady(true);
                  setCameraError(null);
                }
              }}
              className="w-full h-full object-cover -scale-x-100"
            />

            {!isCameraReady && !cameraError && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/70 text-white text-sm font-bold">
                Mengaktifkan kamera...
              </div>
            )}

            {countdown !== null && (
              <div className="absolute inset-0 bg-black/30 flex flex-col items-center justify-center z-20 pointer-events-none">
                <span className="text-white text-7xl sm:text-8xl md:text-9xl font-black animate-pulse drop-shadow-lg">
                  {countdown}
                </span>
                <span className="text-white text-sm sm:text-lg font-bold mt-2 tracking-widest uppercase drop-shadow-md">
                  Bersiap!
                </span>
              </div>
            )}
          </div>

          {cameraError && (
            <div
              role="alert"
              className="w-full mt-2 rounded-xl border border-red-200 bg-red-50 p-2.5 text-center text-red-700 text-xs sm:text-sm font-semibold"
            >
              {cameraError}
            </div>
          )}

          {/* PANEL TIMER */}
          <div className="flex flex-col sm:flex-row items-center justify-between w-full mt-3.5 gap-3 bg-white/90 p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-md">
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
                  className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all duration-150 cursor-pointer active:scale-95 disabled:opacity-50 ${
                    timerDuration === sec
                      ? "bg-[#388D93] text-white shadow-sm"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {sec} Detik
                </button>
              ))}
            </div>

            <div className="w-full sm:w-auto">
              {capturedPhotos.length < 3 ? (
                <button
                  type="button"
                  disabled={isShooting || !isCameraReady}
                  onClick={startFullSequence}
                  className="w-full sm:w-auto px-6 sm:px-8 py-2.5 sm:py-3 bg-[#388D93] hover:bg-[#2e7479] disabled:opacity-50 disabled:cursor-not-allowed text-white font-extrabold rounded-xl shadow-lg transition-all active:scale-95 cursor-pointer text-sm sm:text-base"
                >
                  {isShooting ? "Sedang Memfoto..." : "Mulai Foto (3x)"}
                </button>
              ) : (
                <button
                  type="button"
                  disabled={isShooting}
                  onClick={() => onCaptureComplete(capturedPhotos)}
                  className="w-full sm:w-auto px-6 sm:px-8 py-2.5 sm:py-3 bg-[#388D93] hover:bg-[#2e7479] disabled:opacity-50 text-white font-extrabold rounded-xl shadow-lg transition active:scale-95 cursor-pointer text-sm sm:text-base"
                >
                  Lanjut Pilih Bingkai →
                </button>
              )}
            </div>
          </div>
        </div>

        {/* CARD HASIL JEPRETAN KANAN */}
        <div className="flex flex-col gap-3.5 w-full max-w-sm bg-white/95 p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xl shrink-0">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <h3 className="text-[#388D93] text-base sm:text-lg font-extrabold tracking-wide">
              Hasil Jepretan (3 Foto)
            </h3>

            <span className="text-xs text-slate-500 font-bold bg-slate-100 px-3 py-1 rounded-full">
              {capturedPhotos.length}/3
            </span>
          </div>

          <div className="flex flex-col gap-3.5">
            {[0, 1, 2].map((idx) => {
              const photoSrc = capturedPhotos[idx];

              return (
                <button
                  key={idx}
                  type="button"
                  disabled={!photoSrc || isShooting}
                  onClick={() => setPreviewIndex(idx)}
                  className={`relative w-full aspect-[16/9] min-h-[110px] sm:min-h-[125px] rounded-2xl overflow-hidden border-2 transition-all cursor-pointer disabled:cursor-default ${
                    photoSrc
                      ? "border-[#388D93] hover:scale-105 hover:ring-4 hover:ring-[#388D93]/20 shadow-md"
                      : "border-dashed border-slate-300 bg-slate-50/80"
                  }`}
                >
                  {photoSrc ? (
                    <img
                      src={photoSrc}
                      alt={`Foto ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-1">
                      <span className="text-sm font-extrabold text-slate-400">
                        #{idx + 1}
                      </span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* MODAL PREVIEW FOTO */}
      {previewIndex !== null && capturedPhotos[previewIndex] && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-5"
          onClick={() => setPreviewIndex(null)}
        >
          <div
            className="relative max-w-2xl w-full flex flex-col items-center gap-4"
            onClick={(event) => event.stopPropagation()}
          >
            <img
              src={capturedPhotos[previewIndex]}
              alt={`Preview Foto ${previewIndex + 1}`}
              className="max-w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl border-2 border-white"
            />

            <button
              type="button"
              onClick={() => setPreviewIndex(null)}
              className="px-6 py-2.5 bg-white text-slate-800 font-bold rounded-xl hover:bg-slate-100 cursor-pointer shadow-md"
            >
              Tutup Preview
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
