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
 * @param values Numbers to fold.
 * @returns The smallest and largest value seen.
 *
 * @evidence contracts/common.md#principled-implementation A single comparison fold, which is exact for the extremes of any finite sequence and has no argument-count limit; the stated limitation is that `NaN` compares false and is therefore ignored rather than propagated.
 * @evidence contracts/common.md#clear-and-simple-design One helper owns the extreme fold for the whole drawing folder, so no caller reintroduces a spread over an unbounded array.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No input size or caller is special-cased; the empty case returns the mathematical identities instead of a sentinel chosen to satisfy one caller.
 * @evidence contracts/common.md#meaningful-documentation The comment states why spreading is unsafe, that any iterable works, the empty result and the `NaN` behavior.
 * @evidence contracts/performance.md#efficient-algorithms One pass over the `n` values with constant extra space, the minimum for extremes that depend on every value.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure fold over its argument; there is no repeated request to share.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Holds two numbers during the fold and returns them; nothing is retained.
 * @author Samchon
 */
export const autoMovieDrawingRange = (
  values: Iterable<number>,
): { min: number; max: number } => {
  let min: number = Number.POSITIVE_INFINITY;
  let max: number = Number.NEGATIVE_INFINITY;
  for (const value of values) {
    if (value < min) min = value;
    if (value > max) max = value;
  }
  return { min, max };
};
