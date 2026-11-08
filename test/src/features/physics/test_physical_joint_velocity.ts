import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
  IAutoMoviePhysicalProfile as P,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { Quaternion } from "../../../../packages/engine/src/math/Quaternion";
import { Vector3 } from "../../../../packages/engine/src/math/Vector3";
import { projectPhysicalJointVelocity } from "../../../../packages/engine/src/physics/projectPhysicalJointVelocity";

/** Motor intent respects the actual differential of compound twist limits.
 *
 * Scenarios:
 * 1. A bend at a transverse limit rejects outward coupled velocity, including quaternion sign equivalence.
 * 2. An interior velocity remains unchanged, and a full-turn axis remains free.
 */
export function test_physical_joint_velocity(): void {
  const axis: P.IAxis = {
    axis: "y",
    minimum: -0.7,
    maximum: 0.7,
    stiffness: 10,
    damping: 1,
    maximumTorque: 10,
    channel: "transverse",
  };
  const raw: IAutoMovieQuaternion = {
    x: Math.tan(1.1),
    y: Math.tan(0.35),
    z: Math.tan(0.2),
    w: 1,
  };
  const norm: number = Math.hypot(raw.x, raw.y, raw.z, raw.w);
  const current: IAutoMovieQuaternion = {
    x: raw.x / norm,
    y: raw.y / norm,
    z: raw.z / norm,
    w: 1 / norm,
  };
  const requested: IAutoMovieVector3 = { x: 5, y: 0, z: 0 };
  const dt: number = 1e-5;
  const axes: P.IAxis[] = [
    axis,
    ...(["x", "z"] as const).map(
      (coordinate: "x" | "z"): P.IAxis => ({
        ...axis,
        axis: coordinate,
        minimum: -Math.PI,
        maximum: Math.PI,
      }),
    ),
  ];
  const projected: IAutoMovieVector3 = projectPhysicalJointVelocity(
    current,
    axes,
    requested,
    dt,
  );
  const opposite: IAutoMovieVector3 = projectPhysicalJointVelocity(
    { x: -current.x, y: -current.y, z: -current.z, w: -current.w },
    axes,
    requested,
    dt,
  );
  const advance: (velocity: IAutoMovieVector3) => number = (
    velocity: IAutoMovieVector3,
  ): number => {
    const speed: number = Vector3.length(velocity);
    const after: IAutoMovieQuaternion = Quaternion.multiply(
      Quaternion.fromAxisAngle(
        Vector3.scale(velocity, 1 / speed),
        (speed * dt * 180) / Math.PI,
      ),
      current,
    );
    return 2 * Math.atan2(after.y, after.w);
  };
  TestValidator.predicate(
    "plain bend velocity drives the transverse coordinate outside its bound",
    advance(requested) > axis.maximum + 1e-6,
  );
  TestValidator.predicate(
    "projected intent is tangent to the compound boundary",
    advance(projected) <= axis.maximum + 1e-8 &&
      Math.abs(projected.x - requested.x) > 0.1,
  );
  TestValidator.predicate(
    "quaternion sign cannot change the velocity policy",
    Vector3.length(Vector3.subtract(projected, opposite)) < 1e-10,
  );
  const free: IAutoMovieVector3 = projectPhysicalJointVelocity(
    Quaternion.identity(),
    [{ ...axis, minimum: -Math.PI, maximum: Math.PI }],
    requested,
    dt,
  );
  const interior: IAutoMovieVector3 = projectPhysicalJointVelocity(
    Quaternion.identity(),
    [axis],
    requested,
    dt,
  );
  TestValidator.predicate(
    "interior and full-turn intent stay unchanged",
    Vector3.length(Vector3.subtract(free, requested)) < 1e-10 &&
      Vector3.length(Vector3.subtract(interior, requested)) < 1e-10,
  );
}
