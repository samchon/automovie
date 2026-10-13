

/**
 * Array.isArray and every string comparison narrow present elements before id admission.
 *
 * @evidence contracts/common.md#principled-implementation Array.isArray and every string comparison narrow present elements before id admission.
 * @evidence contracts/common.md#clear-and-simple-design Owner parsing separately checks duplicates and order.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts every skips sparse holes for arbitrary arrays; actual persistent JSON materializes dense arrays and supplies that caller premise.
 * @evidence contracts/common.md#meaningful-documentation States element-shape scope and dense-JSON input premise.
 * @evidence contracts/performance.md#efficient-algorithms Scans N present entries with constant extra storage and no clone.
 * @evidence contracts/performance.md#reuse-equivalent-work The admitted array is reused after direct current checks, without a retained verdict.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only a boolean escapes and the array remains caller-owned.
 */
export const libraryStateIsStringArray: (value: unknown) => value is string[] = (value: unknown): value is string[] => Array.isArray(value) && value.every((entry: unknown) : boolean => typeof entry === "string");
