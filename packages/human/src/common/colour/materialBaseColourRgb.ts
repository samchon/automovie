import type { IAutoMovieMaterial } from "@automovie/interface";

/**
 * A material's base colour as a linear RGB triple, alpha dropped.
 *
 * The material's `baseColor` channels are already linear light in [0, 1], so
 * the triple is copied without conversion. Pigment rules that blend authored
 * finishes into textures read them through this one owner.
 *
 * @author Samchon
 */
export function materialBaseColourRgb(
  material: IAutoMovieMaterial,
): [number, number, number] {
  return [material.baseColor.r, material.baseColor.g, material.baseColor.b];
}
