import { supabase } from "@/lib/supabase";

export default async function MobileDownloadPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;

  // Dapatkan Public URL Foto dari Supabase Storage
  const { data } = supabase.storage
    .from("photobooth")
    .getPublicUrl(`${id}.png`);
  const imageUrl = data.publicUrl;

  return (
    <main className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm flex flex-col items-center gap-6">
        <h1 className="text-xl font-bold text-center">
          Your Photobooth Result
        </h1>

        <div className="w-full aspect-[9/16] rounded-2xl overflow-hidden border border-slate-800 shadow-2xl bg-black">
          <img
            src={imageUrl}
            alt="Result"
            className="w-full h-full object-contain"
          />
        </div>

        <a
          href={imageUrl}
          download="photobooth-result.png"
          target="_blank"
          rel="noreferrer"
          className="w-full text-center bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-4 rounded-xl shadow-lg transition"
        >
          Simpan ke Galeri (HD)
        </a>
      </div>
    </main>
  );
}
