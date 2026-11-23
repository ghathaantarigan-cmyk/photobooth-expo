export interface FrameSlot {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface FrameConfig {
  id: string;
  name: string;
  orientation: "PORTRAIT" | "LANDSCAPE";
  photoCount: number;
  image: string;
  slots: FrameSlot[];
}

export const FRAMES: FrameConfig[] = [
  // ===================================================
  // FRAME 1 — EXPO UIN (3 FOTO VERTIKAL) — JANGAN DIUBAH
  // ===================================================
  {
    id: "portrait-3-expo",
    name: "3 Foto (Model Expo UIN)",
    orientation: "PORTRAIT",
    photoCount: 3,
    image: "/frames/frame1.png",
    slots: [
      { x: 150, y: 275, width: 850, height: 516 },
      { x: 150, y: 850, width: 850, height: 515 },
      { x: 150, y: 1410, width: 850, height: 524 },
    ],
  },

  // ===================================================
  // FRAME 2 — MODEL KLASIK (3 FOTO VERTIKAL)
  // Berdasarkan frame2_4.jpg
  // ===================================================
  {
    id: "portrait-3-model2",
    name: "3 Foto (Model Klasik)",
    orientation: "PORTRAIT",
    photoCount: 3,
    image: "/frames/frame2.png",
    slots: [
      { x: 150, y: 420, width: 872, height: 550 }, // Slot Atas
      { x: 150, y: 1015, width: 872, height: 550 }, // Slot Tengah
    ],
  },

  // ===================================================
  // FRAME 3 — MODEL ESTETIK (3 FOTO VERTIKAL)
  // Berdasarkan frame3_2.jpg
  // ===================================================
  {
    id: "portrait-3-model3",
    name: "3 Foto (Model Estetik)",
    orientation: "PORTRAIT",
    photoCount: 3,
    image: "/frames/frame3.png",
    slots: [
      { x: 150, y: 250, width: 872, height: 550 }, // Slot Atas
      { x: 150, y: 840, width: 872, height: 550 }, // Slot Tengah
      { x: 150, y: 1400, width: 872, height: 525 }, // Slot Bawah
    ],
  },
];
