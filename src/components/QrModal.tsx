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

  return (
    <div className="w-full max-w-4xl bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-2xl flex flex-col items-center text-center my-auto animate-fadeIn">
      <span className="px-4 py-1.5 bg-[#388D93]/10 text-[#388D93] text-xs font-bold rounded-full uppercase tracking-wider mb-2">
        Foto Berhasil Diproses!
      </span>

      <h2 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">
        Pindai Kode QR Untuk Mengunduh
      </h2>
      <p className="text-xs sm:text-sm text-slate-500 max-w-md mt-1 mb-6">
        Gunakan kamera HP kamu untuk memindai QR code di bawah dan simpan hasil
        foto photobooth-mu.
      </p>

      {/* QR Code Container */}
      <div className="p-4 sm:p-6 bg-white rounded-3xl border-2 border-slate-100 shadow-inner mb-6">
        <QRCodeSVG
          value={qrUrl}
          size={220}
          level="H"
          includeMargin={true}
          aria-label="QR Code Download Foto"
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md">
        <button
          type="button"
          onClick={handleCopyLink}
          className="w-full sm:w-1/2 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl transition active:scale-95 cursor-pointer text-sm border border-slate-200"
        >
          📋 Salin Link
        </button>
        <button
          type="button"
          onClick={onReset}
          className="w-full sm:w-1/2 py-3.5 bg-[#388D93] hover:bg-[#2e7479] text-white font-extrabold rounded-2xl shadow-lg transition active:scale-95 cursor-pointer text-sm"
        >
          Selesai / Foto Lagi 📸
        </button>
      </div>
    </div>
  );
}
