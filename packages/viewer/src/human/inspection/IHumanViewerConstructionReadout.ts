import type { HumanViewerHandle } from "./HumanViewerHandle.js";
import type { IHumanViewerConstructionPartsResponse } from "./IHumanViewerConstructionPartsResponse.js";

/**
 * Same-page construction readings before the server requires a non-null admission. These observations describe the currently displayed instance; their revision and address still need the route's final authority checks.
 *
 * @evidence contracts/common.md#principled-implementation The readout preserves the handle's nullable admission until the route checks that the displayed selection is a construction.
 * @evidence contracts/common.md#clear-and-simple-design It reuses the existing parts response fields while naming the one state that differs before response admission.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A missing admission is retained as null rather than replaced with an accepted report or inferred from successful drawing.
 * @evidence contracts/common.md#meaningful-documentation Documentation distinguishes same-page observation from final route checks of revision, selection and required construction admission.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This transport shape performs no browser evaluation or construction traversal.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A readout describes one displayed state and defines no cache identity or shared request effect.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The copied readings contain no owned page, numerical worker or GPU resource; the guarded request owns their transfer lifetime.
 *
 * @author Samchon
 */
export interface IHumanViewerConstructionReadout extends Omit<
  IHumanViewerConstructionPartsResponse,
  "admission"
> {
  /** The actual handle verdict, null when no construction is displayed. */
  admission: ReturnType<HumanViewerHandle["admission"]>;
}
