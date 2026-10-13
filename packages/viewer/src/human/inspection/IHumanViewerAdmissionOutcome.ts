import type { IHumanViewerAdmission } from "./IHumanViewerAdmission.js";

/**
 * How one admission request ended: with the owner's verdict, or without one (no loaded frame, or the request could not run), in which case the state is pending with the reason the document waits.
 *
 * @evidence contracts/common.md#principled-implementation Separates an actual available owner verdict from a request that could not run and therefore stores pending state.
 * @evidence contracts/common.md#clear-and-simple-design Keeps reply classification distinct from the final shared admission record so verdict and waiting maps have explicit destinations.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Transport failure does not become numerical refusal or admission; stale-key outcomes are discarded by the owning service.
 * @evidence contracts/common.md#meaningful-documentation verdict true means owner judgment, while false preserves why admission remains pending; this interface does not structurally enforce that correlation.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Outcome construction is fixed reply/error projection; actual domain judgment and source checks remain in their owners.
 * @evidence contracts/performance.md#reuse-equivalent-work The owner stores an outcome only for its current request key; equal state text cannot overwrite a newer keyed request.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Transient outcomes live through reply processing and kept admission records remain with their map owner, without an additional task population.
 *
 * @author Samchon
 */
export interface IHumanViewerAdmissionOutcome {
  /** True when the owner judged the document. */
  verdict: boolean;

  /** The verdict, or the pending state with its reason. */
  admission: IHumanViewerAdmission;
}
