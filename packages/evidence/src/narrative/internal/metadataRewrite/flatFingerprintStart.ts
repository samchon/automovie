import { REVIEW } from "./REVIEW";

/**
 * Locates the review hash by grammar, never by an identical token in its target.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Match complete review grammar and derive the hash offset from keyword and target prefix lengths.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Grammar-derived positioning avoids searching for a repeated hash value.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts An identical hash within a target cannot alter the structural location.
 * @evidence contracts/development/common.md#meaningful-documentation The comment explains structural rather than value-based location.
 * @evidence contracts/development/implementation.md#efficient-algorithms One match and prefix construction scale with declaration length and transient captures.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The shared REVIEW expression is reused; offsets are specific to each declaration.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources No match or source reference persists.
 */
export function flatFingerprintStart(declaration: string): number | undefined {
  const review: RegExpExecArray | null = REVIEW.exec(declaration);
  return review === null ? undefined : `@${review[1]} ${review[2]} `.length;
}
