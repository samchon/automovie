import type { HumanViewerLane } from "./HumanViewerLane.js";
import type { IHumanViewerQueuedRequest } from "./IHumanViewerQueuedRequest.js";
import type { IHumanViewerRequestResponse } from "./IHumanViewerRequestResponse.js";
import type { createHumanViewerQueue } from "./createHumanViewerQueue.js";

/**
 * One HTTP request to bind to a queued GPU task.
 *
 * @evidence contracts/common.md#principled-implementation Queue, lane and real response bind one task to client cancellation while its guarded promise remains held until completion or accepted host lifetime settlement.
 * @evidence contracts/common.md#clear-and-simple-design The adapter receives only the queue's run operation and the response lifecycle capabilities required for this request.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Client loss is observed on the actual response; aborted work is not released through an unresolved Promise race.
 * @evidence contracts/common.md#meaningful-documentation Members name scheduling lane, route/query label, HTTP response and the task's client-bound request argument.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The binding input shape selects no queue admission or GPU scheduling strategy.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each client's transport binding is distinct even if task inputs match; effects are not shared merely by equal labels.
 * @evidence contracts/performance.md#bound-retention-and-release-resources queueHumanViewerRequest owns one abort controller and close listener per binding, removes its listener after settlement and leaves shared-page ownership with the queue.
 *
 * @author Samchon
 */
export interface IQueueHumanViewerRequestProps<Value> {
  /** The GPU queue. */
  queue: Pick<ReturnType<typeof createHumanViewerQueue>, "run">;

  /** Queue label, the route and query. */
  label: string;

  /** Lane the request waits in. */
  lane: HumanViewerLane;

  /** The HTTP response. */
  response: IHumanViewerRequestResponse;

  /**
   * The GPU work with its client binding. Await every guarded operation before returning; its lifetime uses host settlement reports and does not independently measure OS/GPU termination.
   *
   * @evidence contracts/common.md#principled-implementation Cancellation-aware check/run operations refuse client-lost work while holding dispatched promises until their completion or accepted host lifetime settlement.
   * @evidence contracts/common.md#clear-and-simple-design The task owns GPU request behavior while the adapter supplies client binding and the queue owns shared-page scheduling.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Cancellation is not treated as proof that already-dispatched renderer work stopped.
   * @evidence contracts/common.md#meaningful-documentation The member documents client binding and awaiting guarded operations before task completion.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This task signature selects no capture algorithm or queue lane policy.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Task effects belong to one queued client request; matching labels alone cannot share cancellation or response effects.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The queue retains its active slot until the task settles; the task must await guarded operations rather than releasing ownership on abort, and their native-proof limits belong to the lifetime host.
   */
  task: (request: IHumanViewerQueuedRequest) => Promise<Value>;
}
