import { IAutoMoviePatternTextureTransform } from "./IAutoMoviePatternTextureTransform";

/**
 * UV transforms and the occurrences that transform cannot express.
 *
 * Produced by `autoMoviePatternTextureTransforms` over every placement of the
 * run, whole or cut, whatever its zone's material; each placement lands in
 * exactly one of the two lists. A caller texturing several materials calls
 * once per material and keeps the occurrences of that material's zones.
 *
 * @evidence contracts/common.md#principled-implementation Partitions placements by whether their UV map is shear-free, its two rows perpendicular within a relative `1e-9`, so every placement is either expressed exactly or named.
 * @evidence contracts/common.md#clear-and-simple-design Two lists shaped like `IAutoMoviePatternInstancing`, so a caller treats representable and unrepresentable pieces the same way on the instancing and texturing paths.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Applies no material filter of its own and never forces a sheared piece into a transform; the caller selects occurrences by zone material.
 * @evidence contracts/common.md#meaningful-documentation States the producer, that both whole and cut pieces of every material are covered, the per-material call convention, the shear criterion and list order.
 * @evidenceExclude contracts/performance.md#cost-and-resources A result record from one linear pass over all placements; the per-material calling convention repeats that pass for each material, including pieces the caller then discards.
 * @author Samchon
 */
export interface IAutoMoviePatternTexturing {
  /** One transform per expressible occurrence, in placement order. */
  transforms: IAutoMoviePatternTextureTransform[];

  /**
   * Occurrence ids whose sampling needs a shear the transform has no term for,
   * in placement order.
   */
  sheared: string[];
}
