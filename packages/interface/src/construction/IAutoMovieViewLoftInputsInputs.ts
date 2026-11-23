import type { AutoMovieViewLoftInputsQuarters } from "./AutoMovieViewLoftInputsQuarters";
import type { AutoMovieViewLoftInputsScalar } from "./AutoMovieViewLoftInputsScalar";

/**
 * Prepared raw scalar readers used by ViewLoft admission and cap-ring density.
 *
 * Every argument is physical station in millimetres. The factory reuses
 * retained direct outline preparations or prepares generic-girth outlines once;
 * closures keep those preparations and the report callback alive until
 * released. They do not mutate the prepared sources, which must remain
 * unchanged. A failed read calls report with source identity and returns NaN,
 * while exceptions from report propagate. Quarter calls return fresh mutable
 * four-entry arrays. These are values before sign conversion and effective cap
 * shoulder adjustment, not physical derivative capabilities.
 */
export interface IAutoMovieViewLoftInputsInputs {
  /**
   * Raw front-positive u coordinate in local millimetres, before box admission;
   * the reader preserves the authored sign and declared pole closure.
   */
  lateral: AutoMovieViewLoftInputsScalar;

  /**
   * Raw front-negative u coordinate in local millimetres, normally negative;
   * ViewLoft negates it to obtain the positive -u half extent. Declared pole
   * closure is retained.
   */
  medial: AutoMovieViewLoftInputsScalar;

  /**
   * Raw side-positive v coordinate in local millimetres before box admission,
   * retaining the original outline's pole parameter.
   */
  ahead: AutoMovieViewLoftInputsScalar;

  /**
   * Raw side-negative v coordinate in local millimetres, normally negative;
   * ViewLoft negates it to obtain the positive -v half extent.
   */
  behind: AutoMovieViewLoftInputsScalar;

  /**
   * Original girth in millimetres for girth mode, dimensionless common shoulder
   * share for shoulder mode, and constant zero for top mode where quarters own
   * fullness directly.
   */
  owner: AutoMovieViewLoftInputsScalar;

  /**
   * Four dimensionless top shoulders or common-shoulder departures in
   * increasing quarter order; absent departures produce four exact zeros.
   */
  shoulders: AutoMovieViewLoftInputsQuarters;
}
