/**
 * Extreme-value fold result used by drawing extents and schedule measurements.
 *
 * @evidence contracts/development/design.md#principled-representation IResult preserves input units and comparison extrema, including inverted empty/all-NaN identities; it asserts no finite-range invariant.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Drawing bounds, depth classification and schedule minima use this common fold result while retaining physical semantics at their callers.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No special empty-input zero or finite-value clamp hides missing measurements.
 * @evidence contracts/development/common.md#meaningful-documentation IResult documents sentinel values, infinities, NaN handling and absent rounding.
 */
export namespace IAutoMovieDrawingRange {
  /**
   * The lowest and highest of a run of numbers, folded in one pass.
   *
   * `Math.min(...values)` passes one argument per element and overflows the call
   * stack past roughly a hundred thousand values, which an ordinary imported
   * mesh exceeds, so every extreme the drawing and schedule derivations take is
   * folded here instead. Any iterable is accepted, so a caller can stream values
   * without building an array.
   *
   * An empty run yields the identities `{ min: +Infinity, max: -Infinity }`, so a
   * caller that forgot to check for emptiness sees an inverted range rather than
   * a thrown `undefined`. `NaN` values are skipped by the comparisons.
   *
   * The same identity pair also results from an all-NaN run. Infinite input values participate normally. The producer imposes no units, finiteness, ordering validation or grid rounding; callers supply a common unit and decide whether sentinel or non-finite results are usable. The returned record is fresh and mutable.
   *
   * @evidence contracts/development/design.md#principled-representation Two numbers carry comparison extrema in the input's unit; min <= max is conditional on at least one non-NaN input and is deliberately not a type invariant.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Drawing depth bands, world extents and schedule section minima share this unscaled fold; their distinct physical meanings stay at their callers.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Empty/all-NaN inputs retain mathematical fold identities instead of fabricating zero dimensions, and infinities are not silently rejected or clamped.
   * @evidence contracts/development/common.md#meaningful-documentation Defines empty/all-NaN behavior, units, infinities, absent rounding and caller-owned result mutability.
   */
  export type IResult = {
    /** Least non-NaN input, or +Infinity if no value compares below the initial identity. */
    min: number;

    /** Greatest non-NaN input, or -Infinity if no value compares above the initial identity. */
    max: number;
  };
}
