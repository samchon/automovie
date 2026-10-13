import { humanViewerBasisDigests } from "./humanViewerBasisDigests.js";
import { humanViewerBasisTokens } from "./humanViewerBasisTokens.js";

/**
 * Where a single-file basis token is served. `published@<d12>` is the
 * domain's published basis, requested with its digest so the server refuses
 * bytes that changed; any other token is the candidate a hand-written
 * document was dropped beside (`<name>@<digest12>`). A person candidate is one
 * packet at `/basis/person`: a face/body basis pair or a one-skin source
 * generation.
 *
 * @evidence contracts/common.md#principled-implementation Prefix discrimination selects a published digest route; other tokens are URL-encoded as candidate identifiers so token punctuation cannot change the query structure.
 * @evidence contracts/common.md#clear-and-simple-design One route choice preserves the existing domain and delegates publication suffix validation to the digest parser.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Selects the server's publication or candidate resource without subject-specific paths or a reconstructed basis fallback.
 * @evidence contracts/common.md#meaningful-documentation Defines both token forms, digest refusal authority and the person packet's existing representation alternatives.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-connected-basis Addresses the explicitly named published basis digest or URL-encoded candidate token used by the numerical preview.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-connected-basis The existing token protocol chooses the resource route without fitting anatomy, replacing a missing basis or claiming canonical production identity.
 * @author Samchon
 */
export function humanViewerBasisUrl(domain: string, token: string): string {
  const published = humanViewerBasisTokens.published;
  return token.startsWith(published + "@")
    ? `/basis/${domain}?digest=${humanViewerBasisDigests(token, published, 1)[0]}`
    : `/basis/${domain}?candidate=${encodeURIComponent(token)}`;
}
