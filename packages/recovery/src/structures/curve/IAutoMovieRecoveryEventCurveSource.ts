import type { IAutoMovieRecoveryEventCurveCoefficients } from "./IAutoMovieRecoveryEventCurveCoefficients";

/**
 * One immutable native cubic and the oriented interval used by an occurrence.
 *
 * @evidence contracts/common.md#principled-implementation Parent P0/P3 names refer to native endpoints even when start exceeds end.
 * @evidence contracts/common.md#clear-and-simple-design One complete curve owns native coefficients and phase width; occurrences retain only oriented normalized intervals.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Interior parameters do not borrow endpoint names.
 * @evidence contracts/common.md#meaningful-documentation Parent positions use millimetres; start and end use normalized native phase.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A record performs no arithmetic.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The caller owns parent sharing.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This type owns no runtime cache.
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
