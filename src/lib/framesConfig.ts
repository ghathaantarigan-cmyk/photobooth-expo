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
    image: "/frames/frame-2-v1.png",
    slots: [
      { x: 140, y: 220, width: 800, height: 450 },
      { x: 140, y: 730, width: 800, height: 450 },
    ],
  },
  {
    id: "frame-2-v2",
    name: "2 Foto (Model B)",
    photoCount: 2,
    image: "/frames/frame-2-v2.png",
    slots: [
      { x: 140, y: 220, width: 800, height: 450 },
      { x: 140, y: 730, width: 800, height: 450 },
    ],
  },
  {
    id: "frame-3-v1",
    name: "3 Foto (Model A)",
    photoCount: 3,
    image: "/frames/frame-3-v1.png",
    slots: [
      { x: 140, y: 220, width: 800, height: 450 },
      { x: 140, y: 730, width: 800, height: 450 },
      { x: 140, y: 1240, width: 800, height: 450 },
    ],
  },
  {
    id: "frame-3-v2",
    name: "3 Foto (Model B)",
    photoCount: 3,
    image: "/frames/frame-3-v2.png",
    slots: [
      { x: 140, y: 220, width: 800, height: 450 },
      { x: 140, y: 730, width: 800, height: 450 },
      { x: 140, y: 1240, width: 800, height: 450 },
    ],
  },
];
