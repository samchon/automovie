/**
 * Replace separator runs with spaces and uppercase ASCII word starts for navigation display; the source id remains unchanged and this is not locale-aware title casing.
 *
 * @evidence contracts/common.md#principled-implementation Two standard string replacements project authored ids into labels; JavaScript word boundaries define the ASCII-oriented capitalization limitation.
 * @evidence contracts/common.md#clear-and-simple-design Display formatting is independent of source identity and camera geometry, shared by the three exporter branches.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The same separator and capitalization rules apply to all ids without a label dictionary or expected-answer lookup.
 * @evidence contracts/common.md#meaningful-documentation The comment explains id preservation, separator behavior and the locale limitation.
 * @evidence contracts/performance.md#efficient-algorithms Two passes cost O(L) time and output storage for an id of length L; no search over the collection occurs.
 * @evidence contracts/performance.md#reuse-equivalent-work Labels are computed from the current id without a global cache; the exporter retains each result in its own view record.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only returned strings survive the call; no handles or background work are acquired.
 */
export const viewLabel: (id: string) => string = (id: string): string =>
  id
    .replace(/[-_.]+/g, " ")
    .replace(/\b\w/g, (letter: string): string => letter.toUpperCase());
