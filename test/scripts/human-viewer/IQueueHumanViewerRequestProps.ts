import type { HumanViewerLane } from "./HumanViewerLane";
import type { IHumanViewerQueuedRequest } from "./IHumanViewerQueuedRequest";
import type { IHumanViewerRequestResponse } from "./IHumanViewerRequestResponse";
import type { createHumanViewerQueue } from "./createHumanViewerQueue";

/**
 * One HTTP request to bind to a queued GPU task.
 *
 * @evidence contracts/common.md#clear-and-simple-design The queue, response and task are explicit inputs of the adapter.
 * @evidence contracts/common.md#meaningful-documentation Names every input.
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

  /** The GPU work, given its client binding. */
  task: (request: IHumanViewerQueuedRequest) => Promise<Value>;
}
