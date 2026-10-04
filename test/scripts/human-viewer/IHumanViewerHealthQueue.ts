import type { IHumanViewerQueueStatus } from "./IHumanViewerQueueStatus";

/**
 * The part of the server's `/health` answer the host page reads while it waits.
 *
 * @evidence contracts/common.md#meaningful-documentation Names the one member read.
 * @author Samchon
 */
export interface IHumanViewerHealthQueue {
  /** The GPU request queue. */
  queue: IHumanViewerQueueStatus;
}
