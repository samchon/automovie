import { Quaternion, Vector3, minimumJerk } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanFoot,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanFoot } from "../posture/HumanFoot";

/**
 * A stepping foot's placement through its swing: it travels and turns on a
 * minimum-jerk share of the swing's time (Flash and Hogan 1985), and its sole's
 * lowest point rises by `clearance sin(pi u)` of that time `u` above the line
 * joining that point's heights at the two ends. Clearance is the sole's, as
 * gait measures it at the foot's lowest point, the toe's minimum clearance of
 * the swing (Winter 1992, Phys Ther 72(1):45-53), not the ankle's: a foot that
 * turns as it swings (onto a raised heel, the ball landing first) carries its
 * toe below the ankle's path, so an ankle raised by the half sine let the toe
 * reach the floor while it still travelled. The ankle therefore rises by the
 * half sine and by how far the foot's turn at that share carries its sole's
 * lowest point (`HumanFoot.lowest`) below that line. Near either end the rise
 * changes at first order in time while the travel and the turn change at third
 * order, so the foot leaves its support before it moves along it and comes down
 * after it has stopped: no point of the sole slides on the support at lift-off
 * or at touch-down. A curve whose rise follows the travel's own share (a
 * parabola of it) keeps the sole within a few millimetres of the support while
 * the foot already slides, and the toes on the floor drag.
 *
 * @param body The body.
 * @param side The swinging foot.
 * @param from The placement the foot leaves.
 * @param to The placement it lands on.
 * @param clearance The sole's greatest rise above its line, metres.
 * @param time How far through the swing in time, 0 to 1.
 * @returns The placement.
 */
export function AutoMovieMotionHumanFootSwing(
  body: IAutoMovieMotionHumanBody,
  side: AutoMovieHumanSide,
  from: IAutoMovieMotionHumanFoot.IPlacement,
  to: IAutoMovieMotionHumanFoot.IPlacement,
  clearance: number,
  time: number,
): IAutoMovieMotionHumanFoot.IPlacement {
  const u: number = Math.min(1, Math.max(0, time));
  const s: number = minimumJerk.share(u);
  const ankle: IAutoMovieVector3 = Vector3.lerp(from.ankle, to.ankle, s);
  const rotation: IAutoMovieQuaternion = Quaternion.slerp(
    from.rotation,
    to.rotation,
    s,
  );
  // How far the turn carries the sole's lowest point below its line between
  // the ends.
  const low: number = HumanFoot.lowest(body, side, from);
  const line: number = low + (HumanFoot.lowest(body, side, to) - low) * s;
  const drop: number = Math.max(
    0,
    line - HumanFoot.lowest(body, side, { ankle, rotation }),
  );
  return {
    ankle: {
      ...ankle,
      y: ankle.y + clearance * Math.sin(Math.PI * u) + drop,
    },
    rotation,
  };
}
