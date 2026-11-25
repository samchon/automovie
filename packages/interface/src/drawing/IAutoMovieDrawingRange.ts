/** Extreme-value fold result used by drawing extents and schedule measurements. */
export namespace IAutoMovieDrawingRange {
  /**
   * The lowest and highest of a run of numbers, folded in one pass.
   *
   * `Math.min(...values)` passes one argument per element and overflows the
   * call stack past roughly a hundred thousand values, which an ordinary
   * imported mesh exceeds, so every extreme the drawing and schedule
   * derivations take is folded here instead. Any iterable is accepted, so a
   * caller can stream values without building an array.
   *
   * An empty run yields the identities `{ min: +Infinity, max: -Infinity }`, so
   * a caller that forgot to check for emptiness sees an inverted range rather
   * than a thrown `undefined`. `NaN` values are skipped by the comparisons.
   *
   * The same identity pair also results from an all-NaN run. Infinite input
   * values participate normally. The producer imposes no units, finiteness,
   * ordering validation or grid rounding; callers supply a common unit and
   * decide whether sentinel or non-finite results are usable. The returned
   * record is fresh and mutable.
   */
  export type IResult = {
    /**
     * Least non-NaN input, or +Infinity if no value compares below the initial
     * identity.
     */
    min: number;

    /**
     * Greatest non-NaN input, or -Infinity if no value compares above the
     * initial identity.
     */
    max: number;
  };
}
