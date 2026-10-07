import { humanViewerBasisDigests } from "./humanViewerBasisDigests";
import { humanViewerBasisTokens } from "./humanViewerBasisTokens";

/**
 * Where a single-file basis token is served. `published@<d12>` is the
 * domain's published basis, requested with its digest so the server refuses
 * bytes that changed; any other token is the candidate a hand-written
 * document was dropped beside (`<name>@<digest12>`). A person candidate is one
 * packet at `/basis/person`: a face/body basis pair or a one-skin source
 * generation.
 *
 * @author Samchon
 */
export function humanViewerBasisUrl(domain: string, token: string): string {
  const published = humanViewerBasisTokens.published;
  return token.startsWith(published + "@")
    ? `/basis/${domain}?digest=${humanViewerBasisDigests(token, published, 1)[0]}`
    : `/basis/${domain}?candidate=${encodeURIComponent(token)}`;
}
