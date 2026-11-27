/** Data and callback contracts shared by the Monotone operations. */
export namespace IAutoMovieMonotone {
  /**
   * Caller-owned writable first-derivative slots for n knots, in ordinate units
   * per knot unit. AutoMovieMonotone.slope overwrites the buffer; capacity is a
   * caller precondition.
   *
   * Each interior slope starts as the mean of its two secants, or zero where
   * they differ in sign or either is zero; a segment whose slope ratios leave
   * the circle of radius 3 has both scaled back onto it; an open curve's end
   * slopes are its end secants. A periodic curve takes secants across the wrap.
   * One knot gives slope 0.
   */
  export type ISlopeSlopes = { [index: number]: number };
}
