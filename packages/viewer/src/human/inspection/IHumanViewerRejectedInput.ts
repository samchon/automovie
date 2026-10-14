import type { IHumanViewerCatalogueEntry } from "./IHumanViewerCatalogueEntry.js";

/**
 * A document the viewer refused or has not yet decided, with the reason: an input file, the published person generation, or a document the viewer itself authors (the standard people), which takes the same owner admission.
 *
 * @evidence contracts/common.md#principled-implementation Pending and refused inputs carry their cause separately from optional document identity; a pending candidate remains a descriptor, not an admitted drawable.
 * @evidence contracts/common.md#clear-and-simple-design One catalogue rejection record accommodates file, published-generation and application-authored inputs without changing owner admission.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Rejection reasons come from source reading or owner admission; the record neither promotes a candidate nor masks failures for selected documents.
 * @evidence contracts/common.md#meaningful-documentation Comments explain file labels, per-document ids, pending transition semantics and the candidate's lack of drawing authority.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Rejection metadata defines no admission or scanning algorithm; readHumanViewerInputs and catalogue publication populate it.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This outcome shape keeps no admission cache; retries and file-change invalidation belong to the catalogue controller.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The rejection holds descriptive data rather than worker or GPU handles; published catalogue replacement releases its references.
 *
 * @author Samchon
 */
export interface IHumanViewerRejectedInput {
  /**
   * The input file name inside the inputs directory, the generation view paths, or `viewer-authored <document id>` for a document the viewer builds.
   */
  file: string;

  /** Why it was refused, or what it is waiting for when pending. */
  reason: string;

  /**
   * True while the input is not yet decided (a sidecar still being read or a document awaiting admission); false for a completed refusal under the current input and source authority.
   */
  pending: boolean;

  /**
   * The document id when the entry is one document of a file (or one viewer-authored document).
   */
  id?: string;

  /**
   * Selectable numerical descriptor while pending; it is not a drawable or admitted document.
   */
  candidate?: IHumanViewerCatalogueEntry;
}
