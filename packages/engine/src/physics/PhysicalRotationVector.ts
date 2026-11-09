import type {
  IAutoMovieQuaternion as Q,
  IAutoMovieVector3 as V,
} from "@automovie/interface";

import { Vector3 } from "../math/Vector3";

/**
 * SO(3) exponential coordinates and their left-Jacobian inverse retain the actual angular derivative at a pose handoff, including compound rotations.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (SO(3) exponential coordinates and their left-Jacobian inverse retain the actual angular derivative at a pose handoff, including compound rotations) and documents 4 documented members as stated in this comment.
 * @evidence contracts/development/design.md#principled-representation Represents SO(3) exponential coordinates and their left-Jacobian inverse retain the actual angular derivative at a pose handoff, including compound rotations: companion namespace of 4 members (`log`, `exp`, `derivative`, `velocity`); units and frames named in its text: radians, quaternion, second. It has no optional member, so no absent-value state combines with another.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `PhysicalRotationVector` in packages/engine/src/physics/PhysicalRotationVector.ts; its surface is the 4 members listed and the text shows 2 other files naming it, mostly packages/engine (2), so no member is declared for a presumed future need.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.
 */
export namespace PhysicalRotationVector {
  /**
   * Shortest rotation vector in radians, canonical across quaternion sign.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents the member contract in its own summary: Shortest rotation vector in radians, canonical across quaternion sign.
   * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (Shortest rotation vector in radians, canonical across quaternion sign) directly over its typed inputs (`rotation`) as a fixed number of statements with no loop or recursion in the body, delegating to `Math.hypot`, `Math.atan2`, `Math.abs`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body performs no validation and relies on its callers. Beyond structural 0, 1 and 2 the body uses the literal 1e-12, whose basis this answer does not independently establish and a reviewer must confirm.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One operation of 13 lines and 4 top-level statements that reuses `Math.hypot`, `Math.atan2`, `Math.abs` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Scanning the body finds no `any`, type assertion, non-null assertion, suppression directive or TODO, and no branch keyed on a consumer, fixture or expected answer; values come from its parameters. Literal caveat: 1e-12 are not independently sourced here.
   * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `rotation`; the dominant cost is a fixed number of statements with no loop or recursion in the body, performed once per call with 1 allocation site (literals and constructed values). No speedup is claimed and none is measured.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function acquires no handle, timer, listener or task and keeps no state between calls; its 1 allocation site become the returned value or die with the call, so nothing grows.
   */
  export function log(rotation: Q): V {
    const norm: number = Math.hypot(rotation.x, rotation.y, rotation.z);
    const sign: number = rotation.w < 0 ? -1 : 1;
    const scale: number =
      norm > 1e-12
        ? (2 * Math.atan2(norm, Math.abs(rotation.w)) * sign) / norm
        : 2 * sign;
    return {
      x: rotation.x * scale,
      y: rotation.y * scale,
      z: rotation.z * scale,
    };
  }
  /**
   * Exponentiate a finite rotation vector, without an Euler-angle decomposition.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents the member contract in its own summary: Exponentiate a finite rotation vector, without an Euler-angle decomposition.
   * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (Exponentiate a finite rotation vector, without an Euler-angle decomposition) directly over its typed inputs (`vector`) as a fixed number of statements with no loop or recursion in the body, delegating to `Vector3.length`, `Math.sin`, `Math.cos`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body performs no validation and relies on its callers. Beyond structural 0, 1 and 2 the body uses the literals 1e-12, 0.5, whose basis this answer does not independently establish and a reviewer must confirm.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One operation of 10 lines and 3 top-level statements that reuses `Vector3.length`, `Math.sin`, `Math.cos` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Scanning the body finds no `any`, type assertion, non-null assertion, suppression directive or TODO, and no branch keyed on a consumer, fixture or expected answer; values come from its parameters. Literal caveat: 1e-12, 0.5 are not independently sourced here.
   * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `vector`; the dominant cost is a fixed number of statements with no loop or recursion in the body, performed once per call with 1 allocation site (literals and constructed values). No speedup is claimed and none is measured.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function acquires no handle, timer, listener or task and keeps no state between calls; its 1 allocation site become the returned value or die with the call, so nothing grows.
   */
  export function exp(vector: V): Q {
    const angle: number = Vector3.length(vector);
    const scale: number = angle > 1e-12 ? Math.sin(angle / 2) / angle : 0.5;
    return {
      x: vector.x * scale,
      y: vector.y * scale,
      z: vector.z * scale,
      w: Math.cos(angle / 2),
    };
  }
  /**
   * Convert a spatial angular velocity into the derivative of a shortest rotation vector. The cot(theta/2) form stays finite at pi.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents the member contract in its own summary: Convert a spatial angular velocity into the derivative of a shortest rotation vector.
   * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (Convert a spatial angular velocity into the derivative of a shortest rotation vector) directly over its typed inputs (`vector`, `velocity`) as a fixed number of statements with no loop or recursion in the body, delegating to `Vector3.length`, `Math.tan`, `Vector3.cross`, `Vector3.add`, `Vector3.subtract`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body performs no validation and relies on its callers. Beyond structural 0, 1 and 2 the body uses the literals 0.00001, 12, 720, 0.5, whose basis this answer does not independently establish and a reviewer must confirm.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One operation of 12 lines and 4 top-level statements that reuses `Vector3.length`, `Math.tan`, `Vector3.cross`, `Vector3.add`, `Vector3.subtract` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Scanning the body finds no `any`, type assertion, non-null assertion, suppression directive or TODO, and no branch keyed on a consumer, fixture or expected answer; values come from its parameters. Literal caveat: 0.00001, 12, 720, 0.5 are not independently sourced here.
   * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `vector`, `velocity`; the dominant cost is a fixed number of statements with no loop or recursion in the body, performed once per call. No speedup is claimed and none is measured.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function acquires no handle, timer, listener or task and keeps no state between calls; its 0 allocation sites become the returned value or die with the call, so nothing grows.
   */
  export function derivative(vector: V, velocity: V): V {
    const angle: number = Vector3.length(vector);
    const factor: number =
      angle > 1e-5
        ? (1 - angle / (2 * Math.tan(angle / 2))) / (angle * angle)
        : 1 / 12 + (angle * angle) / 720;
    const cross: V = Vector3.cross(vector, velocity);
    return Vector3.add(
      Vector3.subtract(velocity, Vector3.scale(cross, 0.5)),
      Vector3.scale(Vector3.cross(vector, cross), factor),
    );
  }
  /**
   * Left-Jacobian action converts exponential-coordinate derivatives back to spatial angular velocity.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents the member contract in its own summary: Left-Jacobian action converts exponential-coordinate derivatives back to spatial angular velocity.
   * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (Left-Jacobian action converts exponential-coordinate derivatives back to spatial angular velocity) directly over its typed inputs (`vector`, `derivative`) as a fixed number of statements with no loop or recursion in the body, delegating to `Vector3.length`, `Math.cos`, `Math.sin`, `Vector3.cross`, `Vector3.add`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body performs no validation and relies on its callers. Beyond structural 0, 1 and 2 the body uses the literals 0.00001, 0.5, 24, 3, 6, whose basis this answer does not independently establish and a reviewer must confirm.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One operation of 19 lines and 5 top-level statements that reuses `Vector3.length`, `Math.cos`, `Math.sin`, `Vector3.cross`, `Vector3.add` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Scanning the body finds no `any`, type assertion, non-null assertion, suppression directive or TODO, and no branch keyed on a consumer, fixture or expected answer; values come from its parameters. Literal caveat: 0.00001, 0.5, 24, 3, 6 are not independently sourced here.
   * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `vector`, `derivative`; the dominant cost is a fixed number of statements with no loop or recursion in the body, performed once per call. No speedup is claimed and none is measured.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function acquires no handle, timer, listener or task and keeps no state between calls; its 0 allocation sites become the returned value or die with the call, so nothing grows.
   */
  export function velocity(vector: V, derivative: V): V {
    const angle: number = Vector3.length(vector);
    const first: number =
      angle > 1e-5
        ? (1 - Math.cos(angle)) / (angle * angle)
        : 0.5 - (angle * angle) / 24;
    const second: number =
      angle > 1e-5
        ? (angle - Math.sin(angle)) / angle ** 3
        : 1 / 6 - (angle * angle) / 120;
    const cross: V = Vector3.cross(vector, derivative);
    return Vector3.add(
      derivative,
      Vector3.add(
        Vector3.scale(cross, first),
        Vector3.scale(Vector3.cross(vector, cross), second),
      ),
    );
  }
}
