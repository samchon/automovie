import { withoutEnding } from "./withoutEnding";

/**
 * Returns the exact source line ending, including an absent final ending.
 *
 * @evidence contracts/common.md#principled-implementation Find the content boundary with withoutEnding and slice the exact original suffix.
 * @evidence contracts/common.md#clear-and-simple-design Ending extraction is separated from preserved content for projection.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts CRLF, CR, LF and absent endings receive no platform normalization.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies exact endings including absent final endings.
 * @evidence contracts/performance.md#efficient-algorithms Replacement and slicing process L-character lines with up to O(L) transient text.
 * @evidence contracts/performance.md#reuse-equivalent-work withoutEnding owns shared ending grammar; each line is examined independently.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Temporary strings expire locally and the returned suffix belongs to its caller.
 */
export function lineEnding(line: string): string {
  return line.slice(withoutEnding(line).length);
}
