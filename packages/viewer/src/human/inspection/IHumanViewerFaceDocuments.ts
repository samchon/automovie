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
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-document The connected reference, published subjects and catalogue entries keep the common face document sources together.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-document Subject data is supplied by the application source; this record embeds no subject-specific geometry implementation.
 *
 * @author Samchon
 */
export interface IHumanViewerFaceDocuments {
  /**
   * The connected reference face.
   *
   * @evidence requirements/actors/facial-authoring/contract.md#actor-face-document Carries the application-supplied neutral face reused in Person composition without a Viewer-owned preset generator.
   * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-document Carries the application-supplied neutral face reused in Person composition without a Viewer-owned preset generator.
   */
  reference: IHumanViewerReferenceFaceDocument;

  /**
   * The published face subjects.
   *
   * @evidence requirements/actors/facial-authoring/contract.md#actor-face-document Carries application-owned face subjects whose remaining schema stays with the Face admission owner.
   * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-document Carries application-owned face subjects whose remaining schema stays with the Face admission owner.
   */
  subjects: IHumanViewerSubjectDocument[];

  /**
   * Catalogue entries of the reference and every subject.
   *
   * @evidence requirements/actors/facial-authoring/contract.md#actor-face-document Keeps each original face document paired with the catalogue identity and cache authority derived for it.
   * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-document Keeps each original face document paired with the catalogue identity and cache authority derived for it.
   */
  entries: IHumanViewerCatalogueEntry[];
}
