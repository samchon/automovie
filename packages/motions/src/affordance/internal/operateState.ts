import { AutoMovieEngineQuaternion, AutoMovieEngineVector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanOperate,
  IAutoMovieMotionHumanOperateDrive,
  IAutoMovieMotionHumanOperateState,
  IAutoMovieVector3,
} from "@automovie/interface";

import { operateDrive } from "./operateDrive";
import { operateInsert } from "./operateInsert";

/*
 * The moving part of an operated mechanism on a prop that does not articulate,
 * as the mechanism's own geometry moves it: a button's face in along its axis,
 * a knob turned about it, a slider's handle along it, a leaf's handle about its
 * hinge line (a door's vertical through the point it names, or the line's own
 * axis), an insertion's socket depth. A prop that articulates poses its own
 * part instead (`operateDrive.part`).
 */
export namespace operateState {
  /*
   * The moving part's place at a progress of its movement.
   * Parameter mechanism: The mechanism.
   * Parameter place: The part's place at rest: its point and outward normal.
   * Parameter hinge: The hinge line, for a leaf: a point of it, and its unit axis,
   * the vertical when absent.
   * Parameter progress: 0 at rest, 1 at the end of the movement.
   * Returns: The point and the normal, and the roll about the normal in
   * degrees.
   */
  export function at(
    mechanism: IAutoMovieMotionHumanOperate.Mechanism,
    place: IAutoMovieMotionHumanOperateState.IAtPlace,
    hinge: IAutoMovieMotionHumanOperateDrive.IHinge | undefined,
    progress: number,
  ): IAutoMovieMotionHumanOperateState.IAtResult {
    return prepare(mechanism, place, hinge)(progress);
  }

  /*
   * Prepare a rigid mechanism's fixed axis geometry before its progress varies.
   * Parameter mechanism: The unchanged authored mechanism and travel.
   * Parameter place: Its initial world point and outward normal.
   * Parameter hinge: Its fixed hinge line when it swings.
   * Returns: The actual point, normal and roll at each supplied progress.
   */
  export function prepare(
    mechanism: IAutoMovieMotionHumanOperate.Mechanism,
    place: IAutoMovieMotionHumanOperateState.IAtPlace,
    hinge: IAutoMovieMotionHumanOperateDrive.IHinge | undefined,
  ): (progress: number) => IAutoMovieMotionHumanOperateState.IAtResult {
    const n: IAutoMovieVector3 = AutoMovieEngineVector3.normalize(place.normal);
    switch (mechanism.kind) {
      case "button":
        return (progress: number): ReturnType<typeof at> => ({
          point: AutoMovieEngineVector3.add(
            place.point,
            AutoMovieEngineVector3.scale(n, -operateDrive.amount(mechanism) * progress),
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
          point: AutoMovieEngineVector3.add(
            place.point,
            AutoMovieEngineVector3.scale(n, mechanism.travel * progress),
          ),
          normal: n,
          roll: 0,
        });
      case "hinge": {
        // A pull turns the handle toward its normal's side about the line,
        // from the line's foot level with the handle.
        const axis: IAutoMovieVector3 = hinge!.axis ?? { x: 0, y: 1, z: 0 };
        const foot: IAutoMovieVector3 = operateDrive.foot(hinge!, place.point);
        const arm: IAutoMovieVector3 = AutoMovieEngineVector3.subtract(place.point, foot);
        const sign: number =
          AutoMovieEngineVector3.dot(AutoMovieEngineVector3.cross(axis, arm), n) >= 0 ? 1 : -1;
        const turning: ReturnType<typeof AutoMovieEngineQuaternion.prepareAxisAngle> =
          AutoMovieEngineQuaternion.prepareAxisAngle(axis);
        return (progress: number): ReturnType<typeof at> => {
          const turn: ReturnType<typeof turning> = turning(
            sign * mechanism.swing * progress,
          );
          return {
            point: AutoMovieEngineVector3.add(foot, AutoMovieEngineQuaternion.rotateVector(turn, arm)),
            normal: AutoMovieEngineQuaternion.rotateVector(turn, n),
            roll: 0,
          };
        };
      }
      case "insert":
        return (progress: number): ReturnType<typeof at> => ({
          point: AutoMovieEngineVector3.add(
            place.point,
            AutoMovieEngineVector3.scale(n, -operateInsert.depth(mechanism, progress)),
          ),
          normal: n,
          roll: 0,
        });
    }
  }
}
