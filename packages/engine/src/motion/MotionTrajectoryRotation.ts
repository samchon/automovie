import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { MotionTrajectoryPolynomial } from "./MotionTrajectoryPolynomial";

/**
 * Rotation-vector operations shared by trajectory construction and playback.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each operation states its frame, units and formula.
 * @evidence contracts/development/design.md#principled-representation Body-frame rotation vectors implement the exponential map and its inverse differential without an integration callback or a shape history.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Fixed and adaptive construction, dense physical admission and numeric playback share exponential, algebra and continuous-polynomial operations.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No second tableau, rotation convention or motion model is introduced.
 */
export namespace MotionTrajectoryRotation {
  /**
   * Read a dense rotation vector from four or five polynomial coefficients.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Coefficients and result are body-frame radians; u is the dimensionless step share.
   * @evidence contracts/development/implementation.md#principled-implementation Applies the shared scalar continuous-extension polynomial to all three components.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One scalar evaluation per component.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Four coefficients retain the original quartic arithmetic; five select the paired quintic, with no replacement grid.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work and one output vector.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Construction, defect admission and playback share this same numeric curve.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns a fresh vector and retains no input.
   */
  export function curve(terms: readonly IAutoMovieVector3[], u: number): IAutoMovieVector3 {
    return {
      x: MotionTrajectoryPolynomial.value(u, terms[0]!.x, terms[1]!.x, terms[2]!.x, terms[3]!.x, terms[4]?.x),
      y: MotionTrajectoryPolynomial.value(u, terms[0]!.y, terms[1]!.y, terms[2]!.y, terms[3]!.y, terms[4]?.y),
      z: MotionTrajectoryPolynomial.value(u, terms[0]!.z, terms[1]!.z, terms[2]!.z, terms[3]!.z, terms[4]?.z),
    };
  }

  /**
   * Differentiate the same rotation-vector curve with respect to seconds.
   *
   * @evidence contracts/development/common.md#meaningful-documentation h is seconds and the output is a rotation-vector derivative in radians per second, not yet body angular velocity.
   * @evidence contracts/development/implementation.md#principled-implementation Analytically differentiates the scalar polynomial and divides by h. Applying Jr(curve) converts this coordinate derivative to actual body angular velocity.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One scalar derivative per component.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No finite-difference time or sampled frame enters the derivative.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work and one vector.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Uses curve's exact same coefficients and the shared polynomial derivative.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns a fresh vector without retaining coefficients.
   */
  export function curveDerivative(terms: readonly IAutoMovieVector3[], u: number, h: number): IAutoMovieVector3 {
    return {
      x: MotionTrajectoryPolynomial.slope(u, terms[0]!.x, terms[1]!.x, terms[2]!.x, terms[3]!.x, terms[4]?.x) / h,
      y: MotionTrajectoryPolynomial.slope(u, terms[0]!.y, terms[1]!.y, terms[2]!.y, terms[3]!.y, terms[4]?.y) / h,
      z: MotionTrajectoryPolynomial.slope(u, terms[0]!.z, terms[1]!.z, terms[2]!.z, terms[3]!.z, terms[4]?.z) / h,
    };
  }

  /**
   * Turn `q` by `exp(v/2)` in its body frame; null or absent blocks stay unchanged.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The quaternion is unit and the vector is in body-frame radians.
   * @evidence contracts/development/implementation.md#principled-implementation Right multiplication by the axis-angle exponential preserves the body-frame convention used by both steppers.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Handle absent or zero rotation, then apply the quaternion product.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The angle remains in radians for the half-angle trigonometry, with no small-angle clamp or overflowing conversion to degrees.
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
    const half: number = angle / 2;
    const sine: number = Math.sin(half);
    return Quaternion.multiply(q, {
      x: (v.x / angle) * sine,
      y: (v.y / angle) * sine,
      z: (v.z / angle) * sine,
      w: Math.cos(half),
    });
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
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Compute the first and second cross products as scalar components, then their weighted sum.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Keeps the existing Bernoulli coefficients and body-frame signs.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work with one output record and no intermediate vector records; the two cross products' scalar arithmetic retains Vector3.cross's association.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The three components of r cross w are reused by the second cross and final sum, without constructing two temporary vector records.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains no state.
   */
  export function dexpinv(
    r: IAutoMovieVector3 | undefined,
    w: IAutoMovieVector3 | undefined,
  ): IAutoMovieVector3 | undefined {
    if (r === undefined || w === undefined) return w;
    const ax: number = r.y * w.z - r.z * w.y;
    const ay: number = r.z * w.x - r.x * w.z;
    const az: number = r.x * w.y - r.y * w.x;
    const bx: number = r.y * az - r.z * ay;
    const by: number = r.z * ax - r.x * az;
    const bz: number = r.x * ay - r.y * ax;
    return {
      x: w.x + ax / 2 + bx / 12,
      y: w.y + ay / 2 + by / 12,
      z: w.z + az / 2 + bz / 12,
    };
  }
}
