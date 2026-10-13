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
   * The GPU work, given its client binding.
   *
   * @evidence contracts/common.md#principled-implementation The task receives the same client-bound request guard used by queued GPU work.
   * @evidence contracts/common.md#clear-and-simple-design The HTTP adapter supplies cancellation observation while the task owns its actual asynchronous operation.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Client cancellation cannot replace waiting for the task's physical page work to settle.
   * @evidence contracts/common.md#meaningful-documentation Documents the guarded queued request input and asynchronous task result.
   */
  task: (request: IHumanViewerQueuedRequest) => Promise<Value>;
}
