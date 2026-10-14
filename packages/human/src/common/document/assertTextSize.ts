/**
 * Refuse a document text longer than the shared envelope, in UTF-16 code units
 * and including JSON whitespace. Loading and saving, for the face and the body
 * alike, share this one limit so a document that can be saved can be loaded.
 *
 *
 * @evidence contracts/common.md#principled-implementation Checks UTF-16 length against the common document envelope before face/body/person parsing or serialization continues; whitespace counts too.
 * @evidence contracts/common.md#clear-and-simple-design Loaders and savers share one envelope rather than anatomy-specific limits.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The 16,777,216-code-unit limit is the supported document contract, not a phrase checker or test-only exception.
 * @evidence contracts/common.md#meaningful-documentation Documents length units, whitespace inclusion and shared save/load refusal.
 * @evidence contracts/performance.md#efficient-algorithms Stored string length is checked in O(1) without parsing, copying or scanning content.
 * @evidence contracts/performance.md#reuse-equivalent-work Every document owner checks its current text; success is not cached across different strings.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Retains no text or parser state and allocates only an error on refusal.
 *
 * @author Samchon
 */
export function assertTextSize(text: string): void {
  if (text.length > 16 * 1024 * 1024)
    throw new Error("Documents must fit within 16,777,216 UTF-16 code units.");
}
