"use client";

import { QRCodeSVG } from "qrcode.react";

interface QrModalProps {
  qrUrl: string;
  onReset: () => void;
}

export default function QrModal({ qrUrl, onReset }: QrModalProps) {
  const handleCopyLink = () => {
    navigator.clipboard.writeText(qrUrl);
    alert("Link unduh berhasil disalin!");
  };

  // Ambil URL kuis dari environment variable, fallback ke link utama kuis jika belum diset
  const quizUrl =
    process.env.NEXT_PUBLIC_QUIZ_URL || "https://quiz-expo.vercel.app";

  return (
    <div className="w-full max-w-4xl bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-2xl flex flex-col items-center text-center my-auto animate-fadeIn max-h-[90vh] overflow-y-auto">
      <span className="px-4 py-1.5 bg-[#388D93]/10 text-[#388D93] text-xs font-bold rounded-full uppercase tracking-wider mb-2">
        Foto Berhasil Diproses!
      </span>

      <h2 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">
        Pindai Kode QR
      </h2>
      <p className="text-xs sm:text-sm text-slate-500 max-w-md mt-1 mb-6">
        Gunakan kamera HP kamu untuk mengunduh foto photobooth dan ikuti kuis
        berhadiahnya!
      </p>

      {/* Grid Wrapper untuk 2 QR Code (Download Foto & Kuis) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl mb-6">
        {/* QR Code 1: Unduh Foto */}
        <div className="flex flex-col items-center p-4 bg-slate-50 rounded-3xl border-2 border-slate-100 shadow-inner">
          <span className="text-xs font-extrabold text-slate-700 mb-3 uppercase tracking-wide">
            📱 Unduh Foto Kamu
          </span>
          <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-200">
            <QRCodeSVG
              value={qrUrl}
              size={160}
              level="H"
              includeMargin={true}
              aria-label="QR Code Download Foto"
            />
          </div>
          <p className="text-[11px] text-slate-400 mt-3">
            Scan untuk simpan foto
          </p>
        </div>

        {/* QR Code 2: Kuis Expo */}
        <div className="flex flex-col items-center p-4 bg-amber-50/50 rounded-3xl border-2 border-amber-100 shadow-inner">
          <span className="text-xs font-extrabold text-amber-800 mb-3 uppercase tracking-wide">
            🎯 Main Kuis Expo
          </span>
          <div className="p-3 bg-white rounded-2xl shadow-sm border border-amber-200">
            <QRCodeSVG
              value={quizUrl}
              size={160}
              level="H"
              includeMargin={true}
              aria-label="QR Code Kuis"
            />
          </div>
          <p className="text-[11px] text-amber-600/80 mt-3">
            Scan untuk ikutan kuis
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md">
        <button
          type="button"
          onClick={handleCopyLink}
          className="w-full sm:w-1/2 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl transition active:scale-95 cursor-pointer text-sm border border-slate-200"
        >
          Salin Link Foto
        </button>
        <button
          type="button"
          onClick={onReset}
          className="w-full sm:w-1/2 py-3.5 bg-[#388D93] hover:bg-[#2e7479] text-white font-extrabold rounded-2xl shadow-lg transition active:scale-95 cursor-pointer text-sm"
        >
          Selesai / Foto Lagi
        </button>
      </div>
    </div>
  );
}
