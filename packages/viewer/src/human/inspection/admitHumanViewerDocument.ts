import {
  admitHumanBodyBasisDocument,
  admitHumanFaceBasisDocument,
  admitHumanPersonDocument,
} from "@automovie/human";
import type { IAutoMovieHumanBodyAnatomicalAssembly } from "@automovie/human/body/anatomy/assembly/IAutoMovieHumanBodyAnatomicalAssembly";

/**
 * Admit one hand-written document with its domain owner's own admission, in the checked Node numerical realm. The HTTP host never evaluates that runtime; its page bridge delegates this verdict and lists a refusal among the catalogue's rejected inputs, so a schema error is visible at `/rescan` and `/docs` before any render. Returns null for an admitted document and the owner's reason otherwise.
 *
 * @evidence contracts/common.md#principled-implementation Parsed unknown JSON is passed unchanged to the selected face, body or person owner's admission function, with optional body anatomical assembly forwarded where required.
 * @evidence contracts/common.md#clear-and-simple-design The checked numerical realm owns evaluation; this adapter only selects the domain and converts a refusal into the catalogue's nullable reason.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unknown domains, invalid JSON and owner refusals remain reasons; neither known ids nor application-authored examples bypass numerical admission.
 * @evidence contracts/common.md#meaningful-documentation Documentation identifies the checked Node realm, null-success/reason-failure protocol and visibility of schema refusals before rendering.
 * @evidence contracts/performance.md#efficient-algorithms JSON parsing is O(B) in document text and owner validation follows that domain's schema; there is one parse and one admission call per request.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This stateless domain adapter does not cache verdicts; its host keys admission by exact document, basis and numerical-source authority.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Parsed input and optional anatomical source are borrowed for admission, with no worker task or parsed-document cache retained after the reason is returned.
 */
export function admitHumanViewerDocument(
  domain: string,
  text: string,
  source?: IAutoMovieHumanBodyAnatomicalAssembly,
): string | null {
  try {
    const document: unknown = JSON.parse(text);
    if (domain === "face") admitHumanFaceBasisDocument(document);
    else if (domain === "body") admitHumanBodyBasisDocument(document, source);
    else if (domain === "person") admitHumanPersonDocument(document, source);
    else return `Unknown document domain ${domain}`;
    return null;
  } catch (error) {
    return error instanceof Error ? error.message : String(error);
  }
}
