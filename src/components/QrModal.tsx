"use client";

import { QRCodeSVG } from "qrcode.react";

interface QrDisplayProps {
  photoUrl: string;
  onReset: () => void;
}

export default function QrModal({ photoUrl, onReset }: QrDisplayProps) {
  return (
    <div className="flex flex-col lg:flex-row gap-10 items-center justify-center p-6 w-full max-w-5xl relative z-10 select-none font-sans my-auto">
      {/* Kolom Kiri: Deskripsi & Panduan */}
      <div className="flex flex-col gap-6 w-full max-w-lg bg-white/95 backdrop-blur-sm p-8 rounded-3xl border border-slate-200 shadow-xl">
        <div>
          <span className="px-4 py-1.5 bg-[#388D93]/10 text-[#388D93] text-xs font-bold rounded-full uppercase tracking-wider">
            Foto Berhasil Disimpan!
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-[#388D93] mt-3 tracking-tight">
            Unduh Hasil Foto Kamu
          </h2>
          <p className="text-slate-600 font-medium text-base mt-2 leading-relaxed">
            Terima kasih sudah berkunjung ke Stand Kontingen UIN Sultan Maulana
            Hasanuddin Banten!
          </p>
        </div>

        {/* Langkah-langkah singkat */}
        <div className="flex flex-col gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
          <div className="flex items-start gap-3">
            <span className="flex items-center justify-center w-7 h-7 rounded-full bg-[#388D93] text-white text-xs font-bold shrink-0 mt-0.5">
              1
            </span>
            <p className="text-xs md:text-sm text-slate-700 font-medium">
              Buka aplikasi **Kamera** atau **Scan QR** di smartphone kamu.
            </p>
          </div>
          <div className="flex items-start gap-3">
            <span className="flex items-center justify-center w-7 h-7 rounded-full bg-[#388D93] text-white text-xs font-bold shrink-0 mt-0.5">
              2
            </span>
            <p className="text-xs md:text-sm text-slate-700 font-medium">
              Arahkan kamera ke **QR Code** di sebelah kanan.
            </p>
          </div>
          <div className="flex items-start gap-3">
            <span className="flex items-center justify-center w-7 h-7 rounded-full bg-[#388D93] text-white text-xs font-bold shrink-0 mt-0.5">
              3
            </span>
            <p className="text-xs md:text-sm text-slate-700 font-medium">
              Klik tautan yang muncul untuk menyimpan foto beresolusi tinggi.
            </p>
          </div>
        </div>

        {/* Tombol Selesai */}
        <button
          onClick={onReset}
          className="w-full bg-[#388D93] hover:bg-[#2e7479] text-white font-extrabold py-4 rounded-2xl shadow-lg transition active:scale-95 cursor-pointer text-lg tracking-wide border-2 border-white/20 mt-2"
        >
          Selesai / Foto Lagi
        </button>
      </div>

      {/* Kolom Kanan: Card QR Code */}
      <div className="flex flex-col items-center justify-center p-8 bg-white rounded-3xl border border-slate-200 shadow-2xl shrink-0">
        <div className="p-4 bg-white rounded-2xl border-2 border-slate-100 shadow-inner">
          <QRCodeSVG
            value={photoUrl}
            size={280}
            level="H"
            includeMargin={true}
          />
        </div>
        <span className="mt-4 text-xs font-bold text-slate-400 tracking-widest uppercase">
          Scan QR Code Above
        </span>
      </div>
    </div>
  );
}
