

/**
 * Relational string comparison supplies a deterministic total order over UTF-16 code units.
 *
 * @evidence contracts/common.md#principled-implementation Relational string comparison supplies a deterministic total order over UTF-16 code units.
 * @evidence contracts/common.md#clear-and-simple-design Filesystem inventories and graph routes share this comparator instead of depending on the host locale.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Equal strings return zero without a platform-specific collation exception.
 * @evidence contracts/common.md#meaningful-documentation The comparator returns a negative, zero or positive order suitable for Array.sort.
 * @evidence contracts/performance.md#efficient-algorithms Comparison cost follows the shared string prefix; the comparator itself allocates no collection.
 * @evidence contracts/performance.md#reuse-equivalent-work No ordering cache is needed because the operation is pure and the caller owns its sort.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only the numeric comparison result escapes; no state or handles are retained.
 */
export function compareCodeUnits(left: string, right: string): number {
  return Number(left > right) - Number(left < right);
}
