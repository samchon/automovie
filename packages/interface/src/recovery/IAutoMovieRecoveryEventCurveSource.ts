import type { IAutoMovieRecoveryEventCurveCoefficients } from "..";

/** One immutable native cubic and the oriented interval used by an occurrence. */
export interface IAutoMovieRecoveryEventCurveSource {
  /** Stable owner of all four native coefficients. */
  authority: string;

  /**
   * Single-span native curve authority with millimetre coefficients and its
   * original phase width.
   */
  curve: IAutoMovieRecoveryEventCurveCoefficients;

  /** Native P0 and P3 identity, independent of occurrence orientation. */
  endpointAuthorities: [string, string];

  /** First normalized native parameter, in [0,1]. */
  start: number;

  /** Last normalized native parameter, in [0,1]. */
  end: number;
}
