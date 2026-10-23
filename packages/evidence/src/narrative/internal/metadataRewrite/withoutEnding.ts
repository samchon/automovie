/**
 * Returns a line without consuming its exact ending.
 *
 * @evidence contracts/common.md#principled-implementation Remove one trailing CRLF, CR or LF while leaving every other character unchanged.
 * @evidence contracts/common.md#clear-and-simple-design One helper defines the content boundary shared by projection and section parsing.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No interior newline or arbitrary trailing whitespace is normalized.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies exact ending separation.
 * @evidence contracts/performance.md#efficient-algorithms The end-anchored runtime regex processes L-character input; replacement may allocate O(L) text.
 * @evidence contracts/performance.md#reuse-equivalent-work Shared ending semantics need no cache that would retain individual source lines.
 * @evidence contracts/performance.md#bound-retention-and-release-resources No state is stored and returned text belongs to its caller.
 */
export function withoutEnding(line: string): string {
  return line.replace(/(?:\r\n|\r|\n)$/u, "");
}
