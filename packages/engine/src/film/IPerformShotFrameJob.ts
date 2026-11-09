import { IAutoMovieCameraAction } from "@automovie/interface";

/**
 * One `frame` action whose subject resolved, with its index in the performing
 * action list.
 *
 * `gatePerformShotActions` records one per such action in input order;
 * `gatePerformShotFrameOverlaps` sorts the list by `action.start` in place,
 * and the live camera's move, its `cameraIntent` and the blocking's lead
 * framing are then read from it in that order.
 *
 * @evidence contracts/development/design.md#principled-representation Pairs the typed action with its authoring index, because every later violation on a frame move must name the author's own path and the sorted list no longer matches input positions.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Two fields, the action and its index, which is all the overlap gate, the blocking gate and the camera compile read.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Only a frame whose subject resolved is recorded, by the stated rule, so no later stage frames an unresolved subject.
 * @evidence contracts/development/common.md#meaningful-documentation States who records it and when, the in-place sort and who reads the sorted order, and what each field holds.
 */
export interface IPerformShotFrameJob {
  /** The `frame` action, the same object as in the action list. */
  action: IAutoMovieCameraAction;

  /** Position of the action in the performing action list. */
  index: number;
}
