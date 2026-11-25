import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanLean,
  IAutoMovieMotionHumanPosture,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { humanPostureHeading } from "../posture/humanPostureHeading";

/**
 * Aim the hip-to-mouth vector at the horizontal projection of the skin. A roll
 * about local forward sets the sideways component. Pitch about local left then
 * sets the forward component without changing the first. The upright roots of
 * both sine equations keep the body above the hips.
 *
 * @param entry The initial trunk angles.
 * @param hip The pivot, world metres.
 * @param mouth The mouth with the current head angles, world metres.
 * @param target The actual skin point, world metres.
 * @returns Added pitch and roll in degrees, or null outside the rigid reach.
 */
export function kissProjection(
  entry: IAutoMovieMotionHumanPosture,
  hip: IAutoMovieVector3,
  mouth: IAutoMovieVector3,
  target: IAutoMovieVector3,
): IAutoMovieMotionHumanLean.IAngles | null {
  const yaw: IAutoMovieQuaternion = humanPostureHeading({
    yaw: entry.yaw,
    pitch: 0,
    roll: 0,
  });
  const held: IAutoMovieVector3 = Quaternion.rotateVector(
    Quaternion.inverse(humanPostureHeading(entry)),
    Vector3.subtract(mouth, hip),
  );
  const goal: IAutoMovieVector3 = Quaternion.rotateVector(
    Quaternion.inverse(yaw),
    Vector3.subtract(target, hip),
  );
  const lateral: number = Math.hypot(held.x, held.y);
  if (lateral === 0 || Math.abs(goal.x) > lateral) return null;
  const roll: number = Math.atan2(held.x, held.y) - Math.asin(goal.x / lateral);
  const up: number = Math.sqrt(
    Math.max(0, lateral * lateral - goal.x * goal.x),
  );
  const sagittal: number = Math.hypot(up, held.z);
  if (sagittal === 0 || Math.abs(goal.z) > sagittal) return null;
  const pitch: number = Math.asin(goal.z / sagittal) - Math.atan2(held.z, up);
  const degrees: number = 180 / Math.PI;
  return {
    roll: roll * degrees - entry.roll,
    pitch: pitch * degrees - entry.pitch,
  };
}
