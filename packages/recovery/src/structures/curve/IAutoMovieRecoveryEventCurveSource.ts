import type { IAutoMovieRecoveryEventCurveCoefficients } from "./IAutoMovieRecoveryEventCurveCoefficients";

/**
 * One immutable native cubic and the oriented interval used by an occurrence.
 *
 * @evidence contracts/development/design.md#principled-representation Parent P0/P3 names refer to native endpoints even when start exceeds end.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One complete curve owns native coefficients and phase width; occurrences retain only oriented normalized intervals.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Interior parameters do not borrow endpoint names.
 * @evidence contracts/development/common.md#meaningful-documentation Parent positions use millimetres; start and end use normalized native phase.
 */
export interface IAutoMovieRecoveryEventCurveSource {
  /** Stable owner of all four native coefficients. */
  authority: string;

  /** Single-span native curve authority with millimetre coefficients and its original phase width. */
  curve: IAutoMovieRecoveryEventCurveCoefficients;

  /** Native P0 and P3 identity, independent of occurrence orientation. */
  endpointAuthorities: [string, string];

  /** First normalized native parameter, in [0,1]. */
  start: number;

  /** Last normalized native parameter, in [0,1]. */
  end: number;
}
