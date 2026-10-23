/**
 * Tests an optional byte against an inclusive range.
 *
 * @evidence contracts/common.md#principled-implementation Inclusive comparisons reject an absent byte before testing bounds.
 * @evidence contracts/common.md#clear-and-simple-design One scalar predicate supplies UTF-8 range checks.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No consumer-specific values or replacement behavior are introduced.
 * @evidence contracts/common.md#meaningful-documentation The comment states inclusive bounds and optional-byte semantics.
 * @evidence contracts/performance.md#efficient-algorithms A fixed number of comparisons takes constant time and auxiliary space.
 * @evidence contracts/performance.md#reuse-equivalent-work Three scalar inputs fully determine the result; caching adds state to a constant operation.
 * @evidence contracts/performance.md#bound-retention-and-release-resources No state or resources are retained.
 */
export function between(
  byte: number | undefined,
  minimum: number,
  maximum: number,
): boolean {
  return byte !== undefined && byte >= minimum && byte <= maximum;
}
