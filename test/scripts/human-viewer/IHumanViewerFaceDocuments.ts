import type { IHumanViewerCatalogueEntry } from "./IHumanViewerCatalogueEntry";
import type { IHumanViewerReferenceFaceDocument } from "./IHumanViewerReferenceFaceDocument";
import type { IHumanViewerSubjectDocument } from "./IHumanViewerSubjectDocument";

/**
 * The face documents of the catalogue: the reference face, the published
 * subjects and their catalogue entries on the published face basis.
 *
 * @evidence contracts/common.md#meaningful-documentation Names the documents other groups build on and the entries.
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
