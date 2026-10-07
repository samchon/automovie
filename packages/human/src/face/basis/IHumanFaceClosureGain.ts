/**
 * The closure gains one state applies per unit closure weight.
 *
 * `ratio` is the central pair's gain, applied to every closure row off the
 * lips surface and away from the fissure. `lips` holds one gain per vertex of
 * the lips surface: each margin chain vertex's solved contact gain, blending to
 * `ratio` away from the fissure.
 *
 * @evidence contracts/common.md#principled-implementation The per-vertex field is exact at every margin chain vertex, so the margin closes at weight one.
 * @evidence contracts/common.md#clear-and-simple-design The central gain and one array for the lips surface.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The field is computed per state, never stored per person.
 * @evidence contracts/common.md#meaningful-documentation States where each gain applies.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The record names no part.
 * @evidence contracts/modeling.md#parameter-channels Gains scale the closure channel's rows per unit weight.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The record emits no geometry.
 * @evidenceExclude contracts/modeling.md#spatial-conventions Gains are dimensionless.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The record builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The summary reports the resulting apertures.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The gains carry no anatomical value of their own.
 * @evidenceExclude contracts/anatomy.md#permitted-range The field's construction refuses beyond the tissue budget.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The record is derived, not an input.
 * @author Samchon
 */
export interface IHumanFaceClosureGain {
  /** The central pair's gain per unit closure weight. */
  ratio: number;

  /** Gain per unit closure weight for each vertex of the lips surface. */
  lips: Float64Array;
}
