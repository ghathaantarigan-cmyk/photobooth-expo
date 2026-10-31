"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

function DownloadContent() {
  const params = useParams();
  const id = params?.id as string;
  const [photoUrl, setPhotoUrl] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!id) return;

    // Ambil Public URL foto dari Supabase Storage
    const { data } = supabase.storage
      .from("photobooth")
      .getPublicUrl(`${id}.png`);

    if (data?.publicUrl) {
      setPhotoUrl(data.publicUrl);
    }
    setLoading(false);
  }, [id]);

  const handleDownload = async () => {
    try {
      const response = await fetch(photoUrl);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `photobooth-uin-${id ? id.slice(0, 6) : "photo"}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      window.open(photoUrl, "_blank");
    }
  };

  if (loading) {
    return (
      <div className="text-[#388D93] text-lg font-bold animate-pulse">
        Memuat foto kamu...
      </div>
    );
  }

  return (
    <div className="relative z-10 w-full max-w-md bg-white p-6 rounded-3xl border border-slate-200 shadow-2xl flex flex-col items-center gap-5 text-center my-auto">
      <div>
        <span className="px-4 py-1.5 bg-[#388D93]/10 text-[#388D93] text-xs font-bold rounded-full uppercase tracking-wider">
          EXPO OASE III 2026
        </span>
        <h1 className="text-2xl font-extrabold text-[#388D93] mt-2">
          Foto Photobooth Kamu
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          UIN Sultan Maulana Hasanuddin Banten
        </p>
      </div>

      {photoUrl ? (
        <div className="w-full aspect-[9/16] rounded-2xl overflow-hidden border-2 border-slate-100 shadow-inner bg-slate-900">
          <img
            src={photoUrl}
            alt="Hasil Photobooth"
            className="w-full h-full object-contain"
          />
        </div>
      ) : (
        <div className="p-8 text-red-500 font-medium text-sm">
          Foto tidak ditemukan atau sudah kadaluarsa.
        </div>
      )}

      {photoUrl && (
        <button
          type="button"
          onClick={handleDownload}
          className="w-full py-4 bg-[#388D93] hover:bg-[#2e7479] text-white font-extrabold rounded-2xl shadow-lg transition active:scale-95 cursor-pointer text-base tracking-wide flex items-center justify-center gap-2"
        >
          <span>📥</span> Simpan / Unduh Foto
        </button>
      )}
    </div>
  );
}

export default function DownloadPhotoPage() {
  return (
    <main className="min-h-screen w-full bg-[url('/assets/bg-pattern.jpg')] bg-cover bg-center flex flex-col items-center justify-center p-4 font-sans relative">
      <div className="fixed inset-0 bg-white/80 pointer-events-none z-0" />
      <Suspense
        fallback={
          <div className="relative z-10 text-[#388D93] text-lg font-bold animate-pulse">
            Menyiapkan Halaman...
          </div>
        }
      >
        <DownloadContent />
      </Suspense>
    </main>
  );
}
