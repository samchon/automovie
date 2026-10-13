import { AutoMovieSemanticMaskVerificationError } from "./AutoMovieSemanticMaskVerificationError";

/**
 * Return the typed reason from a semantic-mask verifier refusal.
 *
 * Receipt consumers use this instead of parsing error prose, while unrelated
 * exceptions remain distinguishable as `null`.
 *
 * @evidence contracts/common.md#principled-implementation Classify only errors constructed by the canonical AutoMovieSemanticMaskVerificationError and return its typed reason; unrelated exceptions return null.
 * @evidence contracts/common.md#clear-and-simple-design One instanceof seam shares verifier class identity with receipt consumers instead of coupling classification to human error prose.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No message substring, fixture id or foreign exception is promoted into a verifier reason; a duplicate constructor copy would fail this identity premise.
 * @evidence contracts/common.md#meaningful-documentation Docs give unsupported/invalid/digest-mismatch outputs and null for unrelated exceptions, with the input error borrowed.
 * @evidence contracts/performance.md#efficient-algorithms One constructor-identity check and property read take O(1) structural work with no collection allocation.
 * @evidence contracts/performance.md#reuse-equivalent-work All consumers reuse the same canonical class and classification law; no mutable error outcome is stored across calls.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only a string discriminant or null escapes; the error, its stack and any native resources remain owned by the caller.
 */
export const autoMovieSemanticMaskVerificationFailure: (error: unknown) => "unsupported" | "invalid" | "digest-mismatch" | null = (
  error: unknown,
): "unsupported" | "invalid" | "digest-mismatch" | null =>
  error instanceof AutoMovieSemanticMaskVerificationError ? error.reason : null;
