import type { AutoMovieVector2Tuple } from "../index";

/**
 * One positive-weight rational quadratic over an original source interval. Its
 * parameter runs independently from zero to one; domain only registers the
 * source interval, since a fitted conic need not retain source speed.
 */
export interface IAutoMovieRegisteredConicArc {
  /** Source interval represented by this coefficient record. */
  domain: readonly [number, number];

  /** Endpoint, tangent intersection, endpoint in the same millimetre frame. */
  controls: readonly [
    Readonly<AutoMovieVector2Tuple>,
    Readonly<AutoMovieVector2Tuple>,
    Readonly<AutoMovieVector2Tuple>,
  ];

  /** Positive finite middle weight; endpoint weights are exactly one. */
  weight: number;

  /** Largest sampled geometric discrepancy, not a certified supremum. */
  maximumSampleErrorMm: number;
}
