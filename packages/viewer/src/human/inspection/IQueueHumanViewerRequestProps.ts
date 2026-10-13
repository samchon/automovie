import type { HumanViewerLane } from "./HumanViewerLane.js";
import type { IHumanViewerQueuedRequest } from "./IHumanViewerQueuedRequest.js";
import type { IHumanViewerRequestResponse } from "./IHumanViewerRequestResponse.js";
import type { createHumanViewerQueue } from "./createHumanViewerQueue.js";

/**
 * One HTTP request to bind to a queued GPU task.
 *
 * @evidence contracts/common.md#principled-implementation A queued request pairs queue lane and HTTP response with work receiving the client's cancellation binding.
 * @evidence contracts/common.md#clear-and-simple-design The HTTP adapter borrows the queue's run operation while GPU serialization remains with the queue owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The request task cannot equate client loss with settled GPU work or acquire viewer restart authority.
 * @evidence contracts/common.md#meaningful-documentation Defines the lane, request label, HTTP response and client-bound asynchronous task.
 * @evidence requirements/rendering/headless-and-platform-determinism.md#rendering-process-isolation A queued request pairs queue lane and HTTP response with work receiving the client's cancellation binding.
 * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-headless-platform The HTTP adapter borrows the queue's run operation while GPU serialization remains with the queue owner.
 * @author Samchon
 */
export interface IQueueHumanViewerRequestProps<Value> {
  /**
   * The GPU queue.
   *
   * @evidence requirements/rendering/headless-and-platform-determinism.md#rendering-process-isolation The GPU queue. A queued request pairs queue lane and HTTP response with work receiving the client's cancellation binding.
   * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-headless-platform The GPU queue. The HTTP adapter borrows the queue's run operation while GPU serialization remains with the queue owner.
   */
  queue: Pick<ReturnType<typeof createHumanViewerQueue>, "run">;

  /**
   * Queue label, the route and query.
   *
   * @evidence requirements/rendering/headless-and-platform-determinism.md#rendering-process-isolation Queue label, the route and query. A queued request pairs queue lane and HTTP response with work receiving the client's cancellation binding.
   * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-headless-platform Queue label, the route and query. The HTTP adapter borrows the queue's run operation while GPU serialization remains with the queue owner.
   */
  label: string;

  /**
   * Lane the request waits in.
   *
   * @evidence requirements/rendering/headless-and-platform-determinism.md#rendering-process-isolation Lane the request waits in. A queued request pairs queue lane and HTTP response with work receiving the client's cancellation binding.
   * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-headless-platform Lane the request waits in. The HTTP adapter borrows the queue's run operation while GPU serialization remains with the queue owner.
   */
  lane: HumanViewerLane;

  /**
   * The HTTP response.
   *
   * @evidence requirements/rendering/headless-and-platform-determinism.md#rendering-process-isolation The HTTP response. A queued request pairs queue lane and HTTP response with work receiving the client's cancellation binding.
   * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-headless-platform The HTTP response. The HTTP adapter borrows the queue's run operation while GPU serialization remains with the queue owner.
   */
  response: IHumanViewerRequestResponse;

  /**
   * The GPU work, given its client binding.
   *
   * @evidence contracts/common.md#principled-implementation The task receives the same client-bound request guard used by queued GPU work.
   * @evidence contracts/common.md#clear-and-simple-design The HTTP adapter supplies cancellation observation while the task owns its actual asynchronous operation.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Client cancellation cannot replace waiting for the task's physical page work to settle.
   * @evidence contracts/common.md#meaningful-documentation Documents the guarded queued request input and asynchronous task result.
   * @evidence requirements/rendering/headless-and-platform-determinism.md#rendering-process-isolation The task receives the same client-bound request guard used by queued GPU work.
   * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-headless-platform The HTTP adapter supplies cancellation observation while the task owns its actual asynchronous operation.
   */
  task: (request: IHumanViewerQueuedRequest) => Promise<Value>;
}
