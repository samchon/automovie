import type { IHumanViewerCatalogueEntry } from "./IHumanViewerCatalogueEntry.js";
import type { IHumanViewerRejectedInput } from "./IHumanViewerRejectedInput.js";

/**
 * The document inventory as the server builds and publishes it at `/docs`, without the human package's document types. The page reads the same JSON through its typed view, `HumanViewerCatalogue`.
 *
 * @evidence contracts/common.md#principled-implementation Represents the server's published document/rejection inventory or a selected-document projection with browser source revision, without loading numerical schema into this transport type.
 * @evidence contracts/common.md#clear-and-simple-design Shares wire JSON with a typed page view and separates displayable entries from named pending/refused inputs.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts File-input refusals remain named without erasing other files, while source-group loading can reject the read; domain schema admission remains with its numerical owner and revision is not geometry proof.
 * @evidence contracts/common.md#meaningful-documentation Documents source authority, keyed documents and pending/refusal causes; the current source digest can include checked-loader inputs and published bases.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The shape performs no disk read; catalogue readers compose source groups and input/admission projections with input-sized work.
 * @evidence contracts/performance.md#reuse-equivalent-work Source controllers reuse published snapshots until changes; individual numerical cache keys additionally depend on document/basis/builder identity.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The host/page retain current document and rejection arrays until replacement, with no separate count cap or photo/GPU bytes stored here.
 *
 * @author Samchon
 */
export interface IHumanViewerCatalogue {
  /** Digest of the source bytes the page evaluates. */
  revision: string;

  /** Published numerical document descriptors with their cache keys; full domain admission remains with their owners. */
  documents: IHumanViewerCatalogueEntry[];

  /**
   * Documents refused or not yet decided, with their reason and pending state. File-input refusals preserve other files, but an invalid array member can stop later offers in that same file; source-group loading has its own failure boundary.
   */
  rejected: IHumanViewerRejectedInput[];
}
