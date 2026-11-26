import { IAutoMovieSemanticMask } from "@automovie/interface";

import { autoMovieRenderDigest } from "./autoMovieRenderDigest";
import { canonicalAutoMovieSemanticMaskPayload } from "./canonicalAutoMovieSemanticMaskPayload";

/**
 * Return the digest of one mask's complete canonical payload.
 *
 * Every semantic field participates, while collection order does not. Entries,
 * their node joins, and bounded-palette gaps are sorted by their stable ids
 * before an explicit-field-order JSON document is hashed. The self-declared
 * digest is deliberately absent from that document.
 */
export function digestAutoMovieSemanticMask(
  mask: Omit<IAutoMovieSemanticMask, "digest">,
): string {
  return autoMovieRenderDigest(
    JSON.stringify(canonicalAutoMovieSemanticMaskPayload(mask)),
  );
}
