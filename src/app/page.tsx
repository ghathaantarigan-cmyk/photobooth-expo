"use client";

import { useState } from "react";
import CameraFeed from "@/components/CameraFeed";
import FrameSelector from "@/components/FrameSelector";
import QrModal from "@/components/QrModal";
import { supabase } from "@/lib/supabase";

type Step = "IDLE" | "CAMERA" | "SELECTOR" | "RESULT";

export default function Home() {
  const [step, setStep] = useState<Step>("IDLE");
  const [rawPhotos, setRawPhotos] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [resultUrl, setResultUrl] = useState<string>("");

  const handleCaptureComplete = (photos: string[]) => {
    setRawPhotos(photos);
    setStep("SELECTOR");
  };

  const handleConfirmFrame = async (finalBlob: Blob) => {
    setIsUploading(true);
    const uniqueId = crypto.randomUUID();

    // 1. Upload Blob Gambar ke Supabase Storage
    const { error } = await supabase.storage
      .from("photobooth")
      .upload(`${uniqueId}.png`, finalBlob, { contentType: "image/png" });

    setIsUploading(false);

    if (error) {
      alert("Gagal mengunggah foto!");
      console.error(error);
      return;
    }

    // 2. Buat Link Halaman Mobile
    const mobileLink = `${process.env.NEXT_PUBLIC_BASE_URL || window.location.origin}/p/${uniqueId}`;
    setResultUrl(mobileLink);
    setStep("RESULT");
  };

  return (
    <main className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      {/* Layar Standby/Idle */}
      {step === "IDLE" && (
        <div
          onClick={() => setStep("CAMERA")}
          className="cursor-pointer text-center flex flex-col items-center justify-center gap-6 p-12 rounded-3xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition"
        >
          <h1 className="text-5xl font-black text-white tracking-wider">
            EXPO PHOTOBOOTH
          </h1>
          <p className="text-emerald-400 text-lg animate-pulse font-medium">
            Sentuh Layar Untuk Mulai
          </p>
        </div>
      )}

      {/* Layar Kamera & Timer */}
      {step === "CAMERA" && (
        <CameraFeed onCaptureComplete={handleCaptureComplete} />
      )}

      {/* Layar Pilih Frame & Slot Foto */}
      {step === "SELECTOR" && !isUploading && (
        <FrameSelector
          photos={rawPhotos}
          onConfirm={handleConfirmFrame}
          onRetake={() => setStep("CAMERA")}
        />
      )}

      {/* Indikator Loading Upload */}
      {isUploading && (
        <div className="text-white text-xl font-bold animate-pulse">
          Menyiapkan QR Code...
        </div>
      )}

      {/* Layar Tampil QR Code */}
      {step === "RESULT" && (
        <QrModal photoUrl={resultUrl} onReset={() => setStep("IDLE")} />
      )}
    </main>
  );
}
