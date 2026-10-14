import type {
  AutoMovieHumanFaceMeasurementReading,
  IAutoMovieHumanPersonDocument,
} from "@automovie/human";

/**
 * A solved face measurement target: the person with the solved channel and the stored target, and every face measurement read on it. These readings come from the worker's whole-person evaluator after storing the solved channel and requested target. The result is a numerical candidate; the panel's current transaction separately establishes admitted history or a construction draft.
 *
 * @evidence contracts/common.md#principled-implementation Candidate document and final-person face readings travel together after the worker stores the solved channel and replaces that measurement's target.
 * @evidence contracts/common.md#clear-and-simple-design The result carries numerical candidate provenance while editor intent, display and history ownership stay with the panel.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A solved return does not certify every reading available, clinical validity or successful editor admission.
 * @evidence contracts/common.md#meaningful-documentation The comment assigns reading provenance and distinguishes numerical candidate completion from admitted history and construction-draft state.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This output schema chooses no solver, copy or final-person measurement algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Candidate fields describe one result without declaring cross-request numerical reuse.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Returned serializable document and records own no worker, pending computation or GPU allocation.
 *
 * @author Samchon
 */
export interface IConnectedPersonFaceSolution {
  /** The person with the solved channel weight and the target recorded. */
  document: IAutoMovieHumanPersonDocument;

  /** Every registered face measurement on the solved face. */
  readings: AutoMovieHumanFaceMeasurementReading[];
}
