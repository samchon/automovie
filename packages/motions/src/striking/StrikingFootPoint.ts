import { Quaternion } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanFoot,
  IAutoMovieQuaternion,
} from "@automovie/interface";

import { HumanFoot } from "../posture/HumanFoot";

/**
 * A stepping foot pointed in the air: its toes turned down by `POINT`
 * degrees at the step's middle, so the ankle eases out of a stance's
 * dorsiflexion while the foot bears nothing, and the ankle raised by what
 * pointing lowers the toes, so the toes' clearance is the step's own.
 *
 * @param body The body.
 * @param side The foot.
 * @param placement The foot's placement on its step.
 * @param bump How far into its pointing the step is, 0 at its ends and 1 at its middle.
 * @returns The pointed placement.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the turn, its size and why the ankle rises.
 * @evidence contracts/development/implementation.md#principled-implementation The foot's pitch lowered about the ankle and the toe tip's drop added to the ankle's height.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One rotation, one toe reading each side.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The turn is a named provisional value.
 * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Shared by the guard's steps and the martial-art stance phrases.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function StrikingFootPoint(
  body: IAutoMovieMotionHumanBody,
  side: AutoMovieHumanSide,
  placement: IAutoMovieMotionHumanFoot.IPlacement,
  bump: number,
): IAutoMovieMotionHumanFoot.IPlacement {
  if (!(bump > 0)) return placement;
  // Toes down about the foot's own lateral axis, keeping its heading and roll.
  const pointed: IAutoMovieQuaternion = Quaternion.multiply(
    placement.rotation,
    Quaternion.fromAxisAngle(
      { x: 1, y: 0, z: 0 },
      StrikingFootPoint.POINT * bump,
    ),
  );
  const toe = (attitude: IAutoMovieQuaternion): number =>
    HumanFoot.point(body, side, "toe", {
      ankle: { x: 0, y: 0, z: 0 },
      rotation: attitude,
    }).y;
  return {
    ankle: {
      ...placement.ankle,
      y:
        placement.ankle.y + Math.max(0, toe(placement.rotation) - toe(pointed)),
    },
    rotation: pointed,
  };
}

/**
 * Constants of {@link StrikingFootPoint}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the constant and its unit.
 * @evidence contracts/development/design.md#principled-representation Degrees.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Read by the pointing only.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Provisional, named.
 */
export namespace StrikingFootPoint {
  /** A stepping foot's toes-down pitch at mid-step, degrees (provisional). */
  export const POINT: number = 25;
}
