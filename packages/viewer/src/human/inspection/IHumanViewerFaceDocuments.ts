import type { IHumanViewerCatalogueEntry } from "./IHumanViewerCatalogueEntry.js";
import type { IHumanViewerReferenceFaceDocument } from "./IHumanViewerReferenceFaceDocument.js";
import type { IHumanViewerSubjectDocument } from "./IHumanViewerSubjectDocument.js";

/**
 * The face documents of the catalogue: the reference face, the published subjects and their catalogue entries on the published face basis.
 *
 * @evidence contracts/common.md#principled-implementation Joins the supplied reference parameter document, parsed application subject documents and their keyed face entries on one published basis.
 * @evidence contracts/common.md#clear-and-simple-design One projection exposes original subjects for person composition and entries for face selection without duplicate geometry construction.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Published subject JSON is projected without full schema admission; malformed or refused numerical documents remain their domain owner's judgment.
 * @evidence contracts/common.md#meaningful-documentation Identifies reference versus subjects and order-preserving entries, with basis/source keys supplied by readHumanViewerFaceDocuments.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The container performs no IO; parsing and per-document JSON hashing scale with source/document bytes.
 * @evidence contracts/performance.md#reuse-equivalent-work The source's face memo can share the projection under stamp/basis/source/reference signature; equal subject id alone is not equivalent work.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The catalogue retains parsed document references and entry arrays proportional to subjects, with no image, worker or GPU object acquired.
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
