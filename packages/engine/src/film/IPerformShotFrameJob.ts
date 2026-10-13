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
 * @evidence contracts/common.md#principled-implementation Pairs the typed action with its authoring index, because every later violation on a frame move must name the author's own path and the sorted list no longer matches input positions.
 * @evidence contracts/common.md#clear-and-simple-design Two fields, the action and its index, which is all the overlap gate, the blocking gate and the camera compile read.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Only a frame whose subject resolved is recorded, by the stated rule, so no later stage frames an unresolved subject.
 * @evidence contracts/common.md#meaningful-documentation States who records it and when, the in-place sort and who reads the sorted order, and what each field holds.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Type-only: one pair is written per resolved frame action, and the in-place sort that orders them is costed on the overlap gate.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Built once per frame action and read by later stages of the same call.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Lives for one `performShot` call and references the caller's action object.
 * @author Samchon
 */
export interface IPerformShotFrameJob {
  /** The `frame` action, the same object as in the action list. */
  action: IAutoMovieCameraAction;

  /** Position of the action in the performing action list. */
  index: number;
}
