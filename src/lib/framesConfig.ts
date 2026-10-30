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
    id: 'frame-2',
    name: '2 Photos Frame',
    photoCount: 2,
    image: '/frames/frame-2.png',
    slots: [
      { x: 140, y: 200, width: 800, height: 533 },
      { x: 140, y: 800, width: 800, height: 533 },
    ],
  },
  {
    id: 'frame-3',
    name: '3 Photos Frame',
    photoCount: 3,
    image: '/frames/frame-3.png',
    slots: [
      { x: 140, y: 150, width: 800, height: 450 },
      { x: 140, y: 650, width: 800, height: 450 },
      { x: 140, y: 1150, width: 800, height: 450 },
    ],
  },
  {
    id: 'frame-4',
    name: '4 Photos Frame',
    photoCount: 4,
    image: '/frames/frame-4.png',
    slots: [
      { x: 120, y: 200, width: 400, height: 300 },
      { x: 560, y: 200, width: 400, height: 300 },
      { x: 120, y: 550, width: 400, height: 300 },
      { x: 560, y: 550, width: 400, height: 300 },
    ],
  },
];