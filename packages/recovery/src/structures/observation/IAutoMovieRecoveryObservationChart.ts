import type { IAutoMovieCurve64 as C } from "@automovie/engine";

/**
 * Current immutable closed-cycle observations and their requested features.
 *
 * @evidence contracts/development/design.md#principled-representation Physical points, persistent identities and observation ordinals retain source observations while an ordered relation transports their phase.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One named current-row input groups features with the points they address.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Identity gaps remain null and neither corners nor sampling requests invent source points.
 * @evidence contracts/development/common.md#meaningful-documentation Defines millimetres, borrowed populations and zero-based feature addresses.
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
