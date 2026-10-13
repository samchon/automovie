import type { IHumanViewerCatalogueEntry } from "./IHumanViewerCatalogueEntry.js";
import type { IHumanViewerReferenceFaceDocument } from "./IHumanViewerReferenceFaceDocument.js";
import type { IHumanViewerSubjectDocument } from "./IHumanViewerSubjectDocument.js";

/**
 * The face documents of the catalogue: the reference face, the published
 * subjects and their catalogue entries on the published face basis.
 *
 * @evidence contracts/common.md#meaningful-documentation Names the documents other groups build on and the entries.
 *
 * @evidence contracts/common.md#principled-implementation The connected reference, published subjects and catalogue entries keep the common face document sources together.
 * @evidence contracts/common.md#clear-and-simple-design Shared reference documents remain separate from the wire entries derived from them.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Subject data is supplied by the application source; this record embeds no subject-specific geometry implementation.
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
