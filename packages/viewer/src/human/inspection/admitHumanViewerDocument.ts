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
