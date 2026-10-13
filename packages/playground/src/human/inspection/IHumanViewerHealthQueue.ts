import type { IHumanViewerQueueStatus } from "@automovie/viewer/human/inspection/IHumanViewerQueueStatus";

/**
 * The part of the server's `/health` answer the host page reads while it waits.
 *
 * @author Samchon
 */
export interface IHumanViewerHealthQueue {
  /** The GPU request queue. */
  queue: IHumanViewerQueueStatus;
}
