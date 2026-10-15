import { srgbHexToLinearColor } from "@automovie/engine";
import type { IAutoMovieMaterial } from "@automovie/interface";

/** Convert the authored sRGB swatch once to scene-linear PBR values. */

export const houseMaterial = (
  id: string,
  hex: string,
  roughness: number,
  optics: Partial<
    Pick<
      IAutoMovieMaterial, "metallic" | "transmission" | "ior" | "thickness" | "doubleSided"
    >
  > = {}
): IAutoMovieMaterial => ({
  id,
  name: id.replaceAll("-", " "),
  baseColor: srgbHexToLinearColor(hex),
  metallic: 0,
  roughness,
  emissive: null,
  opacity: 1,
  baseColorTexture: null,
  ...optics,
});
