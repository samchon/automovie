import type {
  IAutoMovieRigidTransform,
  IAutoMovieSamplePhysicalTarget,
} from "@automovie/interface";

import { AutoMovieEngineQuaternion } from "../../math/AutoMovieEngineQuaternion";
import { AutoMovieEngineVector3 } from "../../math/AutoMovieEngineVector3";

/*
 * Interpolate sampled goals and derive world velocities from the same shortest
 * arc.
 */
export function samplePhysicalTarget(
  before: IAutoMovieRigidTransform,
  after: IAutoMovieRigidTransform,
  fraction: number,
  rate: number,
): IAutoMovieSamplePhysicalTarget.IResult {
  const delta: IAutoMovieRigidTransform["rotation"] = AutoMovieEngineQuaternion.multiply(
    after.rotation,
    AutoMovieEngineQuaternion.inverse(before.rotation),
  );
  const sign: number = delta.w < 0 ? -1 : 1;
  const norm: number = Math.hypot(delta.x, delta.y, delta.z);
  const scale: number =
    norm < 1e-12
      ? 2 * sign * rate
      : (2 * Math.atan2(norm, Math.abs(delta.w)) * sign * rate) / norm;
  return {
    pose: {
      position: AutoMovieEngineVector3.add(
        before.position,
        AutoMovieEngineVector3.scale(
          AutoMovieEngineVector3.subtract(after.position, before.position),
          fraction,
        ),
      ),
      rotation: AutoMovieEngineQuaternion.slerp(before.rotation, after.rotation, fraction),
    },
    velocity: AutoMovieEngineVector3.scale(
      AutoMovieEngineVector3.subtract(after.position, before.position),
      rate,
    ),
    angularVelocity: {
      x: delta.x * scale,
      y: delta.y * scale,
      z: delta.z * scale,
    },
  };
}
