"use client";

import { useState } from "react";
import CameraFeed from "@/components/CameraFeed";
import FrameSelector from "@/components/FrameSelector";
import QrModal from "@/components/QrModal";
import { supabase } from "@/lib/supabase";

type Step = "IDLE" | "CAMERA" | "SELECTOR" | "RESULT";

export default function Home() {
  const [step, setStep] = useState<Step>("IDLE");
  const [capturedPhotos, setCapturedPhotos] = useState<string[]>([]);
  const [downloadUrl, setDownloadUrl] = useState<string>("");
  const [isUploading, setIsUploading] = useState<boolean>(false);

  const handleStart = () => {
    setCapturedPhotos([]);
    setStep("CAMERA");
  };

  const handleCaptureComplete = (photos: string[]) => {
    setCapturedPhotos(photos);
    setStep("SELECTOR");
  };

  const handleConfirmFrame = async (finalBlob: Blob) => {
    setIsUploading(true);
    const photoId = crypto.randomUUID();
    const filePath = `${photoId}.png`;

    try {
      const { error } = await supabase.storage
        .from("photobooth")
        .upload(filePath, finalBlob, { contentType: "image/png" });

      if (error) throw error;

      const baseUrl =
        process.env.NEXT_PUBLIC_BASE_URL || window.location.origin;
      const downloadLink = `${baseUrl}/p/${photoId}`;
      setDownloadUrl(downloadLink);
      setStep("RESULT");
    } catch (err) {
      console.error("Gagal mengunggah foto:", err);
      alert("Terjadi kesalahan saat menyimpan foto. Silakan coba lagi.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <main className="min-h-screen w-full bg-[url('/assets/bg-pattern.jpg')] bg-cover bg-center flex flex-col items-center justify-between p-4 md:p-6 font-sans relative overflow-x-hidden select-none">
      {/* Background Overlay Transparan */}
      <div className="fixed inset-0 bg-white/80 pointer-events-none z-0" />

      {/* HEADER IDENTITAS EXPO */}
      <header className="relative z-10 w-full max-w-6xl flex items-center justify-between pt-2 pb-2 px-4 bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200/80 shadow-xs mb-2">
        <div className="flex items-center gap-3">
          <img
            src="/assets/logos.png"
            alt="Logo UIN SMH Banten"
            className="h-8 md:h-10 object-contain"
          />
          <div className="flex flex-col">
            <span className="text-[10px] md:text-xs font-bold text-[#388D93] tracking-widest uppercase">
              EXPO OASE III 2026
            </span>
            <span className="text-xs md:text-sm font-extrabold text-slate-800 leading-tight">
              UIN SMH Banten
            </span>
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-1.5 bg-[#388D93]/10 px-3 py-1 rounded-full border border-[#388D93]/20">
          <span className="w-2 h-2 rounded-full bg-[#388D93] animate-pulse" />
          <span className="text-[11px] font-bold text-[#388D93] uppercase tracking-wider">
            {step}
          </span>
        </div>
      </header>

      {/* AREA UTAMA */}
      <div className="relative z-10 w-full flex-1 flex flex-col items-center justify-center my-auto">
        {step === "IDLE" && (
          <div className="flex flex-col items-center justify-center text-center p-8 md:p-12 max-w-3xl bg-white/90 backdrop-blur-md rounded-3xl border border-slate-200 shadow-2xl my-auto relative">
            {/* Maskot Kiri & Kanan */}
            <div className="flex items-center justify-center gap-6 mb-6">
              <img
                src="/assets/mascot-left.png"
                alt="Maskot Kiri"
                className="w-20 md:w-28 object-contain drop-shadow-md"
              />
              <img
                src="/assets/mascot-right.png"
                alt="Maskot Kanan"
                className="w-20 md:w-28 object-contain drop-shadow-md"
              />
            </div>

            {/* Judul Lurus Tanpa Emoji */}
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-800 tracking-tight leading-tight max-w-2xl">
              Abadikan Momen Kamu di Stand Kontingen UIN SMH Banten EXPO OASE
              III 2026
            </h1>

            <p className="text-xs sm:text-sm text-slate-500 mt-4 max-w-lg">
              Ambil foto menarik bersama teman-teman, pilih desain bingkai
              eksklusif, dan unduh hasilnya secara instant melalui QR Code.
            </p>

            {/* Tombol Mulai Foto */}
            <button
              type="button"
              onClick={handleStart}
              className="mt-8 px-10 py-4 bg-[#388D93] hover:bg-[#2e7479] text-white text-base md:text-lg font-extrabold rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-200 active:scale-95 cursor-pointer tracking-wide"
            >
              Mulai Foto
            </button>
          </div>
        )}

        {step === "CAMERA" && (
          <CameraFeed onCaptureComplete={handleCaptureComplete} />
        )}

        {step === "SELECTOR" && (
          <FrameSelector
            photos={capturedPhotos}
            onConfirm={handleConfirmFrame}
            onRetake={() => setStep("CAMERA")}
          />
        )}

        {step === "RESULT" && (
          <QrModal qrUrl={downloadUrl} onReset={() => setStep("IDLE")} />
        )}
      </div>

      {/* FOOTER */}
      <footer className="relative z-10 w-full text-center py-2 text-[11px] font-medium text-slate-500">
        © 2026 Stand Kontingen UIN Sultan Maulana Hasanuddin Banten
      </footer>

      {/* Loading Overlay Saat Simpan ke Supabase */}
      {isUploading && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-3xl flex flex-col items-center gap-3 shadow-2xl">
            <div className="w-10 h-10 border-4 border-[#388D93] border-t-transparent rounded-full animate-spin" />
            <span className="text-slate-800 font-extrabold text-sm">
              Membuat QR Code & Menyimpan Foto...
            </span>
          </div>
        </div>
      )}
    </main>
  );
}
