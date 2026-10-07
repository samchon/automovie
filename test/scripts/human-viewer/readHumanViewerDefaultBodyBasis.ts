import type { IAutoMovieHumanBodyBasis } from "@automovie/human";

import type { IHumanViewerCatalogue } from "./IHumanViewerCatalogue";
import { fetchHumanViewerPublishedGenerationBody } from "./fetchHumanViewerPublishedGenerationBody";
import { humanViewerBasisTokens } from "./humanViewerBasisTokens";
import { humanViewerBasisDigests } from "./humanViewerBasisDigests";

/**
 * Read the same published body view the viewer's standard neutral body uses.
 * The catalogue supplies its generation token, and the existing digest-checked
 * view route refuses a replaced file. Default observation joints, document
 * basis and mesh population therefore share one source. Explicit candidate
 * inputs remain the caller's separate choice.
 *
 * @evidence contracts/common.md#principled-implementation The admitted standard document selects the generation view and its digest instead of a different filesystem legacy basis.
 * @evidence contracts/common.md#clear-and-simple-design Reuses the published generation-body fetch owner for both browser and Node callers.
 * @evidence contracts/common.md#meaningful-documentation States source selection, replacement refusal and explicit-candidate separation.
 * @author Samchon
 */
export async function readHumanViewerDefaultBodyBasis(origin: string): Promise<IAutoMovieHumanBodyBasis> {
  const response = await fetch(origin + "/docs?settled=1");
  if (!response.ok)
    throw new Error(`The viewer body catalogue could not be read: ${response.status}`);
  const catalogue = await response.json() as IHumanViewerCatalogue;
  const body = catalogue.documents.find((entry) => entry.id === "body:neutral" && entry.domain === "body");
  if (body === undefined) {
    const refused = catalogue.rejected.find((entry) => entry.id === "body:neutral");
    throw new Error("The viewer's standard body is not admitted: " + (refused?.reason ?? "body:neutral is unavailable"));
  }
  if (body.basis.startsWith(humanViewerBasisTokens.publishedGeneration + "@")) {
    const [, digest] = humanViewerBasisDigests(body.basis, humanViewerBasisTokens.publishedGeneration, 2);
    return fetchHumanViewerPublishedGenerationBody(humanViewerBasisTokens.publishedGenerationBody + "@" + digest, origin);
  }
  if (!body.basis.startsWith(humanViewerBasisTokens.publishedGenerationBody + "@"))
    throw new Error("The viewer's standard body does not name a published generation-body view: " + body.basis);
  return fetchHumanViewerPublishedGenerationBody(body.basis, origin);
}
