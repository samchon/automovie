import { IAutoMoviePatternTextureTransform } from "./IAutoMoviePatternTextureTransform";

/**
 * UV transforms and the occurrences that transform cannot express.
 *
 * Produced by `autoMoviePatternTextureTransforms` over every placement of the
 * run, whole or cut, whatever its zone's material; each placement lands in
 * exactly one of the two lists. A caller texturing several materials calls
 * once per material and keeps the occurrences of that material's zones.
 *
 * @evidence contracts/development/design.md#principled-representation Every placement is classified once by the producer's relative row-skew test. Under its generated-data and finite-intermediate premises, tolerated maps become transforms and over-tolerance maps become sheared ids; the lists partition placements, without proving exact zero skew.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Two lists mirror the instancing result's slot-and-remainder split, so a caller handles both outputs the same way.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts One call states one material sheet; a multi-material caller filters by zone material rather than this producer guessing per zone.
 * @evidence contracts/development/common.md#meaningful-documentation States the producer, that each placement lands in exactly one list, the per-material call convention, and the order of both lists.
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
