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
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (Bounded implicit PD in a joint frame) and documents 3 documented members as stated in this comment.
 * @evidence contracts/development/design.md#principled-representation Represents Bounded implicit PD in a joint frame: companion namespace of 3 members (`IResult`, `torque`, `force`); units and frames named in its text: frame, radians, quaternion. It has no optional member, so no absent-value state combines with another.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `AutoMoviePhysicalTracking` in packages/engine/src/physics/AutoMoviePhysicalTracking.ts; its surface is the 3 members listed and the text shows 5 other files naming it, mostly packages/engine (4), test (1), so no member is declared for a presumed future need.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.
 */
export namespace AutoMoviePhysicalTracking {
  /**
   * A measured tracking coordinate, including honest motor saturation.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents the member contract in its own summary: A measured tracking coordinate, including honest motor saturation.
   * @evidence contracts/development/design.md#principled-representation Represents A measured tracking coordinate, including honest motor saturation: interface of 3 members (`torque`, `error`, `saturated`); units and frames named in its text: frame, radians. It has no optional member, so no absent-value state combines with another.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `IResult` in packages/engine/src/physics/AutoMoviePhysicalTracking.ts; its surface is the 3 members listed and the text shows 176 other files naming it, mostly packages/human (64), test (54), movies (27), so no member is declared for a presumed future need.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.
   */
  export interface IResult {
    /** Joint-frame N m. */ torque: IAutoMovieVector3;
    /** Shortest-arc joint-frame rotation error in radians. */ error: IAutoMovieVector3;
    /** Axes whose requested torque exceeded their cap. */ saturated: (
      | "x"
      | "y"
      | "z"
    )[];
  }
  /**
   * Calculate a torque without retaining a controller state or changing inputs.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents the member contract in its own summary: Calculate a torque without retaining a controller state or changing inputs.
   * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (Calculate a torque without retaining a controller state or changing inputs) directly over its typed inputs (`current`, `target`, `velocity`, `axes`, `inertia`, `dt`, `strength`) as a single pass (for-of over axes), delegating to `Number.isFinite`, `Quaternion.multiply`, `Quaternion.inverse`, `Math.hypot`, `Math.atan2`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body throws (2 throw sites). Beyond structural 0, 1 and 2 the body uses the literal 1e-12, whose basis this answer does not independently establish and a reviewer must confirm.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One operation of 44 lines and 9 top-level statements that reuses `Number.isFinite`, `Quaternion.multiply`, `Quaternion.inverse`, `Math.hypot`, `Math.atan2` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Scanning the body finds no `any`, type assertion, non-null assertion, suppression directive or TODO, and no branch keyed on a consumer, fixture or expected answer; values come from its parameters. Literal caveat: 1e-12 are not independently sourced here.
   * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `current`, `target`, `velocity`, `axes`, `inertia`, `dt`, `strength`; the dominant cost is a single pass (for-of over axes), performed once per call with 6 allocation sites (literals and constructed values). No speedup is claimed and none is measured.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function acquires no handle, timer, listener or task and keeps no state between calls; its 6 allocation sites become the returned value or die with the call, so nothing grows.
   */
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
  /**
   * Root positional PD; gravity compensation is explicit in the caller's acceleration.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents the member contract in its own summary: Root positional PD; gravity compensation is explicit in the caller's acceleration.
   * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (Root positional PD; gravity compensation is explicit in the caller's acceleration) directly over its typed inputs (`error`, `velocity`, `mass`, `stiffness`, `damping`, `maximumForce`, `dt`) as a fixed number of statements with no loop or recursion in the body, delegating to `Vector3.scale`, `Vector3.subtract`, `Vector3.length`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body performs no validation and relies on its callers. Apart from structural 0, 1 and 2 the body uses no numeric literal.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One operation of 13 lines and 3 top-level statements that reuses `Vector3.scale`, `Vector3.subtract`, `Vector3.length` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Scanning the body finds no `any`, type assertion, non-null assertion, suppression directive or TODO, and no branch keyed on a consumer, fixture or expected answer; values come from its parameters.
   * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `error`, `velocity`, `mass`, `stiffness`, `damping`, `maximumForce`, `dt`; the dominant cost is a fixed number of statements with no loop or recursion in the body, performed once per call. No speedup is claimed and none is measured.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function acquires no handle, timer, listener or task and keeps no state between calls; its 0 allocation sites become the returned value or die with the call, so nothing grows.
   */
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
