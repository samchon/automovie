/**
 * Throws `<path> must be finite and positive.` unless `value` is a finite
 * number greater than zero.
 *
 * The film-grammar read refuses a malformed observation instead of reporting
 * it, so a threshold, a duration, a lens or a subject height that is zero,
 * negative, `NaN` or infinite stops the read before any projection divides by
 * it.
 *
 * @param value Number that must be finite and greater than zero.
 * @param path Dotted name of the field, used as the message prefix.
 *
 * @evidence contracts/common.md#principled-implementation `Number.isFinite` rejects `NaN` and both infinities in one test, and the strict `<= 0` comparison then rejects zero and negatives, so the only values that pass are the ones a division or a logarithm in the read can take.
 * @evidence contracts/common.md#clear-and-simple-design One rule shared by `readFilmGrammar` for its two thresholds and by `normalizeGrammarShot` for durations, lenses, aspects and heights, so every positive field of the grammar input fails with the same wording.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No field or caller is special-cased; the value is never clamped or replaced by a default, only accepted or refused.
 * @evidence contracts/common.md#meaningful-documentation States the exact message, which values pass, why the read throws rather than reports, and each parameter's role.
 * @evidenceExclude contracts/performance.md#efficient-algorithms One finiteness test and one comparison, with no algorithm to choose.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A check of one number per call that coordinates no work across calls.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Allocates nothing on the accepting path and retains nothing; the thrown error is owned by the caller.
 */
export const assertGrammarPositive = (value: number, path: string): void => {
  if (Number.isFinite(value) === false || value <= 0)
    throw new Error(`${path} must be finite and positive.`);
};
