import { AutoMovieSemanticMaskVerificationError } from "./AutoMovieSemanticMaskVerificationError";

/**
 * Return the typed reason from a semantic-mask verifier refusal.
 *
 * Receipt consumers use this instead of parsing error prose, while unrelated
 * exceptions remain distinguishable as `null`.
 */
export const autoMovieSemanticMaskVerificationFailure = (
  error: unknown,
): "unsupported" | "invalid" | "digest-mismatch" | null =>
  error instanceof AutoMovieSemanticMaskVerificationError ? error.reason : null;
