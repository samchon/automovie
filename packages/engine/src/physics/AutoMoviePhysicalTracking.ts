import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
  IAutoMoviePhysicalProfile as P,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";

/**
 * Bounded implicit PD in a joint frame. Tan, Liu & Turk (2011), stable PD,
 * motivates solving the next-step damping term rather than an explicit stiff
 * spring. Axis inertia is the caller's effective inertia in kg m². The result
 * is N m, never a pose offset; equal opposite torques act on the joint bodies.
 */
export namespace AutoMoviePhysicalTracking {
  /** A measured tracking coordinate, including honest motor saturation. */
  export interface IResult {
    /** Joint-frame N m. */ torque: IAutoMovieVector3;
    /** Shortest-arc joint-frame rotation error in radians. */ error: IAutoMovieVector3;
    /** Axes whose requested torque exceeded their cap. */ saturated: (
      | "x"
      | "y"
      | "z"
    )[];
  }
  /** Calculate a torque without retaining a controller state or changing inputs. */
  export function torque(
    current: IAutoMovieQuaternion,
    target: IAutoMovieQuaternion,
    velocity: IAutoMovieVector3,
    axes: readonly P.IAxis[],
    inertia: IAutoMovieVector3,
    dt: number,
    strength: number,
  ): IResult {
    if (
      !(dt > 0) ||
      !Number.isFinite(dt) ||
      strength < 0 ||
      strength > 1 ||
      !Number.isFinite(strength)
    )
      throw new Error("Invalid physical tracking timestep or strength");
    const delta: IAutoMovieQuaternion = Quaternion.multiply(
      target,
      Quaternion.inverse(current),
    );
    const sign: number = delta.w < 0 ? -1 : 1;
    const norm: number = Math.hypot(delta.x, delta.y, delta.z);
    const scale: number =
      norm < 1e-12
        ? 2 * sign
        : (2 * Math.atan2(norm, Math.abs(delta.w)) * sign) / norm;
    const error: IAutoMovieVector3 = {
      x: delta.x * scale,
      y: delta.y * scale,
      z: delta.z * scale,
    };
    const result: IResult = {
      torque: { x: 0, y: 0, z: 0 },
      error,
      saturated: [],
    };
    for (const axis of axes) {
      const k: number = axis.stiffness * strength;
      const d: number = axis.damping * strength;
      const effective: number = inertia[axis.axis];
      if (!(effective > 0) || !Number.isFinite(effective))
        throw new Error("Invalid effective angular inertia");
      const raw: number =
        (k * error[axis.axis] - (d + k * dt) * velocity[axis.axis]) /
        (1 + (d * dt + k * dt * dt) / effective);
      const limit: number = axis.maximumTorque * strength;
      if (Math.abs(raw) > limit) result.saturated.push(axis.axis);
      result.torque[axis.axis] = Math.max(-limit, Math.min(limit, raw));
    }
    return result;
  }
  /** Root positional PD; gravity compensation is explicit in the caller's acceleration. */
  export function force(
    error: IAutoMovieVector3,
    velocity: IAutoMovieVector3,
    mass: number,
    stiffness: number,
    damping: number,
    maximumForce: number,
    dt: number,
  ): IAutoMovieVector3 {
    const value: IAutoMovieVector3 = Vector3.scale(
      Vector3.subtract(
        Vector3.scale(error, stiffness),
        Vector3.scale(velocity, damping + stiffness * dt),
      ),
      1 / (1 + (damping * dt + stiffness * dt * dt) / mass),
    );
    const length: number = Vector3.length(value);
    return length > maximumForce
      ? Vector3.scale(value, maximumForce / length)
      : value;
  }
}
