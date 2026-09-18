/**
 * How many entries one mask may carry.
 *
 * The mask is bounded evidence, and this is the bound. It is generous enough
 * for a whole multi-storey building with its openings and props, and small
 * enough that the palette can never run out of colours: with at most this many
 * claims in a space of {@link AUTOMOVIE_SEMANTIC_MASK_COLORS}, a free colour
 * always exists, so the allocator has no failure path to hide a defect in.
 *
 * @evidence requirements/rendering/passes-channels-and-products.md#rendering-identity-mask-channels Bounds how many semantic entities one exact 24-bit mask can address without dropping an identity.
 * @evidence specifications/editorial-render-and-delivery/render-products-visibility-and-color.md#spec-render-pass-products Keeps the structural pass finite while guaranteeing a distinct non-background colour for every admitted entry.
 */
export const AUTOMOVIE_SEMANTIC_MASK_MAX_ENTRIES = 65536;

/** Current full-payload semantic-mask format. */
const SEMANTIC_MASK_VERSION = 2;

/** Domain separator for the current full-payload semantic-mask format. */
const SEMANTIC_MASK_PROTOCOL = "automovie.semantic-mask.v2";

/** A typed internal refusal carried across the verifier boundary. */
class AutoMovieSemanticMaskVerificationError extends Error {
  public constructor(
    public readonly reason: "unsupported" | "invalid" | "digest-mismatch",
    message: string,
  ) {
    super(message);
  }
}
