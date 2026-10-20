import type { IAutoMovieCurve64 as C } from "@automovie/engine/geometry/curve";

/**
 * Unit directions away from one point on either side of an oriented observation cycle.
 *
 * @evidence contracts/common.md#principled-implementation Separate outgoing and backward incoming directions preserve one-sided corners without implying derivative magnitude.
 * @evidence contracts/common.md#clear-and-simple-design The same tangent pair serves working transport entries and published rows.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts These directions do not establish a physical longitudinal jet or material motion.
 * @evidence contracts/common.md#meaningful-documentation States dimensionless unit directions and the sign of the incoming direction.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased pair performs no normalization.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This declaration owns no runtime cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The containing row or entry owns these vectors.
 */
export interface IAutoMovieRecoveryObservationTangents {
  /** Unit direction from the point toward increasing traversal phase. */
  out: C.Vector;

  /** Unit direction from the point toward the preceding traversal point, opposite the forward incoming derivative. */
  incoming: C.Vector;
}
