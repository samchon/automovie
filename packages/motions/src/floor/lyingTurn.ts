import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanPosture,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { humanPostureHeading } from "../posture/humanPostureHeading";

/**
 * The heading and turn a lying posture shows.
 *
 * @param posture The lying posture's tilt.
 * @returns Its supine heading and its turn in (-180, 180].
 */
export function lyingTurn(posture: Tilt): lyingTurn.ITurn {
  const rotation: IAutoMovieQuaternion = humanPostureHeading(posture);
  const head: IAutoMovieVector3 = Quaternion.rotateVector(rotation, {
    x: 0,
    y: 1,
    z: 0,
  });
  const chest: IAutoMovieVector3 = Quaternion.rotateVector(rotation, {
    x: 0,
    y: 0,
    z: 1,
  });
  const yaw: number = (Math.atan2(-head.x, -head.z) * 180) / Math.PI;
  const left: IAutoMovieVector3 = {
    x: Math.cos((yaw * Math.PI) / 180),
    y: 0,
    z: -Math.sin((yaw * Math.PI) / 180),
  };
  return {
    yaw,
    turn: (Math.atan2(Vector3.dot(chest, left), chest.y) * 180) / Math.PI,
  };
}

/**
 * A lying body's turn about its own long axis. A lying body is the supine one,
 * `Ry(yaw) Rx(-90)` (the head toward the heading's back, the chest up), turned
 * by `turn` degrees about its long axis, the root's `+Y`: `Ry(yaw) Rx(-90)
 * Ry(turn)`. At 0 it lies on its back, at 90 on its left side (the chest toward
 * where its left side faced), at 180 or -180 face down and at -90 on its right
 * side; a log roll keeps adding turns.
 */
export namespace lyingTurn {
  /** A lying heading and turn. */
  export interface ITurn {
    /** The supine heading, degrees: the head toward its back. */
    yaw: number;

    /**
     * The turn about the long axis, degrees: 0 supine, 90 on the left side, 180
     * prone, -90 on the right side.
     */
    turn: number;
  }

  /** The named lying positions' turns, degrees. */
  export const TURNS: Readonly<Record<TURNSEntryItem, number>> = {
    supine: 0,
    lateralLeft: 90,
    prone: 180,
    lateralRight: -90,
  };

  /**
   * The tilt of a heading and turn.
   *
   * @param turn The heading and the turn.
   * @returns The posture's yaw, pitch and roll.
   */
  export function tilt(turn: ITurn): Tilt {
    return humanPostureHeading.angles(
      Quaternion.multiply(
        Quaternion.multiply(
          Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, turn.yaw),
          Quaternion.fromAxisAngle({ x: 1, y: 0, z: 0 }, -90),
        ),
        Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, turn.turn),
      ),
    );
  }
}

/** The alternatives of `Tilt2`'s site. */
type Tilt2 = "yaw" | "pitch" | "roll";

/** A posture's whole-body tilt angles. */
type Tilt = Pick<IAutoMovieMotionHumanPosture, Tilt2>;
/** The alternatives of `TURNSEntryItem`'s site. */
type TURNSEntryItem = "supine" | "lateralLeft" | "prone" | "lateralRight";
