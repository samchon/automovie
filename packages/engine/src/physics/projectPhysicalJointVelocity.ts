import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
  IAutoMoviePhysicalProfile as P,
} from "@automovie/interface";

import { Vector3 } from "../math/Vector3";

/**
 * Project a motor's requested relative angular velocity onto the linearized
 * native twist-coordinate box for the next substep. For theta=2 atan2(qi,qw),
 * the exact differential includes the other quaternion components; projecting
 * only the named angular-velocity component fails at compound rotations.
 * Eight cyclic half-space passes bound work and preserve already admissible
 * requests. This constrains motor intent, not actual velocities or poses;
 * native constraints and the declared motor torque caps still govern motion.
 */
export function projectPhysicalJointVelocity(
  current: IAutoMovieQuaternion,
  axes: readonly P.IAxis[],
  requested: IAutoMovieVector3,
  dt: number,
): IAutoMovieVector3 {
  if (!(dt > 0) || !Number.isFinite(dt))
    throw new Error("Invalid physical joint velocity timestep");
  const velocity: IAutoMovieVector3 = { ...requested };
  const imaginary: IAutoMovieVector3 = {
    x: current.x,
    y: current.y,
    z: current.z,
  };
  const constraints: {
    gradient: IAutoMovieVector3;
    minimum: number;
    maximum: number;
  }[] = [];
  for (const axis of axes) {
    if (axis.maximum - axis.minimum >= 2 * Math.PI) continue;
    const component: number = current[axis.axis];
    const denominator: number = current.w ** 2 + component ** 2;
    if (denominator < 1e-12) continue;
    const unit: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
    unit[axis.axis] = 1;
    const gradient: IAutoMovieVector3 = Vector3.scale(
      Vector3.add(
        Vector3.add(
          Vector3.scale(unit, current.w ** 2),
          Vector3.scale(Vector3.cross(imaginary, unit), current.w),
        ),
        Vector3.scale(imaginary, component),
      ),
      1 / denominator,
    );
    for (const coordinate of ["x", "y", "z"] as const)
      if (!axes.some((free: P.IAxis): boolean => free.axis === coordinate))
        gradient[coordinate] = 0;
    const angle: number = Math.atan2(
      Math.sin(2 * Math.atan2(component, current.w)),
      Math.cos(2 * Math.atan2(component, current.w)),
    );
    constraints.push({
      gradient,
      minimum: (axis.minimum - angle) / dt,
      maximum: (axis.maximum - angle) / dt,
    });
  }
  for (let pass: number = 0; pass < 8; pass++) {
    let changed: boolean = false;
    for (const constraint of constraints) {
      const speed: number = Vector3.dot(constraint.gradient, velocity);
      const allowed: number = Math.max(
        constraint.minimum,
        Math.min(constraint.maximum, speed),
      );
      if (Math.abs(allowed - speed) < 1e-10) continue;
      const correction: IAutoMovieVector3 = Vector3.scale(
        constraint.gradient,
        (allowed - speed) /
          Vector3.dot(constraint.gradient, constraint.gradient),
      );
      velocity.x += correction.x;
      velocity.y += correction.y;
      velocity.z += correction.z;
      changed = true;
    }
    if (!changed) break;
  }
  return velocity;
}
