import type { IAutoMovieDrawingRange } from "@automovie/interface";

/*
 * The lowest and highest of a run of numbers, folded in one pass.
 *
 * `Math.min(...values)` passes one argument per element and overflows the call
 * stack past roughly a hundred thousand values, which an ordinary imported mesh
 * exceeds, so every extreme the drawing and schedule derivations take is folded
 * here instead. Any iterable is accepted, so a caller can stream values without
 * building an array.
 *
 * An empty run yields the identities `{ min: +Infinity, max: -Infinity }`, so a
 * caller that forgot to check for emptiness sees an inverted range rather than
 * a thrown `undefined`. `NaN` values are skipped by the comparisons.
 * Parameter values: Numbers to fold.
 * Returns: The smallest and largest value seen.
 */
export const drawingRange = (
  values: Iterable<number>,
): IAutoMovieDrawingRange.IResult => {
  let min: number = Number.POSITIVE_INFINITY;
  let max: number = Number.NEGATIVE_INFINITY;
  for (const value of values) {
    if (value < min) min = value;
    if (value > max) max = value;
  }
  return { min, max };
};
