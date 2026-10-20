import type { IAutoMovieCurve64 as C } from "@automovie/engine/geometry/curve";

/**
 * Current immutable closed-cycle observations and their requested features.
 *
 * @evidence contracts/common.md#principled-implementation Physical points, persistent identities and observation ordinals retain source observations while an ordered relation transports their phase.
 * @evidence contracts/common.md#clear-and-simple-design One named current-row input groups features with the points they address.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Identity gaps remain null and neither corners nor sampling requests invent source points.
 * @evidence contracts/common.md#meaningful-documentation Defines millimetres, borrowed populations and zero-based feature addresses.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased input contract performs no observation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This declaration owns no runtime cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The caller retains its immutable arrays throughout synchronous transport.
 */
export interface IAutoMovieRecoveryObservationChart {
  /** Caller-supplied name retained by the transported row. */
  name: string;

  /** Borrowed closed-cycle points in millimetres, without repeating the first point. */
  pointsMm: readonly C.Vector[];

  /** Same-order persistent identities; null means no declared identity. */
  anchorIds: readonly (string | null)[];

  /** Zero-based current-point indices requiring one-sided corner tangents. */
  corners: readonly number[];

  /** Zero-based current-point indices requested in the transported schedule. */
  schedule: readonly number[];
}
