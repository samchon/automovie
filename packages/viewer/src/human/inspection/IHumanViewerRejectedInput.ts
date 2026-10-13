import type { IHumanViewerCatalogueEntry } from "./IHumanViewerCatalogueEntry.js";

/**
 * A document the viewer refused or has not yet decided, with the reason: an
 * input file, the published person generation, or a document the viewer
 * itself authors (the standard people), which takes the same owner admission.
 *
 * @evidence contracts/common.md#meaningful-documentation Names the refused file and why.
 *
 * @evidence contracts/common.md#principled-implementation File identity, cause and pending state preserve refusals separately from admissions still awaiting authority.
 * @evidence contracts/common.md#clear-and-simple-design Optional document identity and descriptor extend the same record for individual entries without creating a second rejection channel.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A pending candidate descriptor is selectable for admission work and cannot become a drawable accepted document by transport alone.
 *
 * @author Samchon
 */
export interface IHumanViewerRejectedInput {
  /**
   * The input file name inside the inputs directory, the generation view
   * paths, or `viewer-authored <document id>` for a document the viewer builds.
   */
  file: string;

  /** Why it was refused, or what it is waiting for when pending. */
  reason: string;

  /**
   * True while the input is not yet decided (a sidecar still being read, a
   * document awaiting admission); false for a refusal that stands until the
   * file changes.
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
