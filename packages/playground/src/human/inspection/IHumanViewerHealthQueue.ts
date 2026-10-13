import type { IHumanViewerQueueStatus } from "@automovie/viewer/human/inspection/IHumanViewerQueueStatus";

/**
 * The part of the server's `/health` answer the host page reads while it waits.
 *
 * It is a typed projection of local health JSON for progress telemetry, not numerical admission or a schema validator. Transport or incompatible shape failure belongs to the progress reader's unavailable-server presentation.
 *
 * @evidence contracts/common.md#principled-implementation The projection exposes the actual server queue status needed to report waiting work without importing numerical document or renderer state.
 * @evidence contracts/common.md#clear-and-simple-design One health property reuses the Viewer queue owner type and keeps progress presentation out of server scheduling.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Typed health JSON does not claim runtime validation or successful model admission, and unreadable telemetry has no fabricated queue count.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies telemetry-only scope, reused queue owner and incompatible-shape failure responsibility.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This health projection implements no queue reduction or HTTP polling algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Live health data carries no numerical result cache or authority to reuse a model.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The record contains ordinary queue telemetry without acquiring a request or timer; the progress reader owns polling lifetime.
 *
 * @author Samchon
 */
export interface IHumanViewerHealthQueue {
  /** The GPU request queue. */
  queue: IHumanViewerQueueStatus;
}
