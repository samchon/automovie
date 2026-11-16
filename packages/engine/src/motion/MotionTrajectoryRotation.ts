import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";

/**
 * Rotation-vector operations shared by trajectory construction and playback.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each operation states its frame, units and formula.
 * @evidence contracts/development/design.md#principled-representation Body-frame rotation vectors implement the exponential map and its inverse differential without an integration callback or a shape history.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The fixed and adaptive steppers and their numeric readers share these three operations.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No second tableau, rotation convention or motion model is introduced.
 */
export namespace MotionTrajectoryRotation {
  /**
   * Turn `q` by `exp(v/2)` in its body frame; null or absent blocks stay unchanged.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The quaternion is unit and the vector is in body-frame radians.
   * @evidence contracts/development/implementation.md#principled-implementation Right multiplication by the axis-angle exponential preserves the body-frame convention used by both steppers.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Handle absent or zero rotation, then apply the quaternion product.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The angle is the vector's norm, with no small-angle clamp.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Uses the engine's quaternion operations.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains no state.
   */
  export function turn(
    q: IAutoMovieQuaternion | null,
    v: IAutoMovieVector3 | undefined,
  ): IAutoMovieQuaternion | null {
    if (q === null || v === undefined) return q;
    const angle: number = Math.hypot(v.x, v.y, v.z);
    if (angle === 0) return q;
    return Quaternion.multiply(
      q,
      Quaternion.fromAxisAngle(v, (angle * 180) / Math.PI),
    );
  }

  /**
   * Scale a vector, preserving an absent orientation block.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Returns s times v, or undefined for an absent block.
   * @evidence contracts/development/implementation.md#principled-implementation Componentwise scalar multiplication.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One conditional expression.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No component is clamped or replaced.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure arithmetic operation.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains no state.
   */
  export function scaled(
    v: IAutoMovieVector3 | undefined,
    s: number,
  ): IAutoMovieVector3 | undefined {
    return v === undefined ? undefined : { x: s * v.x, y: s * v.y, z: s * v.z };
  }

  /**
   * The inverse exponential differential `w + r cross w/2 + r cross (r cross w)/12`.
   *
   * For `q' = q w/2` this is the body-frame Bernoulli series through its
   * second bracket. The third Bernoulli number is zero, retaining order five
   * as well as four (Munthe-Kaas 1999, Appl Numer Math 29:115-127).
   *
   * @evidence contracts/development/common.md#meaningful-documentation r is a body-frame rotation in radians, w a body-frame angular rate in radians per second; an absent block stays absent.
   * @evidence contracts/development/implementation.md#principled-implementation The stated truncated inverse differential is the RKMK construction shared by fixed RK4 and adaptive DP5(4).
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Compute the first and second cross products, then their weighted sum.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Keeps the existing Bernoulli coefficients and body-frame signs.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Uses the engine's vector cross product.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains no state.
   */
  export function dexpinv(
    r: IAutoMovieVector3 | undefined,
    w: IAutoMovieVector3 | undefined,
  ): IAutoMovieVector3 | undefined {
    if (r === undefined || w === undefined) return w;
    const a: IAutoMovieVector3 = Vector3.cross(r, w);
    const b: IAutoMovieVector3 = Vector3.cross(r, a);
    return {
      x: w.x + a.x / 2 + b.x / 12,
      y: w.y + a.y / 2 + b.y / 12,
      z: w.z + a.z / 2 + b.z / 12,
    };
  }
}
