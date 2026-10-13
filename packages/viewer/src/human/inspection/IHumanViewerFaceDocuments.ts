import type { IHumanViewerCatalogueEntry } from "./IHumanViewerCatalogueEntry.js";
import type { IHumanViewerReferenceFaceDocument } from "./IHumanViewerReferenceFaceDocument.js";
import type { IHumanViewerSubjectDocument } from "./IHumanViewerSubjectDocument.js";

/**
 * The face documents of the catalogue: the reference face, the published
 * subjects and their catalogue entries on the published face basis.
 *
 * @author Samchon
 */
export interface IHumanViewerFaceDocuments {
  /** The connected reference face. */
  reference: IHumanViewerReferenceFaceDocument;

  /** The published face subjects. */
  subjects: IHumanViewerSubjectDocument[];

  /** Catalogue entries of the reference and every subject. */
  entries: IHumanViewerCatalogueEntry[];
}
