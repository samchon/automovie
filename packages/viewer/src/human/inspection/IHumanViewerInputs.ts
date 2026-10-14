import type { IHumanViewerCatalogue } from "./IHumanViewerCatalogue.js";
import type { IHumanViewerRejectedInput } from "./IHumanViewerRejectedInput.js";

/**
 * Catalogue candidates offered by the input reader, and files refused or not yet decided, such as a sidecar being read or a document awaiting owner admission. Offering a candidate does not independently certify its numerical schema.
 *
 * @evidence contracts/common.md#principled-implementation Collects accepted catalogue candidates and named refused/pending input records from the existing file/generation readers.
 * @evidence contracts/common.md#clear-and-simple-design Two arrays preserve surviving documents when another input or sidecar cannot be read or admitted.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Some producer paths offer candidates before later admission; this container alone cannot certify every document's complete numerical schema.
 * @evidence contracts/common.md#meaningful-documentation Defines documents and pending/refusal causes without including photograph bytes or numerical geometry.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The shape performs no traversal; input owners parse/hash selected files and project current admission separately.
 * @evidence contracts/performance.md#reuse-equivalent-work File projection memos can be reused under their full signature while current keyed admission is reapplied on each catalogue read.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Result arrays grow with offered documents/refusals and live under catalogue publication, with no worker, renderer or separate population cap here.
 *
 * @author Samchon
 */
export interface IHumanViewerInputs {
  /** Offered documents as catalogue entries; actual owner admission remains separate. */
  documents: IHumanViewerCatalogue["documents"];

  /**
   * Input files refused or not yet decided, with their reasons and pending state.
   */
  rejected: IHumanViewerRejectedInput[];
}
