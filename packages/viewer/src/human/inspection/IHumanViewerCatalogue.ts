import type { IHumanViewerCatalogueEntry } from "./IHumanViewerCatalogueEntry.js";
import type { IHumanViewerRejectedInput } from "./IHumanViewerRejectedInput.js";

/**
 * The document inventory as the server builds and publishes it at `/docs`, without the human package's document types. The page reads the same JSON through its typed view, `HumanViewerCatalogue`.
 *
 * @evidence contracts/common.md#principled-implementation Represents the server's complete published document/rejection inventory with browser source revision, projected without numerical schema loading.
 * @evidence contracts/common.md#clear-and-simple-design Shares wire JSON with a typed page view and separates displayable entries from named pending/refused inputs.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts One bad entry does not erase other groups; domain schema admission remains the actual numerical owner and revision is not geometry proof.
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

  /** Displayable documents with their cache keys. */
  documents: IHumanViewerCatalogueEntry[];

  /**
   * Documents refused or not yet decided, with the reason and whether they are
   * pending: input files, the published person generation views and the
   * documents the viewer itself authors, so one bad entry hides no other.
   */
  rejected: IHumanViewerRejectedInput[];
}
