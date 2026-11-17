import type { AutoMovieVector2Tuple } from "../index";

/** One positive-weight rational quadratic over an original source interval.
 * Its parameter runs independently from zero to one; domain only registers
 * the source interval, since a fitted conic need not retain source speed.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States normalized conic parameter, source registration and sampled error meaning.
 * @evidence contracts/development/design.md#principled-representation Three planar controls and one positive middle weight encode exactly a rational quadratic, including explicitly admitted straight lines.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Ahn and Ghosh fitting, conic evaluation and the compact curve's conic arm share these coefficients; compact fitting forwards the same record and may refresh its sampled error.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No dense source samples or original topology is retained in the result.
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
