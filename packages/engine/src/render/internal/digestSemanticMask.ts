import { IAutoMovieSemanticMask } from "@automovie/interface";

import { renderDigest } from "./renderDigest";
import { canonicalSemanticMaskPayload } from "./canonicalSemanticMaskPayload";

/*
 * Return the digest of one mask's complete canonical payload.
 *
 * Every semantic field participates, while collection order does not. Entries,
 * their node joins, and bounded-palette gaps are sorted by their stable ids
 * before an explicit-field-order JSON document is hashed. The self-declared
 * digest is deliberately absent from that document.
 */
export function digestSemanticMask(
  mask: Omit<IAutoMovieSemanticMask, "digest">,
): string {
  return renderDigest(
    JSON.stringify(canonicalSemanticMaskPayload(mask)),
  );
}
