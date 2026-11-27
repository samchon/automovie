import { AutoMovieEngineSemanticMaskVerificationError } from "../AutoMovieEngineSemanticMaskVerificationError";

/*
 * Return the typed reason from a semantic-mask verifier refusal.
 *
 * Receipt consumers use this instead of parsing error prose, while unrelated
 * exceptions remain distinguishable as `null`.
 */
export function semanticMaskVerificationFailure(
  error: unknown,
): "unsupported" | "invalid" | "digest-mismatch" | null {
  return error instanceof AutoMovieEngineSemanticMaskVerificationError
    ? error.reason
    : null;
}
