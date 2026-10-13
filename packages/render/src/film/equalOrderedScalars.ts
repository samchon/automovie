import type { AutoMovieOrderedScalar } from "./AutoMovieOrderedScalar";

/** One position of a compared array: a scalar or a one-level row of scalars. */
type IOrderedEntry = AutoMovieOrderedScalar | readonly AutoMovieOrderedScalar[];

/**
 * Compare ordered arrays of scalars, or of arrays of scalars, by value.
 *
 * The domain is exactly what `validWaveAudioIdentity` compares: a speaker-label
 * array such as `["front-left", "front-right"]` and a one-row downmix matrix
 * such as `[[0.5, 0.5]]`. Arrays are equal when they have the same length and
 * every position holds equal scalars, or rows of the same length with equal
 * scalars; order and the scalar's type both count. `Object.is` decides each
 * scalar, so `NaN` equals `NaN` and `+0` differs from `-0`.
 *
 * A non-array argument returns false instead of being compared, so a record
 * cannot pass by lacking a `length`. Nesting deeper than one row, prototypes,
 * symbol keys, boxed primitives and cycles are outside the domain.
 *
 * @evidence contracts/common.md#principled-implementation A length check followed by a positional `Object.is` comparison is the definition of ordered-sequence equality over primitive leaves, applied once more for the single nesting level the matrix has; the premise that leaves are strings or numbers holds because the parameter type admits nothing else.
 * @evidence contracts/common.md#clear-and-simple-design One loop handles both shapes, descending only where a position holds a row, instead of a general deep equality whose answer would also depend on prototypes and key order the callers never compare.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No value or caller is special-cased; the non-array refusal is the stated domain boundary, not a compensation for a particular input.
 * @evidence contracts/common.md#meaningful-documentation The doc names the two compared shapes and their caller, the equality rule including order and type, the `Object.is` cases for `NaN` and signed zero, and what lies outside the domain.
 * @evidence contracts/performance.md#efficient-algorithms Time is linear in the total leaf count and stops at the first difference, with no allocation; every leaf must be read to prove equality, so no faster comparison exists.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure comparison of two small arrays coordinates no phases or requests whose work could be shared.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The function keeps no reference to its arguments after returning a boolean and opens no handle or task.
 */
export const equalOrderedScalars = (
  left: readonly IOrderedEntry[],
  right: readonly IOrderedEntry[],
): boolean => {
  if (Array.isArray(left) === false || Array.isArray(right) === false)
    return false;
  if (left.length !== right.length) return false;
  for (let at: number = 0; at < left.length; ++at) {
    const one: IOrderedEntry = left[at]!;
    const other: IOrderedEntry = right[at]!;
    if (Array.isArray(one) || Array.isArray(other)) {
      if (Array.isArray(one) === false || Array.isArray(other) === false)
        return false;
      const row: readonly AutoMovieOrderedScalar[] =
        one as readonly AutoMovieOrderedScalar[];
      const otherRow: readonly AutoMovieOrderedScalar[] =
        other as readonly AutoMovieOrderedScalar[];
      if (row.length !== otherRow.length) return false;
      for (let inner: number = 0; inner < row.length; ++inner)
        if (Object.is(row[inner], otherRow[inner]) === false) return false;
      continue;
    }
    if (Object.is(one, other) === false) return false;
  }
  return true;
};
