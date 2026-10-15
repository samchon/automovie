import { Finish } from "./Finish";

export const templeMaterialPalette: Record<
  Finish, {
    color: number;
    roughness: number;
    metallic: number;
    scale: number;
    image: string | null;
  }
> = {
  limestone: {
    color: 0xc9c0ad,
    roughness: 0.86,
    metallic: 0,
    scale: 1,
    image: "stone",
  },
  paving: {
    color: 0xc9c0ad,
    roughness: 0.9,
    metallic: 0,
    scale: 2,
    image: "paving",
  },
  "paving-small": {
    color: 0xc9c0ad,
    roughness: 0.9,
    metallic: 0,
    scale: 1,
    image: "paving",
  },
  dado: {
    color: 0x866350,
    roughness: 0.94,
    metallic: 0,
    scale: 1.5,
    image: "plaster",
  },
  "dark-metal": {
    color: 0x574b39,
    roughness: 0.39,
    metallic: 0.82,
    scale: 0.18,
    image: null,
  },
  "dark-wood": {
    color: 0x795339,
    roughness: 0.78,
    metallic: 0,
    scale: 1,
    image: "timber",
  },
  terracotta: {
    color: 0x9a684b,
    roughness: 0.72,
    metallic: 0,
    scale: 0.22,
    image: null,
  },
  "roof-terracotta": {
    color: 0x874b38,
    roughness: 0.84,
    metallic: 0,
    scale: 0.5,
    image: "tile",
  },
  wicker: {
    color: 0xa58658,
    roughness: 0.96,
    metallic: 0,
    scale: 0.11,
    image: null,
  },
  parchment: {
    color: 0xc6aa77,
    roughness: 0.92,
    metallic: 0,
    scale: 0.16,
    image: null,
  },
  linen: {
    color: 0x8a7564,
    roughness: 0.98,
    metallic: 0,
    scale: 0.25,
    image: "textile",
  },
  "rope-fibre": {
    color: 0x96805c,
    roughness: 0.96,
    metallic: 0,
    scale: 0.1,
    image: null,
  },
  soil: {
    color: 0x8c795c,
    roughness: 1,
    metallic: 0,
    scale: 0.25,
    image: "earth",
  },
  "distant-earth": {
    color: 0x827e69,
    roughness: 1,
    metallic: 0,
    scale: 1,
    image: null,
  },
  water: {
    color: 0x668b91,
    roughness: 0.2,
    metallic: 0,
    scale: 0.5,
    image: null,
  },
  foliage: {
    color: 0x526448,
    roughness: 1,
    metallic: 0,
    scale: 0.28,
    image: null,
  },
  plaster: {
    color: 0xcdb68e,
    roughness: 0.96,
    metallic: 0,
    scale: 1.5,
    image: "plaster",
  },
};
