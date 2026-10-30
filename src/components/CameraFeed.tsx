"use client";

import { useRef, useState, useEffect } from "react";

interface CameraFeedProps {
  onCaptureComplete: (photos: string[]) => void;
}

export default function CameraFeed({ onCaptureComplete }: CameraFeedProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [timerDelay, setTimerDelay] = useState<number>(3); // Default 3 Detik
  const [countdown, setCountdown] = useState<number | null>(null);
  const [currentShot, setCurrentShot] = useState<number>(0);
  const [capturedPhotos, setCapturedPhotos] = useState<string[]>([]);
  const [isCapturing, setIsCapturing] = useState<boolean>(false);

  // Akses Webcam
  useEffect(() => {
    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 1280, height: 720 },
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Kamera gagal dibuka:", err);
      }
    }
    startCamera();
  }, []);

  const takePhoto = (): string => {
    const video = videoRef.current!;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d")!;

    // Efek Mirror Camera
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    return canvas.toDataURL("image/jpeg", 0.9);
  };

  const startSession = () => {
    setIsCapturing(true);
    setCapturedPhotos([]);
    setCurrentShot(1);
    runCountdown(1, []);
  };

  const runCountdown = (shotNumber: number, accumulatedPhotos: string[]) => {
    let current = timerDelay;
    setCountdown(current);

    const interval = setInterval(() => {
      current -= 1;
      if (current > 0) {
        setCountdown(current);
      } else {
        clearInterval(interval);
        setCountdown(null);

        // Jepret Foto
        const photoData = takePhoto();
        const updatedPhotos = [...accumulatedPhotos, photoData];
        setCapturedPhotos(updatedPhotos);

        if (shotNumber < 4) {
          setCurrentShot(shotNumber + 1);
          setTimeout(() => runCountdown(shotNumber + 1, updatedPhotos), 1000);
        } else {
          setIsCapturing(false);
          onCaptureComplete(updatedPhotos);
        }
      }
    }, 1000);
  };

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-4xl mx-auto p-4">
      <div className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border-4 border-slate-800">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover -scale-x-100"
        />

        {/* Layar Hitung Mundur */}
        {countdown !== null && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-sm">
            <span className="text-white text-9xl font-black animate-ping">
              {countdown}
            </span>
          </div>
        )}

        {/* Badge Status Jepretan */}
        {isCapturing && (
          <div className="absolute top-4 right-4 bg-red-600 text-white px-4 py-2 rounded-full font-bold shadow-lg">
            Foto {currentShot} / 4
          </div>
        )}
      </div>

      {/* Pengaturan Timer & Tombol Start */}
      {!isCapturing && (
        <div className="mt-6 flex flex-col items-center gap-4">
          <div className="flex items-center gap-3 bg-slate-800 p-2 rounded-xl">
            <span className="text-white text-sm font-medium px-2">
              Jeda Timer:
            </span>
            <button
              onClick={() => setTimerDelay(3)}
              className={`px-4 py-2 rounded-lg font-bold transition ${
                timerDelay === 3 ? "bg-blue-600 text-white" : "text-slate-300"
              }`}
            >
              3s
            </button>
            <button
              onClick={() => setTimerDelay(5)}
              className={`px-4 py-2 rounded-lg font-bold transition ${
                timerDelay === 5 ? "bg-blue-600 text-white" : "text-slate-300"
              }`}
            >
              5s
            </button>
          </div>

          <button
            onClick={startSession}
            className="bg-emerald-500 hover:bg-emerald-600 text-white text-xl font-bold px-10 py-4 rounded-2xl shadow-xl transition transform active:scale-95"
          >
            Mulai Foto (4x)
          </button>
        </div>
      )}
    </div>
  );
}
