import type {
  IAutoMoviePhysicalJointAxis,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { AutoMoviePhysicalJointChart } from "./AutoMoviePhysicalJointChart";

/**
 * Project a motor's requested relative angular velocity onto the linearized
 * native coordinate box for the next substep: each coordinate's rate held
 * between the rates that reach its axis's ends within the substep.
 *
 * The box is read in the coordinates the solver limits the joint in. A joint
 * declaring a sequential chart (`order`) is limited on its chart's angles
 * (`projectPhysicalJointRotation`, `measurePhysicalJointLimits`), so its box is
 * read there, each free axis's rate the rate of its chart angle, as the
 * articulation drives it along the chart's axes (`solveXpbdArticulation`). A
 * compound rotation's independent twist coordinates differ from its chart
 * angles, and a box read in them sees ends the solver does not enforce: a
 * rotation inside its chart box read a fixed angle e past an end would ask e /
 * h of the motor every substep h, a speed growing as h shrinks that no position
 * correction removes, since the solver's velocities follow from its corrected
 * poses alone (Mueller, Macklin, Chentanez, Jeschke and Kim 2020, "Detailed
 * Rigid Body Simulation with Extended Position Based Dynamics", section 3.3, v
 * = dx / h). Otherwise, for theta = 2 atan2(qi, qw), the exact differential
 * includes the other quaternion components; projecting only the named
 * angular-velocity component fails at compound rotations, and eight cyclic
 * half-space passes bound work and preserve already admissible requests. This
 * constrains motor intent, not actual velocities or poses; native constraints
 * and the declared motor torque caps still govern motion.
 *
 * @param current The joint's relative rotation.
 * @param axes Its free axes and their ranges.
 * @param requested The requested relative angular velocity, per axis.
 * @param dt The substep, seconds.
 * @param order The joint's sequential chart, when it declares one.
 * @returns The projected velocity.
 */
export function projectPhysicalJointVelocity(
  current: IAutoMovieQuaternion,
  axes: readonly IAutoMoviePhysicalJointAxis[],
  requested: IAutoMovieVector3,
  dt: number,
  order?: readonly IAutoMoviePhysicalJointAxis["axis"][],
): IAutoMovieVector3 {
  if (dt <= 0) throw new Error("Invalid physical joint velocity timestep");
  const velocity: IAutoMovieVector3 = { ...requested };
  if (order !== undefined) {
    const angles: number[] = AutoMoviePhysicalJointChart.nearest(
      { axes, order },
      Quaternion.normalize(current),
    );
    for (const axis of axes) {
      const angle: number | undefined = angles[order.indexOf(axis.axis)];
      if (angle === undefined || axis.maximum - axis.minimum >= 2 * Math.PI)
        continue;
      velocity[axis.axis] = Math.max(
        (axis.minimum - angle) / dt,
        Math.min((axis.maximum - angle) / dt, velocity[axis.axis]),
      );
    }
    return velocity;
  }
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
      if (
        !axes.some(
          (free: IAutoMoviePhysicalJointAxis): boolean =>
            free.axis === coordinate,
        )
      )
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
