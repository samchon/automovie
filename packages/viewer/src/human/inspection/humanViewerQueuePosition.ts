import type { HumanViewerLane } from "./HumanViewerLane.js";
import type { IHumanViewerQueueStatus } from "./IHumanViewerQueueStatus.js";

/**
 * How many requests a new request in `lane` waits behind at admission: the
 * running one plus every waiting request of a higher or equal lane. Bulk
 * requests can wait behind everything, a `ui` request only behind the running
 * one and the `ui` requests already waiting. The count is the line as it stands
 * at admission; later arrivals of a higher lane can still move ahead of it.
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
