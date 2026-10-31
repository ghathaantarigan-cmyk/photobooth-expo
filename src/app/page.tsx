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

    const { error } = await supabase.storage
      .from("photobooth")
      .upload(`${uniqueId}.png`, finalBlob, { contentType: "image/png" });

    setIsUploading(false);

    if (error) {
      alert("Gagal mengunggah foto!");
      console.error(error);
      return;
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || window.location.origin;
    const mobileLink = `${baseUrl}/p/${uniqueId}`;
    setResultUrl(mobileLink);
    setStep("RESULT");
  };

  return (
    <main className="min-h-screen bg-[url('/assets/bg-pattern.jpg')] bg-cover bg-center flex flex-col items-center justify-between relative overflow-hidden select-none">
      {/* Overlay Putih Transparan */}
      <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px] z-0" />

      {/* Layar Standby/Idle */}
      {step === "IDLE" && (
        <div className="w-full min-h-screen flex flex-col items-center justify-between p-4 sm:p-6 md:p-8 relative font-sans z-10 max-w-7xl mx-auto">
          {/* Logo Atas */}
          <div className="pt-2 sm:pt-6">
            <img
              src="/assets/logos.png"
              alt="Logos OASE & UIN"
              className="h-14 sm:h-20 md:h-24 object-contain drop-shadow-sm max-w-[85vw]"
            />
          </div>

          {/* Konten Utama (Tengah Layar) */}
          <div className="flex flex-col items-center text-center my-auto px-3 w-full max-w-4xl z-10">
            {/* Pill Event */}
            <span className="mb-3 px-3.5 sm:px-6 py-1.5 bg-[#388D93]/10 border border-[#388D93]/20 text-[#388D93] text-[10px] sm:text-xs md:text-sm font-bold rounded-full tracking-wider sm:tracking-widest uppercase">
              EXPO OASE III 2026 — UIN SMH BANTEN
            </span>

            {/* Judul Utama (Pas di Layar HP) */}
            <h1 className="text-2xl sm:text-5xl md:text-6xl font-extrabold text-[#388D93] tracking-tight drop-shadow-sm leading-tight mb-2 sm:mb-3 break-words w-full">
              Capture Your Moment With Us
            </h1>

            {/* Subteks (Responsive: Melipat di Mobile, Lurus di Desktop) */}
            <p className="text-xs sm:text-base md:text-lg font-medium text-slate-600 mb-5 sm:mb-6 leading-relaxed max-w-2xl md:max-w-none md:whitespace-nowrap">
              Abadikan keseruanmu di Stand Kontingen UIN Sultan Maulana
              Hasanuddin Banten!
            </p>

            {/* Alur Kerja */}
            <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-3 md:gap-5 mb-6 sm:mb-8 text-[11px] sm:text-xs md:text-sm font-semibold text-[#388D93]">
              <span className="bg-white/90 px-3 py-1.5 rounded-xl border border-slate-200/80 shadow-sm">
                Ambil Foto
              </span>
              <span className="text-slate-300">•</span>
              <span className="bg-white/90 px-3 py-1.5 rounded-xl border border-slate-200/80 shadow-sm">
                Pilih Bingkai
              </span>
              <span className="text-slate-300">•</span>
              <span className="bg-white/90 px-3 py-1.5 rounded-xl border border-slate-200/80 shadow-sm">
                Scan QR
              </span>
            </div>

            {/* Tombol Start */}
            <button
              type="button"
              onClick={() => setStep("CAMERA")}
              className="px-10 sm:px-14 md:px-16 py-3.5 sm:py-4 bg-[#388D93] hover:bg-[#2e7479] text-white text-lg sm:text-2xl md:text-3xl font-extrabold rounded-full shadow-lg hover:shadow-xl transition-all active:scale-95 cursor-pointer border-2 border-white/40"
            >
              Start Photo
            </button>

            <span className="mt-2.5 text-[10px] sm:text-xs text-slate-400 font-medium">
              Sentuh tombol Start untuk memulai jepretan
            </span>
          </div>

          {/* Maskot Kiri: Sembunyi di HP, Tampil di Desktop/Tablet */}
          <img
            src="/assets/mascot-left.png"
            alt="Mascot Left"
            className="hidden sm:block absolute bottom-0 left-4 sm:h-52 md:h-80 object-contain pointer-events-none drop-shadow-md z-0"
          />

          {/* Maskot Kanan: Tampil 1 Maskot Saja di HP (Ukuran Lebih Kecil di Pojok) */}
          <img
            src="/assets/mascot-right.png"
            alt="Mascot Right"
            className="absolute bottom-0 right-2 sm:right-4 h-32 sm:h-52 md:h-80 object-contain pointer-events-none drop-shadow-md opacity-30 sm:opacity-100 z-0"
          />
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
        <div className="relative z-10 text-[#388D93] text-xl sm:text-2xl font-bold animate-pulse my-auto">
          Menyiapkan QR Code...
        </div>
      )}

      {/* Layar Tampil QR Code */}
      {step === "RESULT" && (
        <QrModal qrUrl={resultUrl} onReset={() => setStep("IDLE")} />
      )}
    </main>
  );
}
