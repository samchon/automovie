import type { IHumanViewerCatalogue } from "./IHumanViewerCatalogue";
import type { IHumanViewerRejectedInput } from "./IHumanViewerRejectedInput";

/**
 * The hand-written documents the viewer accepted and the files it refused.
 *
 * @evidence contracts/common.md#principled-implementation One bad file is listed beside the accepted documents instead of hiding them.
 * @evidence contracts/common.md#meaningful-documentation Names both lists.
 * @author Samchon
 */
export interface IHumanViewerInputs {
  /** Accepted documents as catalogue entries. */
  documents: IHumanViewerCatalogue["documents"];

  /** Refused files with their reasons. */
  rejected: IHumanViewerRejectedInput[];
}
