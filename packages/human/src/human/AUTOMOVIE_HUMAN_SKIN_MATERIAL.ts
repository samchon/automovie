import { IAutoMovieMaterial } from "@automovie/interface";

/** Neutral placeholder skin material until the appearance stage decides it. */
export const AUTOMOVIE_HUMAN_SKIN_MATERIAL: IAutoMovieMaterial = {
  id: "skin",
  name: "skin",
  baseColor: { r: 0.8, g: 0.62, b: 0.52, a: null, hex: null },
  metallic: 0,
  roughness: 0.55,
  emissive: null,
  opacity: 1,
  baseColorTexture: null,
};
