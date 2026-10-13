import type { IHumanViewerQueueStatus } from "@automovie/viewer/human/inspection/IHumanViewerQueueStatus";

/**
 * The part of the server's `/health` answer the host page reads while it waits.
 *
 * @evidence contracts/common.md#principled-implementation Carries the server's existing typed GPU queue observation that the host uses to count current waiting requests.
 * @evidence contracts/common.md#clear-and-simple-design Selects only queue status from health; process authority, numerical admission and renderer facts stay with their owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Queue counts remain received observations and do not authorize terminating slow work or fabricating a completed display.
 * @evidence contracts/common.md#meaningful-documentation Identifies the health subset and its progress-only use while the host waits.
 * @author Samchon
 */
export interface IHumanViewerHealthQueue {
  /** The GPU request queue. */
  queue: IHumanViewerQueueStatus;
}
