/**
 * Whether a value is a safe integer index into a population of `count`. The caller supplies the admitted nonnegative population count; this predicate validates the candidate, not the population metadata.
 *
 * @evidence contracts/common.md#principled-implementation Safe-integer admission and the half-open interval [0,count) implement source-domain index membership.
 * @evidence contracts/common.md#clear-and-simple-design One pure boolean predicate separates candidate membership from the caller's population validation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Fractions, negative IDs and unsafe integers fail without coercion; count validity remains an explicit caller premise.
 * @evidence contracts/common.md#meaningful-documentation Prose states candidate domain and which operand this helper admits.
 * @evidence contracts/performance.md#efficient-algorithms Fixed scalar checks use constant time and space.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This pure scalar membership test coordinates no requests or retained source lookup.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Scalar comparison acquires no retained data, handles or running tasks.
 */
export function isHumanPersonSourceIndex(
  value: number,
  count: number,
): boolean {
  return Number.isSafeInteger(value) && value >= 0 && value < count;
}
