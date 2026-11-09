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
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (Project a motor's requested relative angular velocity onto the linearized native twist-coordinate box for the next substep) as stated in this comment.
 * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (Project a motor's requested relative angular velocity onto the linearized native twist-coordinate box for the next substep) directly over its typed inputs (`current`, `axes`, `requested`, `dt`) as nested iteration of depth 3 (for-of over axes; for-of over ["x", "y", "z"] as const; some over axes), delegating to `Number.isFinite`, `Vector3.scale`, `Vector3.add`, `Vector3.cross`, `axes.some`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body throws (1 throw site). Beyond structural 0, 1 and 2 the body uses the literals 1e-12, 8, 1e-10, whose basis this answer does not independently establish and a reviewer must confirm.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One operation of 67 lines and 7 top-level statements that reuses `Number.isFinite`, `Vector3.scale`, `Vector3.add`, `Vector3.cross`, `axes.some` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Scanning the body finds no `any`, type assertion, non-null assertion, suppression directive or TODO, and no branch keyed on a consumer, fixture or expected answer; values come from its parameters. Literal caveat: 1e-12, 8, 1e-10 are not independently sourced here.
 * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `current`, `axes`, `requested`, `dt`; the dominant cost is nested iteration of depth 3 (for-of over axes; for-of over ["x", "y", "z"] as const; some over axes), performed once per call with 7 allocation sites (literals and constructed values). No speedup is claimed and none is measured.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function acquires no handle, timer, listener or task and keeps no state between calls; its 7 allocation sites become the returned value or die with the call, so nothing grows.
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
