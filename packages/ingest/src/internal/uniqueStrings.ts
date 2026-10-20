import { compareCodeUnits } from "./compareCodeUnits";

/**
 * Return distinct strings in deterministic JavaScript code-unit order.
 *
 * @evidence contracts/common.md#principled-implementation A Set preserves exact string equality before the shared comparator imposes canonical ordering.
 * @evidence contracts/common.md#clear-and-simple-design Deduplication and ordering form one inventory operation used by the external-extension report.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Case, whitespace and Unicode normalization are preserved rather than merging near-match extension identities.
 * @evidence contracts/common.md#meaningful-documentation The description states exact equality, code-unit ordering and caller ownership of the result array.
 * @evidence contracts/performance.md#efficient-algorithms N inputs cause N expected Set operations over exact strings; U unique values need O(U log U) comparisons, each scanning the compared shared prefix, plus text-dependent string identity/hash work and O(U) collection space.
 * @evidence contracts/performance.md#reuse-equivalent-work A single Set performs deduplication before sorting; mutable input arrays prevent safe retained identity caching.
 * @evidence contracts/performance.md#bound-retention-and-release-resources One temporary Set and returned U-element array are allocated; no input collection is retained after return.
 */
export const uniqueStrings: (values: string[]) => string[] = (
  values: string[],
): string[] => [...new Set<string>(values)].sort(compareCodeUnits);
