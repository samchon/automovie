import type { IAutoMovieRecoveryEventCurvePiece } from "./IAutoMovieRecoveryEventCurvePiece";

/**
 * Ordered cubic occurrences with an optional retained normalized phase partition.
 *
 * @evidence contracts/development/design.md#principled-representation Explicit knots preserve the declared phase rather than recomputing spatial correspondence.
 * @evidence contracts/development/design.md#minimal-and-owned-surface A closed arc declares periodic topology separately from endpoint checks.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Closure and shared phase alone do not certify a simple curve or immersed surface.
 * @evidence contracts/development/common.md#meaningful-documentation Knots span [0,1]; controls remain millimetres and original widths remain available.
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
