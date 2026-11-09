import { withoutEnding } from "./withoutEnding";

/**
 * Returns the exact source line ending, including an absent final ending.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Find the content boundary with withoutEnding and slice the exact original suffix.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Ending extraction is separated from preserved content for projection.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts CRLF, CR, LF and absent endings receive no platform normalization.
 * @evidence contracts/development/common.md#meaningful-documentation The comment identifies exact endings including absent final endings.
 * @evidence contracts/development/implementation.md#efficient-algorithms Replacement and slicing process L-character lines with up to O(L) transient text.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work withoutEnding owns shared ending grammar; each line is examined independently.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Temporary strings expire locally and the returned suffix belongs to its caller.
 */
export function lineEnding(line: string): string {
  return line.slice(withoutEnding(line).length);
}
