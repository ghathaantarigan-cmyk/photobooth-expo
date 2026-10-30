"use client";

import { useEffect, useRef } from "react";
import QRCode from "qrcode";

interface QrModalProps {
  photoUrl: string;
  onReset: () => void;
}

export default function QrModal({ photoUrl, onReset }: QrModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current && photoUrl) {
      QRCode.toCanvas(canvasRef.current, photoUrl, { width: 260 }, (err) => {
        if (err) console.error(err);
      });
    }
  }, [photoUrl]);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 flex flex-col items-center text-center max-w-sm w-full shadow-2xl">
        <h2 className="text-2xl font-black text-white mb-1">Foto Siap!</h2>
        <p className="text-slate-400 text-sm mb-6">
          Scan QR Code di bawah untuk mengunduh foto ke HP kamu.
        </p>

        <div className="bg-white p-4 rounded-2xl shadow-inner mb-6">
          <canvas ref={canvasRef} />
        </div>

        <button
          onClick={onReset}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition"
        >
          Selesai / Foto Lagi
        </button>
      </div>
    </div>
  );
}
