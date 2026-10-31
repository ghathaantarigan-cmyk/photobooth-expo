export interface FrameSlot {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface FrameConfig {
  id: string;
  name: string;
  photoCount: number;
  image: string;
  slots: FrameSlot[];
}

export const FRAMES: FrameConfig[] = [
  {
    id: "frame-2-v1",
    name: "2 Foto (Model A)",
    photoCount: 2,
    image: "/frames/frame-2.png", // Mengarahkan ke file frame-2.png yang ada
    slots: [
      { x: 90, y: 180, width: 900, height: 675 },
      { x: 90, y: 950, width: 900, height: 675 },
    ],
  },
  {
    id: "frame-2-v2",
    name: "2 Foto (Model B)",
    photoCount: 2,
    image: "/frames/frame-2.png", // Mengarahkan ke file frame-2.png yang ada
    slots: [
      { x: 90, y: 180, width: 900, height: 675 },
      { x: 90, y: 950, width: 900, height: 675 },
    ],
  },
  {
    id: "frame-3-v1",
    name: "3 Foto (Model A)",
    photoCount: 3,
    image: "/frames/frame-3.png", // Mengarahkan ke file frame-3.png yang ada
    slots: [
      { x: 90, y: 120, width: 900, height: 500 },
      { x: 90, y: 680, width: 900, height: 500 },
      { x: 90, y: 1240, width: 900, height: 500 },
    ],
  },
  {
    id: "frame-3-v2",
    name: "3 Foto (Model B)",
    photoCount: 3,
    image: "/frames/frame-3.png", // Mengarahkan ke file frame-3.png yang ada
    slots: [
      { x: 90, y: 120, width: 900, height: 500 },
      { x: 90, y: 680, width: 900, height: 500 },
      { x: 90, y: 1240, width: 900, height: 500 },
    ],
  },
];
