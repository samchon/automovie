/**
 * Refuse a discrete sampling count that is not a safe integer of at least
 * `least`, such as the segment count of a revolved profile.
 *
 * `label` names the count in the thrown message, which reads
 * `<label> must be a safe integer >= <least>`. The check runs before the
 * builder allocates any buffer sized by the count.
 *
 * @param value Count the author supplied.
 * @param least Smallest count the operation can build from.
 * @param label Name of the count in the diagnostic.
 *
 * @evidence contracts/common.md#principled-implementation `Number.isSafeInteger` rejects fractions, NaN, infinities and integers past 2^53 in one documented predicate, so the count can index arrays exactly before the lower bound is compared.
 * @evidence contracts/common.md#clear-and-simple-design A shared admission helper for procedural builders, so each builder states only its own minimum and label rather than repeating the integer test.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A bad count throws instead of being rounded or clamped into a mesh the author did not ask for.
 * @evidence contracts/common.md#meaningful-documentation States what is refused, the exact message shape, and that it runs before allocation.
 * @evidenceExclude contracts/performance.md#efficient-algorithms One integer predicate and one comparison per call, before any allocation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each builder admits its own count once per call, so nothing repeats.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Holds nothing; only the thrown error is allocated on refusal.
 */
export const countAtLeast = (
  value: number,
  least: number,
  label: string,
): void => {
  if (!Number.isSafeInteger(value) || value < least)
    throw new Error(`${label} must be a safe integer >= ${least}`);
};
