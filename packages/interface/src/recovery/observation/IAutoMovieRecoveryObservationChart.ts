import type { AutoMovieVector3Tuple } from "../../index";

/** Current immutable closed-cycle observations and their requested features. */
export interface IAutoMovieRecoveryObservationChart {
  /** Caller-supplied name retained by the transported row. */
  name: string;

  /**
   * Borrowed closed-cycle points in millimetres, without repeating the first
   * point.
   */
  pointsMm: readonly Readonly<AutoMovieVector3Tuple>[];

  /** Same-order persistent identities; null means no declared identity. */
  anchorIds: readonly (string | null)[];

  /** Zero-based current-point indices requiring one-sided corner tangents. */
  corners: readonly number[];

  /** Zero-based current-point indices requested in the transported schedule. */
  schedule: readonly number[];
}
