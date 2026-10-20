import type { IAutoMovieRecoveryEventCurvePiece } from "./IAutoMovieRecoveryEventCurvePiece";

/**
 * Ordered cubic occurrences with an optional retained normalized phase partition.
 *
 * @evidence contracts/common.md#principled-implementation Explicit knots preserve the declared phase rather than recomputing spatial correspondence.
 * @evidence contracts/common.md#clear-and-simple-design A closed arc declares periodic topology separately from endpoint checks.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Closure and shared phase alone do not certify a simple curve or immersed surface.
 * @evidence contracts/common.md#meaningful-documentation Knots span [0,1]; controls remain millimetres and original widths remain available.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A record performs no traversal.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The caller may share native parents.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources No hidden array lifetime is imposed.
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
