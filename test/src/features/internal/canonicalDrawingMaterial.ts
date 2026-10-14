import { IAutoMovieMaterial } from "@automovie/interface";

/** A fresh flat gray material, identified by the authored finish id. */
export const canonicalDrawingMaterial: (id: string) => IAutoMovieMaterial = (id: string): IAutoMovieMaterial => ({
  id,
  name: null,
  baseColor: { r: 0.5, g: 0.5, b: 0.5, a: 1, hex: null },
  metallic: 0,
  roughness: 1,
  emissive: null,
  opacity: 1,
  baseColorTexture: null,
});
