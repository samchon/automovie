/**
 * Compare two exact strings in deterministic JavaScript code-unit order.
 *
 * @evidence contracts/common.md#principled-implementation Relational string comparison produces negative, zero or positive ordering without locale-dependent collation.
 * @evidence contracts/common.md#clear-and-simple-design One shared comparator serves canonical resource, extension and semantic-mapping inventories.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No locale, case folding or numeric-suffix convention changes identifier identity.
 * @evidence contracts/common.md#meaningful-documentation The description defines exact code-unit order and equality semantics for canonical sorting.
 * @evidence contracts/performance.md#efficient-algorithms Comparison scans at most the shared prefix length with constant extra space.
 * @evidence contracts/performance.md#reuse-equivalent-work All ingest inventory sorts reuse the same ordering rule rather than different locale comparators.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The comparator allocates no retained arrays, collation handles or comparison cache.
 * @author Samchon
 */
export const compareCodeUnits: (left: string, right: string) => number = (
  left: string,
  right: string,
): number => Number(left > right) - Number(left < right);
