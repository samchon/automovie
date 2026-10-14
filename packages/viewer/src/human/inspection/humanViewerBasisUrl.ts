import { humanViewerBasisDigests } from "./humanViewerBasisDigests.js";
import { humanViewerBasisTokens } from "./humanViewerBasisTokens.js";

/**
 * Where a single-file basis token is served. `published@<d12>` is the domain's published basis, requested with its digest so the server refuses bytes that changed; any other token is the candidate a hand-written document was dropped beside (`<name>@<digest12>`). A person candidate is one packet at `/basis/person`: a face/body basis pair or a one-skin source generation.
 *
 * @evidence contracts/common.md#principled-implementation Published tokens become digest-authorized domain routes and candidate tokens become encoded stem/digest query values for the existing server.
 * @evidence contracts/common.md#clear-and-simple-design One token-prefix branch distinguishes the published and candidate single-file route forms.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Candidate text is URL-encoded rather than inserted as a path component, while actual domain and byte admission remain with the server.
 * @evidence contracts/common.md#meaningful-documentation Documentation describes single-file published and candidate bases and the person packet route without inventing geometry.
 * @evidence contracts/performance.md#efficient-algorithms Route assembly scans token text and delegates the small published suffix check; it performs no byte decoding.
 * @evidence contracts/performance.md#reuse-equivalent-work The returned URL derives from this supplied domain and token, with no previous request or asset reused by this adapter.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Route strings are invocation results and acquire no fetch, filesystem descriptor or retained basis object.
 *
 * @author Samchon
 */
export function humanViewerBasisUrl(domain: string, token: string): string {
  const published: string = humanViewerBasisTokens.published;
  return token.startsWith(published + "@")
    ? `/basis/${domain}?digest=${humanViewerBasisDigests(token, published, 1)[0]}`
    : `/basis/${domain}?candidate=${encodeURIComponent(token)}`;
}
