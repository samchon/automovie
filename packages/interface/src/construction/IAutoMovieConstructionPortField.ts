/**
 * A periodic scalar on a port's clock, read with the two derivatives a band's jets need: a port curve's share between its columns, a
 * curved rail's station, the band's cross speed on each side and its correspondence to the part's phase.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the fields carry and why they need derivatives.
 * @evidence contracts/development/design.md#principled-representation One C2 periodic law, the uniform periodic cubic spline, joins every per-column value of a port, the same law the curved rail already declares.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The field record and its two constructors.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No sampled bound, no clamp.
 */
export namespace IAutoMovieConstructionPortField {
  /**
   * A periodic scalar on a clock: its value with two derivatives, the bounds its controls set on every value, and the bounds of its
   * first derivative.
   *
   * @evidence contracts/development/design.md#principled-representation A C2 periodic field read with its derivatives, with the convex-hull bounds an admission can rely on without sampling.
   * @evidence contracts/development/design.md#minimal-and-owned-surface A reader and two closed intervals.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The bounds are the representation's own, not sampled extremes.
   * @evidence contracts/development/common.md#meaningful-documentation States each member's units.
   */
  export interface IField {
    /**
     * The value and its first and second derivatives in the clock, radians.
     */
    at: (psi: number) => [number, number, number];

    /** Bounds enclosing every value: the extreme controls, since each value is a convex combination of them. */
    bounds: [number, number];

    /** Bounds enclosing every first derivative, per span the extremes of its quadratic. */
    slopes: [number, number];

    /**
     * Bounds enclosing every value over a clock interval: the extreme controls of the spans the interval meets, so an admission can
     * hold a reading inside a domain where it is read instead of by the whole loop's extremes.
     */
    range: (from: number, to: number) => [number, number];
  }
}
