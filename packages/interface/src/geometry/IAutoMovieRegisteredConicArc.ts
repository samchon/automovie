import type { AutoMovieVector2Tuple } from "../index";

/**
 * One positive-weight rational quadratic with its original source interval.
 * Evaluate the conic over an independent parameter from zero through one. The
 * source interval preserves correspondence without defining the fitted curve's
 * parameter speed.
 */
export interface IAutoMovieRegisteredConicArc {
  /** Source interval represented by this coefficient record. */
  domain: readonly [number, number];

  /** Start point, middle projective control and end point in millimetres. */
  controls: readonly [
    Readonly<AutoMovieVector2Tuple>,
    Readonly<AutoMovieVector2Tuple>,
    Readonly<AutoMovieVector2Tuple>,
  ];

  /** Positive finite middle weight; endpoint weights are exactly one. */
  weight: number;

  /**
   * Largest sampled geometric discrepancy in millimetres over the registered
   * source interval.
   */
  maximumSampleErrorMm: number;
}
