import type { IHumanViewerCatalogueEntry } from "./IHumanViewerCatalogueEntry.js";
import type { IHumanViewerRejectedInput } from "./IHumanViewerRejectedInput.js";

/**
 * The document inventory as the server builds and publishes it at `/docs`,
 * without the human package's document types. The page reads the same JSON
 * through its typed view, `HumanViewerCatalogue`.
 *
 * @evidence contracts/common.md#principled-implementation Content digests carry cache authority; documents stay unexamined JSON until their owner builds them.
 * @evidence contracts/common.md#meaningful-documentation Names the revision, the documents and the refused or pending entries.
 *
 * @evidence contracts/common.md#clear-and-simple-design One source revision accompanies complete accepted and rejected-or-pending document lists.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Document JSON remains unexamined on this transport until the domain owner returns admission.
 *
 * @author Samchon
 */
export interface IHumanViewerCatalogue {
  /** Digest of the source bytes the page evaluates. */
  revision: string;

  /** Displayable documents with their cache keys. */
  documents: IHumanViewerCatalogueEntry[];

  /**
   * Documents refused or not yet decided, with the reason and whether they are
   * pending: input files, the published person generation views and the
   * documents the viewer itself authors, so one bad entry hides no other.
   */
  rejected: IHumanViewerRejectedInput[];
}
