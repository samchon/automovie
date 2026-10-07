import type { IHumanViewerCatalogue } from "./IHumanViewerCatalogue";
import type { IHumanViewerRejectedInput } from "./IHumanViewerRejectedInput";

/**
 * The hand-written documents the viewer accepted, and the input files it
 * refused or has not yet decided (a sidecar still being read, a document
 * awaiting its owner's admission).
 *
 * @evidence contracts/common.md#principled-implementation One bad file is listed beside the accepted documents instead of hiding them.
 * @evidence contracts/common.md#meaningful-documentation Names both lists.
 * @author Samchon
 */
export interface IHumanViewerInputs {
  /** Accepted documents as catalogue entries. */
  documents: IHumanViewerCatalogue["documents"];

  /** Input files refused or not yet decided, with their reasons and pending state. */
  rejected: IHumanViewerRejectedInput[];
}
