import { Quaternion, Vector3, AutoMovieEngineMotionSampling } from "@automovie/engine";
import type {
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanHookSet,
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanBound } from "../../law/HumanBound";

/**
 * A hook set's rod turn: the tip rises by the authored angle on a minimum-jerk
 * course over the authored time, about the horizontal axis square to the rod (a
 * positive turn about `along × up` carries the rod toward up), the grip staying
 * where it is; the set is held `HOLD` before the hand eases back.
 *
 * @param rod The rod's rotation at the action's start; its +Y runs along it.
 * @param grip The hand's grip frame holding the rod.
 * @param params The lift's angle and time.
 * @returns The turn, its length and its cues.
 * @throws {HumanRefusal} When the lift lies outside 0 to `LIFT` degrees or the
 *   time has no length.
 */
export function hookSetTip(
  rod: IAutoMovieQuaternion,
  grip: IAutoMovieRigidTransform,
  params: Pick<IAutoMovieMotionHumanHookSet, "angle" | "duration">,
): hookSetTip.ITip {
  HumanBound.within("angle", params.angle, 0, hookSetTip.LIFT, "deg");
  HumanBound.least("duration", params.duration, 1e-3, "s");
  const along: IAutoMovieVector3 = Quaternion.rotateVector(rod, {
    x: 0,
    y: 1,
    z: 0,
  });
  const axis: IAutoMovieVector3 = Vector3.normalize(
    Vector3.cross(along, { x: 0, y: 1, z: 0 }),
  );
  const duration: number = params.duration + hookSetTip.HOLD;
  return {
    duration,
    events: [
      { name: "set", share: params.duration / duration },
      { name: "relax", share: 1 },
    ],
    turned: (t: number): IAutoMovieRigidTransform => ({
      position: grip.position,
      rotation: Quaternion.multiply(
        Quaternion.fromAxisAngle(
          axis,
          params.angle * AutoMovieEngineMotionSampling.minimumJerk(Math.min(1, t / params.duration)).s,
        ),
        grip.rotation,
      ),
    }),
  };
}

/** The hook set's turn. */
export namespace hookSetTip {
  /**
   * How long the set tip is held before the hand eases back, seconds
   * (provisional: a beat to feel the fish).
   */
  export const HOLD: number = 0.3;

  /**
   * The most a hook set lifts the tip, degrees (provisional: from a rod held
   * low to upright).
   */
  export const LIFT: number = 90;

  /** The rod's turn in the hand. */
  export interface ITip {
    /** The action's seconds: the lift and the hold. */
    duration: number;

    /** The `set` and `relax` cues. */
    events: IAutoMovieMotionEvent[];

    /**
     * The grip frame turning the rod at a second.
     *
     * @param t Seconds into the action.
     * @returns The hand's goal frame.
     */
    turned(t: number): IAutoMovieRigidTransform;
  }
}
