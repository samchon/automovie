import type { IAutoMovieHumanFaceBasisDocument } from "@automovie/human";

import type { IHumanViewerCatalogueEntry } from "./IHumanViewerCatalogueEntry.js";

/**
 * A face catalogue entry as the page reads it: the wire entry with its document typed. The page passes it to its domain owner, which admits it.
 *
 * @evidence contracts/common.md#principled-implementation Narrows the shared server catalogue entry to face domain and its canonical Human face basis document type for page dispatch.
 * @evidence contracts/common.md#clear-and-simple-design Extends common id/key/basis authority rather than copying the face numerical schema into Viewer.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The typed projection does not admit JSON; the actual face owner still validates/builds it and can refuse.
 * @evidence contracts/common.md#meaningful-documentation Documents the face discriminator and document type while retaining base entry units, token and cache authority meanings.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The interface erases; source parse/hash and face numerical/GPU preparation remain in their consuming owners.
 * @evidence contracts/performance.md#reuse-equivalent-work Face cache equivalence includes actual document, basis and face builder source, not just face type or displayed id.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The page borrows catalogue/document state until replacement; this subtype owns no numerical transport or resident population.
 *
 * @author Samchon
 */
export interface IHumanViewerFaceCatalogueEntry extends IHumanViewerCatalogueEntry {
  /** Always `face`. */
  domain: "face";

  /** The face document. */
  document: IAutoMovieHumanFaceBasisDocument;
}
