import { REVIEW } from "./REVIEW";

/**
 * Locates the review hash by grammar, never by an identical token in its target.
 *
 * @evidence contracts/common.md#principled-implementation Match complete review grammar and derive the hash offset from keyword and target prefix lengths.
 * @evidence contracts/common.md#clear-and-simple-design Grammar-derived positioning avoids searching for a repeated hash value.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An identical hash within a target cannot alter the structural location.
 * @evidence contracts/common.md#meaningful-documentation The comment explains structural rather than value-based location.
 * @evidence contracts/performance.md#efficient-algorithms One match and prefix construction scale with declaration length and transient captures.
 * @evidence contracts/performance.md#reuse-equivalent-work The shared REVIEW expression is reused; offsets are specific to each declaration.
 * @evidence contracts/performance.md#bound-retention-and-release-resources No match or source reference persists.
 */
export function flatFingerprintStart(declaration: string): number | undefined {
  const review: RegExpExecArray | null = REVIEW.exec(declaration);
  return review === null ? undefined : `@${review[1]} ${review[2]} `.length;
}
