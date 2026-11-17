import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanOperate,
  IAutoMovieMotionHumanOperateDrive,
  IAutoMovieMotionHumanOperateState,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { operate } from "./operate";
import { operateDrive } from "./operateDrive";
import { operateInsert } from "./operateInsert";

/**
 * The moving part of an operated mechanism on a prop that does not
 * articulate, as the mechanism's own geometry moves it: a button's face in
 * along its axis, a knob turned about it, a slider's handle along it, a
 * leaf's handle about its hinge line (a door's vertical through the point it
 * names, or the line's own axis), an insertion's socket depth. A prop that
 * articulates poses its own part instead (`operateDrive.part`).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States each mechanism's movement and when the prop's own pose stands in.
 * @evidence contracts/development/design.md#principled-representation The part's point, outward normal and roll at a progress.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One reader, read by `operate`.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Each movement is its mechanism's own; amounts are the mechanism's.
 */
export namespace operateState {
  /**
   * The moving part's place at a progress of its movement.
   *
   * @param mechanism The mechanism.
   * @param place The part's place at rest: its point and outward normal.
   * @param hinge The hinge line, for a leaf: a point of it, and its unit axis, the vertical when absent.
   * @param progress 0 at rest, 1 at the end of the movement.
   * @returns The point and the normal, and the roll about the normal in degrees.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines original mechanism/start place/optional hinge, dimensionless progress and returned world-metre point, outward normal and degree roll; the namespace distinguishes rigid from articulated props.
   * @evidence contracts/development/implementation.md#principled-implementation Delegates to the same rigid mechanism owner used by actual operation plans: axial button/slider/insertion travel, knob roll or rigid hinge orbit with the original pull sign.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The cold facade prepares and evaluates the one selected branch rather than copying a second set of state equations.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Original mechanism amounts, defaults, normal normalization, hinge/foot/axis policy and unmodified progress are preserved without clipping, sampling or acceptance changes.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant-size branch preparation/evaluation takes O(1) work and fresh required outputs. Actual fixed plans retain prepare to omit repeated geometry preparation; this facade retains no producer between calls.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Cold and prepared readers share one numerical owner. Each cold call reads its supplied current fixed geometry independently, with no result replay or identity-based equivalence assumption.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The local reader and scratch release at return or throw; returned point/normal preserve their original fresh-or-borrowed branch ownership and no caller geometry, time history or external handle is retained by this facade.
   */
  export function at(
    mechanism: IAutoMovieMotionHumanOperate.Mechanism,
    place: IAutoMovieMotionHumanOperateState.IAtPlace,
    hinge: IAutoMovieMotionHumanOperateDrive.IHinge | undefined,
    progress: number,
  ): IAutoMovieMotionHumanOperateState.IAtResult {
    return prepare(mechanism, place, hinge)(progress);
  }

  /**
   * Prepare a rigid mechanism's fixed axis geometry before its progress varies.
   *
   * @param mechanism The unchanged authored mechanism and travel.
   * @param place Its initial world point and outward normal.
   * @param hinge Its fixed hinge line when it swings.
   * @returns The actual point, normal and roll at each supplied progress.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States fixed inputs, world frames and the varying dimensionless progress.
   * @evidence contracts/development/implementation.md#principled-implementation Retains the mechanism's original translation or axis-angle rotation; the normalized normal, hinge foot, arm and pull sign depend only on its initial geometry.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One mechanism branch chooses the progress reader and prepares only that branch's fixed geometry.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every progress uses the original travel, rotation and normal equations with no clipping, sampling or tolerance change.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant preparation serves P actual progress reads without repeated normal normalization, hinge-foot/sign construction or fixed hinge-axis length calculation. Axis prerequisites remain lazy until the original first angle; every read retains its actual angle trigonometry/point/normal transform in O(1).
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The plan owns one unchanged mechanism, initial place and hinge; only their geometry is shared, while each progress computes its own state.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The returned reader retains constant-size geometry until its operation plan is released; no history of progress or state results is stored.
   */
  export function prepare(
    mechanism: IAutoMovieMotionHumanOperate.Mechanism,
    place: IAutoMovieMotionHumanOperateState.IAtPlace,
    hinge: IAutoMovieMotionHumanOperateDrive.IHinge | undefined,
  ): (progress: number) => IAutoMovieMotionHumanOperateState.IAtResult {
    const n: IAutoMovieVector3 = Vector3.normalize(place.normal);
    switch (mechanism.kind) {
      case "button":
        return (progress: number): ReturnType<typeof at> => ({
          point: Vector3.add(
            place.point,
            Vector3.scale(n, -(mechanism.travel ?? 0.005) * progress),
          ),
          normal: n,
          roll: 0,
        });
      case "knob":
        return (progress: number): ReturnType<typeof at> => ({
          point: place.point,
          normal: n,
          roll: mechanism.turn * progress,
        });
      case "slider":
        return (progress: number): ReturnType<typeof at> => ({
          point: Vector3.add(
            place.point,
            Vector3.scale(n, mechanism.travel * progress),
          ),
          normal: n,
          roll: 0,
        });
      case "hinge": {
        // A pull turns the handle toward its normal's side about the line,
        // from the line's foot level with the handle.
        const axis: IAutoMovieVector3 = hinge!.axis ?? { x: 0, y: 1, z: 0 };
        const foot: IAutoMovieVector3 = operateDrive.foot(hinge!, place.point);
        const arm: IAutoMovieVector3 = Vector3.subtract(place.point, foot);
        const sign: number =
          Vector3.dot(Vector3.cross(axis, arm), n) >= 0 ? 1 : -1;
        const turning: ReturnType<typeof Quaternion.prepareAxisAngle> = Quaternion.prepareAxisAngle(axis);
        return (progress: number): ReturnType<typeof at> => {
          const turn: ReturnType<typeof turning> = turning(sign * mechanism.swing * progress);
          return {
            point: Vector3.add(foot, Quaternion.rotateVector(turn, arm)),
            normal: Quaternion.rotateVector(turn, n),
            roll: 0,
          };
        };
      }
      case "insert":
        return (progress: number): ReturnType<typeof at> => ({
          point: Vector3.add(
            place.point,
            Vector3.scale(n, -operateInsert.depth(mechanism, progress)),
          ),
          normal: n,
          roll: 0,
        });
    }
  }
}
