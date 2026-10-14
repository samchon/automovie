

/**
 * Require equal ordered string populations using exact code-unit equality at each index. Callers sort path inventories before asking for set-like population equality.
 *
 * @evidence contracts/common.md#principled-implementation Length and indexed equality preserve both membership and canonical order under the caller's sorted-inventory premise.
 * @evidence contracts/common.md#clear-and-simple-design One value comparator serves exact directory/file and rollback baseline comparisons.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not sort, normalize case or remove duplicate entries to make a mismatched inventory pass.
 * @evidence contracts/common.md#meaningful-documentation Documents ordered equality and the caller-owned sorting premise.
 * @evidence contracts/performance.md#efficient-algorithms For N entries, compares up to N strings with character-length-dependent equality work and constant additional state.
 * @evidence contracts/performance.md#reuse-equivalent-work Reuses caller arrays without cloning or mutating them, and retains no cross-call equality result.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returns a boolean and retains no path array, descriptor or lease after comparison.
 */
export const legacyImporterEqualStrings: (left: readonly string[], right: readonly string[]) => boolean = (
  left: readonly string[],
  right: readonly string[],
): boolean =>
  left.length === right.length &&
  left.every((value: string, index: number): boolean => value === right[index]);
