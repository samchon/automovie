/**
 * Data and callback contracts shared by the Monotone operations.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Writable indexed scalar storage holds one derivative per knot in ordinate units per abscissa unit. The numeric index signature permits arrays and typed buffers; sufficient capacity and admitted knot/value data remain caller premises.
 * @evidence contracts/development/design.md#principled-representation Writable indexed scalar storage holds one derivative per knot in ordinate units per abscissa unit.
 * @evidence contracts/development/design.md#minimal-and-owned-surface AutoMovieMonotone.slope writes this buffer for repeated scalar interpolation without requiring a specific array class.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The numeric index signature permits arrays and typed buffers; sufficient capacity and admitted knot/value data remain caller premises.
 */
export namespace IAutoMovieMonotone {
  /**
   * Caller-owned writable first-derivative slots for n knots, in ordinate units per knot unit. AutoMovieMonotone.slope overwrites the buffer; capacity is a caller precondition.
   *
   * Each interior slope starts as the mean of its two secants, or zero where
   * they differ in sign or either is zero; a segment whose slope ratios leave
   * the circle of radius 3 has both scaled back onto it; an open curve's end
   * slopes are its end secants. A periodic curve takes secants across the
   * wrap. One knot gives slope 0.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Writable slots 0 through n-1 hold Fritsch-Carlson first derivatives in ordinate units per knot unit. The index signature supports ordinary and typed arrays without a required length property; the caller supplies at least n writable slots.
   * @evidence contracts/development/design.md#principled-representation Writable slots 0 through n-1 hold Fritsch-Carlson first derivatives in ordinate units per knot unit.
   * @evidence contracts/development/design.md#minimal-and-owned-surface AutoMovieMonotone.slope fills this caller-owned buffer and evaluate reads the resulting slopes; the kernel retains no storage.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The index signature supports ordinary and typed arrays without a required length property; the caller supplies at least n writable slots.
   */
  export type ISlopeSlopes = { [index: number]: number };
}
