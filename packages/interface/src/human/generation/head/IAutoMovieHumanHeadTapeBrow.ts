/** Type contracts exchanged by AutoMovieHumanHeadTapeBrow; runtime evaluation remains in Human. */
export namespace IAutoMovieHumanHeadTapeBrow {
  /**
   * How the posterior anchor is searched.
   *
   * `complete` scans every original source station and knot midpoint of the
   * ownership interval and refines each observed local maximum: the search's
   * definition of the maximizing course. `continued` refines only the local
   * maximum next to a seed from a neighbouring member of the same source family,
   * and falls back to `complete` whenever the seed is not a local maximum of its
   * two neighbouring scan sites. A continued result is therefore a local
   * maximum; `AutoMovieHumanHeadTape.close` certifies its final member with
   * `complete` before publishing it.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation How the posterior anchor is searched.
   * @evidence contracts/development/design.md#principled-representation How the posterior anchor is searched. The closed alternatives are "complete", "continued".
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by AutoMovieHumanHeadTape.solve, AutoMovieHumanHeadTapeBrow.maximum.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanHeadTape.solve, AutoMovieHumanHeadTapeBrow.maximum for how the posterior anchor is searched.
   */
  export type Mode = "complete" | "continued";

  /** Actual unchanged ear attachment in the sagittal calibration-mm chart.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation Actual unchanged ear attachment in the sagittal calibration-mm chart.
   * @evidence contracts/development/design.md#principled-representation Actual unchanged ear attachment in the sagittal calibration-mm chart. The outer tuple/array is readonly; nested element types determine whether their contents can change.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by AutoMovieHumanHeadTapeBrow.maximum.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanHeadTapeBrow.maximum, AutoMovieHumanHeadTapeBrow.evaluate for actual unchanged ear attachment in the sagittal calibration-mm chart.
   */
  export type P2 = readonly [number, number];

  /** The seed argument of AutoMovieHumanHeadTapeBrow.maximum. Maximize the observed posterior course at a fixed original brow seat.
  A local maximum bracketed by two scan sites is refined by Brent's method
  for a one-dimensional extremum without derivatives (R. P. Brent,
  Algorithms for Minimization without Derivatives, 1973, ch. 5: golden-section
  steps safeguarding successive parabolic interpolation). It replaces the
  former pure golden-section refinement with the same termination: the
  retained bracket is at most 1e-7 of the ownership span. Golden section
  shrinks the bracket by 0.618 per measurement, about 33 measurements from a
  two-site bracket; Brent's parabolic steps converge superlinearly near the
  smooth maximum of the course length, and its golden safeguard keeps the
  worst case near the golden-section count. Both locate the same local
  maximum to that bracket; at the maximum the length is stationary, so the
  course length differs between them by about half its second derivative
  times the squared bracket, far below the closure's 1e-8 mm residual.
  Inadmissible planes (below an ear attachment) read as minus infinity and
  force golden steps, exactly as the comparisons of the former search did.
   *
 *
 * @evidence contracts/development/common.md#meaningful-documentation Maximize the observed posterior course at a fixed original brow seat.
 * @evidence contracts/development/design.md#principled-representation Maximize the observed posterior course at a fixed original brow seat. The outer tuple/array is readonly; nested element types determine whether their contents can change.
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanHeadTapeBrow.MaximumSeed is the canonical exchange used by AutoMovieHumanHeadTapeBrow.maximum.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanHeadTapeBrow.maximum for maximize the observed posterior course at a fixed original brow seat.
 */
  export type MaximumSeed = readonly [number, number];
}
