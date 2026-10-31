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
    <main className="min-h-screen w-full bg-[url('/assets/bg-pattern.jpg')] bg-cover bg-center flex flex-col items-center justify-start relative select-none overflow-y-auto font-sans">
      {/* Overlay Putih Transparan (pointer-events-none wajib agar tombol UI bisa diklik) */}
      <div className="fixed inset-0 bg-white/80 pointer-events-none z-0" />

      {/* Container Utama Konten (Selalu di atas layer z-0) */}
      <div className="relative z-10 w-full min-h-screen flex flex-col items-center justify-center p-4">
        {/* STEP 1: IDLE / STANDBY */}
        {step === "IDLE" && (
          <div className="w-full min-h-screen flex flex-col items-center justify-between p-6 md:p-8 relative">
            {/* Logo Atas */}
            <div className="pt-6">
              <img
                src="/assets/logos.png"
                alt="Logos OASE & UIN"
                className="h-20 md:h-24 object-contain drop-shadow-sm"
              />
            </div>

            {/* Konten Utama Halaman IDLE */}
            <div className="flex flex-col items-center text-center my-auto px-4">
              {/* Badge Identitas Event (Diturunkan mendekati judul) */}
              <span className="mb-4 px-6 py-2 bg-[#388D93]/10 border border-[#388D93]/20 text-[#388D93] text-xs md:text-sm font-bold rounded-full tracking-widest uppercase">
                EXPO OASE III 2026 — UIN SMH BANTEN
              </span>

              {/* Judul Utama */}
              <h1 className="text-4xl md:text-6xl font-extrabold text-[#388D93] tracking-tight drop-shadow-sm leading-tight mb-3">
                Capture Your Moment With Us
              </h1>

              {/* Sub-header Lurus Panjang (Tanpa Enter) */}
              <p className="text-base md:text-lg font-medium text-slate-600 whitespace-nowrap mb-6">
                Abadikan keseruanmu di Stand Kontingen UIN Sultan Maulana
                Hasanuddin Banten!
              </p>

              {/* Alur Kerja Tanpa Emoji */}
              <div className="flex items-center gap-3 md:gap-5 mb-8 text-xs md:text-sm font-semibold text-[#388D93]">
                <span className="bg-white/90 px-4 py-1.5 rounded-xl border border-slate-200/80 shadow-sm">
                  Ambil Foto
                </span>
                <span className="text-slate-300">•</span>
                <span className="bg-white/90 px-4 py-1.5 rounded-xl border border-slate-200/80 shadow-sm">
                  Pilih Bingkai
                </span>
                <span className="text-slate-300">•</span>
                <span className="bg-white/90 px-4 py-1.5 rounded-xl border border-slate-200/80 shadow-sm">
                  Scan QR
                </span>
              </div>

              {/* Tombol Start */}
              <button
                type="button"
                onClick={() => setStep("CAMERA")}
                className="px-14 md:px-16 py-4 bg-[#388D93] hover:bg-[#2e7479] text-white text-2xl md:text-3xl font-extrabold rounded-full shadow-lg hover:shadow-xl transition-all active:scale-95 cursor-pointer border-2 border-white/40"
              >
                Start Photo
              </button>

              <span className="mt-3 text-xs text-slate-400 font-medium">
                Sentuh tombol Start untuk memulai jepretan
              </span>
            </div>

            {/* Maskot Kiri & Kanan */}
            <img
              src="/assets/mascot-left.png"
              alt="Mascot Left"
              className="absolute bottom-0 left-4 h-60 md:h-80 object-contain pointer-events-none drop-shadow-md"
            />
            <img
              src="/assets/mascot-right.png"
              alt="Mascot Right"
              className="absolute bottom-0 right-4 h-60 md:h-80 object-contain pointer-events-none drop-shadow-md"
            />
          </div>
        )}

        {/* STEP 2: CAMERA */}
        {step === "CAMERA" && (
          <CameraFeed onCaptureComplete={handleCaptureComplete} />
        )}

        {/* STEP 3: FRAME SELECTOR */}
        {step === "SELECTOR" && !isUploading && (
          <FrameSelector
            photos={rawPhotos}
            onConfirm={handleConfirmFrame}
            onRetake={() => setStep("CAMERA")}
          />
        )}

        {/* INDIKATOR LOADING UPLOAD */}
        {isUploading && (
          <div className="text-[#388D93] text-2xl font-bold animate-pulse">
            Menyiapkan QR Code...
          </div>
        )}

        {/* STEP 4: QR CODE RESULT (FULL PAGE UI) */}
        {step === "RESULT" && (
          <QrModal photoUrl={resultUrl} onReset={() => setStep("IDLE")} />
        )}
      </div>
    </main>
  );
}
