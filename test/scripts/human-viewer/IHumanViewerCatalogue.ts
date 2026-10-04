import type { IHumanViewerCatalogueEntry } from "./IHumanViewerCatalogueEntry";
import type { IHumanViewerRejectedInput } from "./IHumanViewerRejectedInput";

/**
 * The document inventory as the server builds and publishes it at `/docs`,
 * without the human package's document types. The page reads the same JSON
 * through its typed view, `HumanViewerCatalogue`.
 *
 * @evidence contracts/common.md#principled-implementation Content digests carry cache authority; documents stay unexamined JSON until their owner builds them.
 * @evidence contracts/common.md#meaningful-documentation Names the revision, the documents and the refused inputs.
 * @author Samchon
 */
export interface IHumanViewerCatalogue {
  /** Digest of the source bytes the page evaluates. */
  revision: string;

  /** Displayable documents with their cache keys. */
  documents: IHumanViewerCatalogueEntry[];

  /** Input files that were refused, with the reason, so one bad file hides no other. */
  rejected: IHumanViewerRejectedInput[];
}
