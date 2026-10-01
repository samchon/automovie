import type { HumanViewerLane } from "./HumanViewerLane";
import type { IHumanViewerQueueStatus } from "./IHumanViewerQueueStatus";

/**
 * How many requests a new request in `lane` waits behind at admission: the
 * running one plus every waiting request of a higher or equal lane. Bulk
 * requests can wait behind everything, a `ui` request only behind the running
 * one and the `ui` requests already waiting. The count is the line as it stands
 * at admission; later arrivals of a higher lane can still move ahead of it.
 *
 * @evidence contracts/common.md#principled-implementation Counts exactly the entries the queue's lane order starts first.
 * @evidence contracts/common.md#clear-and-simple-design A pure projection of the queue status for the response header.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Reads only the published status.
 * @evidence contracts/common.md#meaningful-documentation States what is counted and that later arrivals can overtake.
 */
export function humanViewerQueuePosition(
  status: IHumanViewerQueueStatus,
  lane: HumanViewerLane,
): number {
  const ahead =
    lane === "ui"
      ? status.waiting.ui
      : lane === "cli"
        ? status.waiting.ui + status.waiting.cli
        : status.waiting.ui + status.waiting.cli + status.waiting.bulk;
  return ahead + (status.running === null ? 0 : 1);
}
