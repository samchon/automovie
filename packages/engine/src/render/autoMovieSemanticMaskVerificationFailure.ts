import { AutoMovieSemanticMaskVerificationError } from "./AutoMovieSemanticMaskVerificationError";

/**
 * Return the typed reason from a semantic-mask verifier refusal.
 *
 * Receipt consumers use this instead of parsing error prose, while unrelated
 * exceptions remain distinguishable as `null`.
 *
 * @evidence requirements/rendering/passes-channels-and-products.md#rendering-identity-mask-channels Distinguishes historical palette compatibility from a current payload whose declared identity is false.
 * @evidence specifications/editorial-render-and-delivery/render-products-visibility-and-color.md#spec-render-pass-products Exposes the stable refusal classification consumed by semantic product receipts.
 */
export const autoMovieSemanticMaskVerificationFailure = (
  error: unknown,
): "unsupported" | "invalid" | "digest-mismatch" | null =>
  error instanceof AutoMovieSemanticMaskVerificationError ? error.reason : null;
