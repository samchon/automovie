import type { IAutoMovieRecoveryEventCurveSource } from "./IAutoMovieRecoveryEventCurveSource";

/**
 * One restricted cubic with a positive width in its enclosing chart.
 *
 * @evidence contracts/development/design.md#principled-representation The native curve and oriented interval determine the occurrence without a duplicate coefficient net.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The positive width defines phase independently of spatial length.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Width is neither a fitted tangent speed nor material transport evidence.
 * @evidence contracts/development/common.md#meaningful-documentation The native curve retains millimetre coefficients and original phase width; width uses the enclosing chart unit.
 */
export interface IAutoMovieRecoveryEventCurvePiece {
  /** Positive phase interval width. */
  width: number;

  /** Original native coefficient authority. */
  source: IAutoMovieRecoveryEventCurveSource;
}
