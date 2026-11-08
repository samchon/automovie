import type {
  IAutoMovieVector3,
  IAutoMoviePhysicalProfile as P,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";

/** Interpolate sampled goals and derive world velocities from the same shortest arc. */
export function samplePhysicalTarget(
  before: P.ITransform,
  after: P.ITransform,
  fraction: number,
  rate: number,
): {
  pose: P.ITransform;
  velocity: IAutoMovieVector3;
  angularVelocity: IAutoMovieVector3;
} {
  const delta: P.ITransform["rotation"] = Quaternion.multiply(
    after.rotation,
    Quaternion.inverse(before.rotation),
  );
  const sign: number = delta.w < 0 ? -1 : 1;
  const norm: number = Math.hypot(delta.x, delta.y, delta.z);
  const scale: number =
    norm < 1e-12
      ? 2 * sign * rate
      : (2 * Math.atan2(norm, Math.abs(delta.w)) * sign * rate) / norm;
  return {
    pose: {
      position: Vector3.add(
        before.position,
        Vector3.scale(
          Vector3.subtract(after.position, before.position),
          fraction,
        ),
      ),
      rotation: Quaternion.slerp(before.rotation, after.rotation, fraction),
    },
    velocity: Vector3.scale(
      Vector3.subtract(after.position, before.position),
      rate,
    ),
    angularVelocity: {
      x: delta.x * scale,
      y: delta.y * scale,
      z: delta.z * scale,
    },
  };
}
