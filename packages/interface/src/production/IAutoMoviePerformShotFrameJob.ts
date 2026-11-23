import type { IAutoMovieCameraAction } from "../harness/IAutoMovieCameraAction";

/**
 * One `frame` action whose subject resolved, with its index in the performing
 * action list.
 *
 * `gatePerformShotActions` records one per such action in input order;
 * `gatePerformShotFrameOverlaps` sorts the list by `action.start` in place, and
 * the live camera's move, its `cameraIntent` and the blocking's lead framing
 * are then read from it in that order.
 */
export interface IAutoMoviePerformShotFrameJob {
  /** The `frame` action, the same object as in the action list. */
  action: IAutoMovieCameraAction;

  /** Position of the action in the performing action list. */
  index: number;
}
