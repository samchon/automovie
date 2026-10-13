import {
  admitHumanBodyBasisDocument,
  admitHumanFaceBasisDocument,
  admitHumanPersonDocument,
} from "@automovie/human";
import type { IAutoMovieHumanBodyAnatomicalAssembly } from "@automovie/human/body/anatomy/assembly/IAutoMovieHumanBodyAnatomicalAssembly";

/**
 * Admit one hand-written document with its domain owner's own admission, in
 * the checked Node numerical realm. The HTTP host never evaluates that runtime;
 * its page bridge delegates this verdict and lists a refusal among
 * the catalogue's rejected inputs, so a schema error is visible at `/rescan`
 * and `/docs` before any render. Returns null for an admitted document and
 * the owner's reason otherwise.
 *
 * @evidence contracts/common.md#principled-implementation The face, body and person owners' admissions decide validity; the viewer adds no schema copy.
 * @evidence contracts/common.md#clear-and-simple-design One function maps a domain to its owner's admission.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Delegates parsed documents and the original body assembly to the domain admissions without subject-specific validation or preview substitution.
 * @evidence contracts/common.md#meaningful-documentation States where admission runs, why, and the result's meaning.
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-editor-state The face, body and person owners' admissions decide validity; the viewer adds no schema copy.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-editor One function maps a domain to its owner's admission.
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
