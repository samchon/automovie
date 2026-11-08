import type { IAutoMovieCurve64 as C } from "@automovie/engine";

/**
 * Unit directions away from one point on either side of an oriented observation cycle.
 *
 * @evidence contracts/development/design.md#principled-representation Separate outgoing and backward incoming directions preserve one-sided corners without implying derivative magnitude.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The same tangent pair serves working transport entries and published rows.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts These directions do not establish a physical longitudinal jet or material motion.
 * @evidence contracts/development/common.md#meaningful-documentation States dimensionless unit directions and the sign of the incoming direction.
 */
export interface IAutoMovieRecoveryObservationTangents {
  /** Unit direction from the point toward increasing traversal phase. */
  out: C.Vector;

  /** Unit direction from the point toward the preceding traversal point, opposite the forward incoming derivative. */
  incoming: C.Vector;
}
