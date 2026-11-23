import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

export async function POST(req: Request) {
  try {
    const { image } = await req.json();
    if (!image) {
      return NextResponse.json(
        { success: false, error: "No image provided" },
        { status: 400 },
      );
    }

    // Ubah Base64 menjadi Buffer PNG
    const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");

    const id = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const fileName = `${id}.png`;

    // Unggah ke bucket Supabase (sesuaikan nama bucket jika berbeda, misal 'photobooth')
    const { error: uploadError } = await supabase.storage
      .from("photobooth")
      .upload(fileName, buffer, {
        contentType: "image/png",
        upsert: true,
      });

    if (uploadError) {
      console.error("Supabase upload error:", uploadError);
      return NextResponse.json(
        { success: false, error: uploadError.message },
        { status: 500 },
      );
    }

    // Arahkan QR Code ke halaman preview/download /p/[id]
    const origin = new URL(req.url).origin;
    const downloadPageUrl = `${origin}/p/${id}`;

    return NextResponse.json({
      success: true,
      id,
      url: downloadPageUrl,
    });
  } catch (err: any) {
    console.error("Upload API error:", err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 },
    );
  }
}
