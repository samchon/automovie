import type { IAutoMovieMaterial } from "@automovie/interface";

/**
 * A material's base colour as a linear RGB triple, alpha dropped.
 *
 * The material's `baseColor` channels are already linear light in [0, 1], so
 * the triple is copied without conversion. Pigment rules that blend authored
 * finishes into textures read them through this one owner.
 *
 *
 * @evidence contracts/common.md#principled-implementation Copies already-linear baseColor r/g/b into a tuple and drops alpha; material admission owns range validity.
 * @evidence contracts/common.md#clear-and-simple-design One reader supplies pigment blending with linear channels rather than decoding them again.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No finish-specific correction or fallback substitutes the supplied channels.
 * @evidence contracts/common.md#meaningful-documentation Documents linear units, alpha omission and fresh tuple ownership.
 * @evidence contracts/performance.md#efficient-algorithms Three property reads and one fixed tuple allocation cost O(1) time/space.
 * @evidence contracts/performance.md#reuse-equivalent-work Reads current admitted material values rather than caching across mutable revisions.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the fresh RGB tuple; no material or texture resource is retained.
 *
 * @author Samchon
 */
export function materialBaseColourRgb(
  material: IAutoMovieMaterial,
): [number, number, number] {
  return [material.baseColor.r, material.baseColor.g, material.baseColor.b];
}
