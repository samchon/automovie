import { AutoMovieEngineQuaternion } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanFoot,
  IAutoMovieQuaternion,
} from "@automovie/interface";

import { HumanFoot } from "../../posture/internal/HumanFoot";

/*
 * A stepping foot pointed in the air: its toes turned down by `POINT` degrees
 * at the step's middle, so the ankle eases out of a stance's dorsiflexion while
 * the foot bears nothing, and the ankle raised by what pointing lowers the
 * toes, so the toes' clearance is the step's own.
 * Parameter body: The body.
 * Parameter side: The foot.
 * Parameter placement: The foot's placement on its step.
 * Parameter bump: How far into its pointing the step is, 0 at its ends and 1 at its
 * middle.
 * Returns: The pointed placement.
 */
export function StrikingFootPoint(
  body: IAutoMovieMotionHumanBody,
  side: AutoMovieHumanSide,
  placement: IAutoMovieMotionHumanFoot.IPlacement,
  bump: number,
): IAutoMovieMotionHumanFoot.IPlacement {
  if (!(bump > 0)) return placement;
  // Toes down about the foot's own lateral axis, keeping its heading and roll.
  const pointed: IAutoMovieQuaternion = StrikingFootPoint.pointed(
    placement.rotation,
    bump,
  );
  const toe = (attitude: IAutoMovieQuaternion): number =>
    HumanFoot.point(body, side, "toe", {
      ankle: { x: 0, y: 0, z: 0 },
      rotation: attitude,
    }).y;
  return StrikingFootPoint.lift(placement, pointed, toe);
}

/*
 * Constants of StrikingFootPoint.
 */
export namespace StrikingFootPoint {
  /*
   * A stepping foot's toes-down pitch at mid-step, degrees (provisional).
   */
  export const POINT: number = 25;
  /*
   * The foot's attitude pointed by a bump: pitched `POINT` degrees a whole bump
   * about its own lateral axis.
   * Parameter rotation: The placed foot's attitude.
   * Parameter bump: The bump, a share.
   * Returns: The pointed attitude.
   */
  export function pointed(
    rotation: IAutoMovieQuaternion,
    bump: number,
  ): IAutoMovieQuaternion {
    return AutoMovieEngineQuaternion.multiply(
      rotation,
      AutoMovieEngineQuaternion.fromAxisAngle({ x: 1, y: 0, z: 0 }, POINT * bump),
    );
  }

  /*
   * A pointed placement: its ankle raised by as much as pointing lowers the
   * toe, so the toe never sinks below where it stood.
   * Parameter placement: The placed foot.
   * Parameter pointed: The pointed attitude.
   * Parameter toe: The toe's height under an attitude, ankle at the origin, metres.
   * Returns: The pointed placement.
   */
  export function lift(
    placement: IAutoMovieMotionHumanFoot.IPlacement,
    pointed: IAutoMovieQuaternion,
    toe: (attitude: IAutoMovieQuaternion) => number,
  ): IAutoMovieMotionHumanFoot.IPlacement {
    return {
      ankle: {
        ...placement.ankle,
        y:
          placement.ankle.y +
          Math.max(0, toe(placement.rotation) - toe(pointed)),
      },
      rotation: pointed,
    };
  }
}
