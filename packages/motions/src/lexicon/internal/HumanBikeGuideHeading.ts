import { Quaternion } from "@automovie/engine";
import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

/*
 * A rotation's heading about the world up axis, degrees, +Z at 0 and +X at 90.
 */
export function HumanBikeGuideHeading(rotation: IAutoMovieQuaternion): number {
  const forward: IAutoMovieVector3 = Quaternion.rotateVector(rotation, {
    x: 0,
    y: 0,
    z: 1,
  });
  return (Math.atan2(forward.x, forward.z) * 180) / Math.PI;
}
