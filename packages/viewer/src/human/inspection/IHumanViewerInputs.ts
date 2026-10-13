import type { IHumanViewerCatalogue } from "./IHumanViewerCatalogue.js";
import type { IHumanViewerRejectedInput } from "./IHumanViewerRejectedInput.js";

/**
 * The hand-written documents the viewer accepted, and the input files it
 * refused or has not yet decided (a sidecar still being read, a document
 * awaiting its owner's admission).
 *
 * @evidence contracts/common.md#principled-implementation One bad file is listed beside the accepted documents instead of hiding them.
 * @evidence contracts/common.md#meaningful-documentation Names both lists.
 *
 * @evidence contracts/common.md#clear-and-simple-design Accepted documents and rejected-or-pending inputs are published together without forcing one file's outcome onto the others.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A still-running sidecar or domain admission remains pending rather than disappearing from the inventory.
 *
 * @evidence requirements/agent-authoring/roles-and-authorities.md#agent-runtime-authority One bad file is listed beside the accepted documents instead of hiding them.
 * @evidence specifications/authoring-and-authority/delegation-and-decision-authority.md#spec-authoring-runtime-evidence-authority-invariant A still-running sidecar or domain admission remains pending rather than disappearing from the inventory.
 *
 * @author Samchon
 */
export interface IHumanViewerInputs {
  /**
   * Accepted documents as catalogue entries.
   *
   * @evidence requirements/agent-authoring/roles-and-authorities.md#agent-runtime-authority Publishes owner-accepted descriptors without letting a separate file's failure hide them.
   * @evidence specifications/authoring-and-authority/delegation-and-decision-authority.md#spec-authoring-runtime-evidence-authority-invariant Publishes owner-accepted descriptors without letting a separate file's failure hide them.
   */
  documents: IHumanViewerCatalogue["documents"];

  /**
   * Input files refused or not yet decided, with their reasons and pending state.
   *
   * @evidence requirements/agent-authoring/roles-and-authorities.md#agent-runtime-authority Keeps refused or still-pending inputs and their actual causes visible beside admitted documents.
   * @evidence specifications/authoring-and-authority/delegation-and-decision-authority.md#spec-authoring-runtime-evidence-authority-invariant Keeps refused or still-pending inputs and their actual causes visible beside admitted documents.
   */
  rejected: IHumanViewerRejectedInput[];
}
