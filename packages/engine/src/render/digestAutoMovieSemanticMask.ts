import { AutoMovieContentDigest, IAutoMovieSemanticMask } from "@automovie/interface";
import { autoMovieRenderDigest } from "./autoMovieRenderDigest";

/**
 * Return the digest of one mask's complete canonical payload.
 *
 * Every semantic field participates, while collection order does not. Entries,
 * their node joins, and bounded-palette gaps are sorted by their stable ids
 * before an explicit-field-order JSON document is hashed. The self-declared
 * digest is deliberately absent from that document.
 *
 * @evidence requirements/rendering/passes-channels-and-products.md#rendering-identity-mask-channels Binds the complete stable owner, instance, and drawable mapping behind an identity-mask product.
 * @evidence specifications/editorial-render-and-delivery/render-products-visibility-and-color.md#spec-render-pass-products Makes the versioned semantic dependency closure, rather than an abbreviated palette row, determine product identity.
 */
export const digestAutoMovieSemanticMask = (
  mask: Omit<IAutoMovieSemanticMask, "digest">,
): AutoMovieContentDigest =>
  autoMovieRenderDigest(JSON.stringify(canonicalSemanticMaskPayload(mask)));
