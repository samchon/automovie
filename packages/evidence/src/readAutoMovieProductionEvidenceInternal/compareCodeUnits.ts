


/** Stable code-unit ordering independent of host locale and ICU data.
 *
 * @evidence contracts/common.md#principled-implementation Scalar UTF-16 ordering matches deterministic path and diagnostic comparisons without locale-dependent collation.
 * @evidence contracts/common.md#clear-and-simple-design One comparator owns stable source ordering in the production reader.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Host locale and ICU data cannot alter comparison results.
 * @evidence contracts/common.md#meaningful-documentation The comment states code-unit ordering and locale independence.
 * @evidence contracts/performance.md#efficient-algorithms Comparing L shared-prefix code units costs O(L) with constant auxiliary storage.
 * @evidence contracts/performance.md#reuse-equivalent-work All reader sort operations reuse the same comparator.
 * @evidence contracts/performance.md#bound-retention-and-release-resources No population or external resource is retained.
 */
export const compareCodeUnits: (left: string, right: string) => number = (left: string, right: string): number =>
  Number(left > right) - Number(left < right);
