import type { HumanViewerLane } from "./HumanViewerLane.js";
import type { IHumanViewerQueuedRequest } from "./IHumanViewerQueuedRequest.js";
import type { IHumanViewerRequestResponse } from "./IHumanViewerRequestResponse.js";
import type { createHumanViewerQueue } from "./createHumanViewerQueue.js";

/**
 * One HTTP request to bind to a queued GPU task.
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

  /** The GPU work, given its client binding. */
  task: (request: IHumanViewerQueuedRequest) => Promise<Value>;
}
