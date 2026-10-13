import type { IHumanViewerCatalogue } from "./IHumanViewerCatalogue.js";
import type { IHumanViewerRejectedInput } from "./IHumanViewerRejectedInput.js";

/**
 * The hand-written documents the viewer accepted, and the input files it
 * refused or has not yet decided (a sidecar still being read, a document
 * awaiting its owner's admission).
 *
 * @author Samchon
 */
export interface IHumanViewerInputs {
  /** Accepted documents as catalogue entries. */
  documents: IHumanViewerCatalogue["documents"];

  /**
   * Input files refused or not yet decided, with their reasons and pending state.
   */
  rejected: IHumanViewerRejectedInput[];
}
