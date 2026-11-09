/**
 * Tests an optional byte against an inclusive range.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Inclusive comparisons reject an absent byte before testing bounds.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One scalar predicate supplies UTF-8 range checks.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No consumer-specific values or replacement behavior are introduced.
 * @evidence contracts/development/common.md#meaningful-documentation The comment states inclusive bounds and optional-byte semantics.
 * @evidence contracts/development/implementation.md#efficient-algorithms A fixed number of comparisons takes constant time and auxiliary space.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Three scalar inputs fully determine the result; caching adds state to a constant operation.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources No state or resources are retained.
 */
export function between(
  byte: number | undefined,
  minimum: number,
  maximum: number,
): boolean {
  return byte !== undefined && byte >= minimum && byte <= maximum;
}
