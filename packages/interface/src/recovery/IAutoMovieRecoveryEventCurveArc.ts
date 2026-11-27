import type { IAutoMovieRecoveryEventCurvePiece } from "..";

/**
 * Ordered cubic occurrences with an optional retained normalized phase
 * partition.
 */
export interface IAutoMovieRecoveryEventCurveArc {
  /** Stable named path. */
  id: string;

  /** Declared periodic topology. */
  closed: boolean;

  /** Ordered oriented cubic occurrences. */
  pieces: IAutoMovieRecoveryEventCurvePiece[];

  /** Optional exact normalized partition, including both 0 and 1. */
  canonicalKnots?: number[];
}
