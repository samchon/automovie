import {
  IAutoMovieEuler,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { QUATERNION_NLERP_DOT_THRESHOLD } from "./constants/QUATERNION_NLERP_DOT_THRESHOLD";

/**
 * Pure quaternion math over {@link IAutoMovieQuaternion}, components `(x, y, z,
 * w)` in glTF order.
 *
 * Quaternions are the engine's internal rotation representation: the model
 * writes joint angles in degrees, `jointToQuaternion` turns them into
 * quaternions, and the renderer consumes those. Unless a function says
 * otherwise, a rotation argument must be a unit quaternion. Every function
 * leaves its inputs unchanged and returns a new value.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the component order, where quaternions come from and go, the unit-length premise for rotation arguments, and that every function returns a new value.
 * @evidence contracts/development/design.md#principled-representation Represents Pure quaternion math over , components `(x, y, z, w)` in glTF order: companion namespace of 12 members (`identity`, `DEG2RAD`, `EULER_AXES`, `multiply`, `normalize`, `inverse`, ...); units and frames named in its text: quaternion, radians, degree, world, local. It has no optional member, so no absent-value state combines with another.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `Quaternion` in packages/engine/src/math/Quaternion.ts; its surface is the 12 members listed and the text shows 335 other files naming it, mostly packages/engine (134), test (78), movies (62), so no member is declared for a presumed future need.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.
 */
export namespace Quaternion {
  /**
   * A new quaternion of the identity rotation, `(0, 0, 0, 1)`.
   *
   * @evidence contracts/development/implementation.md#principled-implementation The multiplicative identity of the Hamilton product, zero vector part and unit scalar part, which rotates no vector.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure A function rather than a shared constant, because callers build on the result and must never alias one global record.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Returns the same exact value for every call with no cached or caller-specific record.
   * @evidence contracts/development/common.md#meaningful-documentation States the component values and that each call returns a new record, which a caller that mutates the result needs.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Four literal components construct the neutral Hamilton rotation in constant time.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A fresh record is the contract, so sharing one would be wrong rather than cheaper.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Each neutral rotation owns its four components, so caller mutation cannot alter another identity result.
   */
  export const identity: () => IAutoMovieQuaternion =
    (): IAutoMovieQuaternion => ({
      x: 0,
      y: 0,
      z: 0,
      w: 1,
    });

  /** Radians per degree, `π / 180`. */
  export const DEG2RAD: number = Math.PI / 180;

  /** The canonical axes `fromEuler` turns about, keyed by order letter. */
  const EULER_AXES: Readonly<Record<string, IAutoMovieVector3>> = {
    X: { x: 1, y: 0, z: 0 },
    Y: { x: 0, y: 1, z: 0 },
    Z: { x: 0, y: 0, z: 1 },
  };

  /**
   * The Hamilton product `a * b`, the rotation that applies `b` first and
   * then `a`.
   *
   * @param a Outer (later) rotation.
   * @param b Inner (earlier) rotation.
   * @returns A new quaternion; its length is the product of the two lengths,
   *   so unit inputs give a unit result up to rounding.
   *
   * @evidence contracts/development/implementation.md#principled-implementation The Hamilton product formula, `w = aw·bw − a·b` and `v = aw·bv + bw·av + av × bv`, written out per component; composing rotations by it applies the right operand first.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One product for every rotation composition, joints, drivers, cameras and placements, without a normalizing variant, because unit inputs already give a unit result.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The result is not renormalized, so rounding drift stays visible to the callers that normalize at their own boundary rather than being hidden on every product.
   * @evidence contracts/development/common.md#meaningful-documentation States the application order of the operands and how the result's length follows from the inputs'.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Sixteen multiplications and twelve additions in constant time, with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of two quaternions that coordinates no work across calls.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The Hamilton product owns four computed components and keeps no references to either operand quaternion.
   */
  export const multiply: (
    a: IAutoMovieQuaternion,
    b: IAutoMovieQuaternion,
  ) => IAutoMovieQuaternion = (
    a: IAutoMovieQuaternion,
    b: IAutoMovieQuaternion,
  ): IAutoMovieQuaternion => ({
    x: a.w * b.x + a.x * b.w + a.y * b.z - a.z * b.y,
    y: a.w * b.y - a.x * b.z + a.y * b.w + a.z * b.x,
    z: a.w * b.z + a.x * b.y - a.y * b.x + a.z * b.w,
    w: a.w * b.w - a.x * b.x - a.y * b.y - a.z * b.z,
  });

  /**
   * A unit-length copy of `q`, or the identity when `q` has length zero.
   *
   * Extreme finite components are rescaled by their largest magnitude before
   * squaring, preserving direction even when the original norm is unrepresentable.
   * Ordinary near-unit inputs keep the direct summed-square arithmetic.
   * A non-finite component makes the result non-finite.
   *
   * @param q Quaternion of any finite length.
   * @returns A new unit quaternion representing the same rotation.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Positive uniform rescaling leaves quaternion direction unchanged, so dividing extreme finite components by their largest magnitude before the Euclidean norm prevents underflow and overflow; zero is the only finite input without a recoverable direction.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure A private normalizationDivisor shares binary64 magnitude bounds with axis-angle construction, while ordinary near-unit quaternions retain their existing multiplication order.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The identity for a zero quaternion is the stated degenerate value, not a fallback for bad arithmetic; a non-finite input still yields a non-finite result instead of being replaced.
   * @evidence contracts/development/common.md#meaningful-documentation States zero identity, finite extreme-component rescaling, preserved ordinary arithmetic and nonfinite propagation.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Four magnitude comparisons and one fixed-size norm take constant time, with four extra divisions only for extreme inputs.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The largest magnitude supplies one common rescaling for all four components; normalization retains no rotation history between calls.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources An extreme input adds one temporary scaled quaternion; the returned unit record belongs to the caller and no input is retained.
   */
  export const normalize: (q: IAutoMovieQuaternion) => IAutoMovieQuaternion = (
    q: IAutoMovieQuaternion,
  ): IAutoMovieQuaternion => {
    const divisor: number = normalizationDivisor(q.x, q.y, q.z, q.w);
    const value: IAutoMovieQuaternion =
      divisor === 1
        ? q
        : {
            x: q.x / divisor,
            y: q.y / divisor,
            z: q.z / divisor,
            w: q.w / divisor,
          };
    const len: number = Math.sqrt(
      value.x * value.x +
        value.y * value.y +
        value.z * value.z +
        value.w * value.w,
    );
    if (len === 0) return identity();
    const inv: number = 1 / len;
    return {
      x: value.x * inv,
      y: value.y * inv,
      z: value.z * inv,
      w: value.w * inv,
    };
  };

  /**
   * The inverse rotation of `q`, its conjugate normalized.
   *
   * For a unit quaternion this is the exact inverse, so `multiply(q,
   * inverse(q))` is the identity; for a near-unit one the normalization keeps
   * the result a valid rotation. Camera projection, frustum tests, IK and seat
   * solving use it to bring world vectors into a local frame.
   *
   * @param q Rotation to invert.
   * @returns A new unit quaternion.
   *
   * @evidence contracts/development/implementation.md#principled-implementation The conjugate `(−x, −y, −z, w)` is the inverse of a unit quaternion, and dividing by the length makes it the inverse of the rotation a near-unit quaternion represents.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Composes `normalize` with the conjugate instead of dividing by the squared length, so the result is unit length and the zero quaternion takes `normalize`'s identity.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Normalizes every input the same way, so no caller depends on whether its quaternion was exactly unit.
   * @evidence contracts/development/common.md#meaningful-documentation States the exact-inverse property for unit input, the normalization for near-unit input, and the callers that use it.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A sign flip and one normalization in constant time, with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of one quaternion that coordinates no work across calls.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Allocates the conjugate and the returned record and retains nothing.
   */
  export const inverse: (q: IAutoMovieQuaternion) => IAutoMovieQuaternion = (
    q: IAutoMovieQuaternion,
  ): IAutoMovieQuaternion => normalize({ x: -q.x, y: -q.y, z: -q.z, w: q.w });

  /**
   * The rotation of `angleDeg` degrees about `axis`, positive by the
   * right-hand rule.
   *
   * @param axis Rotation axis of any nonzero length; a zero axis returns the
   *   identity.
   * @param angleDeg Angle in degrees.
   * @returns A new unit quaternion.
   *
   * @evidence contracts/development/implementation.md#principled-implementation The axis-angle formula uses a unit axis and half-angle sine/cosine; extreme finite axes are positively rescaled before the norm, preserving direction without overflowing or losing a nonzero subnormal axis.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Takes degrees because every authored angle in the interface is in degrees, so callers never convert, and accepts an unnormalized axis because cross products and authored directions arrive unnormalized.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The zero-axis identity is the one input with no defined axis, not a fallback for a failed computation; any other axis takes the same formula.
   * @evidence contracts/development/common.md#meaningful-documentation States the angle unit, the rotation sense, that the axis needs no normalization, and the zero-axis result.
   * @evidence contracts/development/implementation.md#efficient-algorithms A fixed-size magnitude check precedes one square root, sine and cosine; only extreme finite axes require three rescaling divisions.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of an axis and an angle that coordinates no work across calls.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources An extreme axis creates one temporary scaled direction, while the output owns four rotation components and keeps no axis reference.
   */
  export const fromAxisAngle: (
    axis: IAutoMovieVector3,
    angleDeg: number,
  ) => IAutoMovieQuaternion = (
    axis: IAutoMovieVector3,
    angleDeg: number,
  ): IAutoMovieQuaternion => {
    const divisor: number = normalizationDivisor(axis.x, axis.y, axis.z);
    const value: IAutoMovieVector3 =
      divisor === 1
        ? axis
        : {
            x: axis.x / divisor,
            y: axis.y / divisor,
            z: axis.z / divisor,
          };
    const len: number = Math.sqrt(
      value.x * value.x + value.y * value.y + value.z * value.z,
    );
    if (len === 0) return identity();
    const half: number = (angleDeg * DEG2RAD) / 2;
    const s: number = Math.sin(half) / len;
    return {
      x: value.x * s,
      y: value.y * s,
      z: value.z * s,
      w: Math.cos(half),
    };
  };

  /** Scale only when up to four squared components may leave the normal binary64 range. */
  const normalizationDivisor: (
    x: number,
    y: number,
    z: number,
    w?: number,
  ) => number = (x: number, y: number, z: number, w: number = 0): number => {
    const largest: number = Math.max(
      Math.abs(x),
      Math.abs(y),
      Math.abs(z),
      Math.abs(w),
    );
    return Number.isFinite(largest) &&
      largest > 0 &&
      (largest < 2 ** -511 || largest > 2 ** 510)
      ? largest
      : 1;
  };

  /**
   * The rotation of intrinsic Euler angles in degrees, applying the axes in
   * `euler.order`, the convention `three.js` uses, so order `"XYZ"` equals
   * `qx · qy · qz`.
   *
   * @param euler Angles in degrees and their application order.
   * @returns A new unit quaternion.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Intrinsic Euler composition is the product of single-axis rotations in the stated letter order, each from `fromAxisAngle`, so `"XYZ"` is `qx · qy · qz` and every one of the six orders of `IAutoMovieEuler` follows the same rule.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One loop over the order letters with a fixed axis table, used by the instance-set placement paths for their per-slot rotation offsets, instead of six hand-written products.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Angles are neither wrapped nor normalized and no order is special-cased; the product starts from the identity so every order takes the same arithmetic.
   * @evidence contracts/development/common.md#meaningful-documentation States the angle unit, that the rotation is intrinsic, the order convention and its equivalence to the `three.js` product, with an example.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Three axis-angle conversions and three products in constant time, with no intermediate array.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of one Euler record that coordinates no work across calls.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Allocates the factors and the returned record and retains nothing.
   */
  export const fromEuler: (euler: IAutoMovieEuler) => IAutoMovieQuaternion = (
    euler: IAutoMovieEuler,
  ): IAutoMovieQuaternion => {
    let result: IAutoMovieQuaternion = identity();
    for (const letter of euler.order) {
      const angle: number =
        letter === "X" ? euler.x : letter === "Y" ? euler.y : euler.z;
      result = multiply(result, fromAxisAngle(EULER_AXES[letter]!, angle));
    }
    return result;
  };

  /**
   * The vector `v` rotated by the unit quaternion `q`, `q · v · q⁻¹`.
   *
   * A non-unit `q` also scales and distorts the result, so normalize first
   * when the length is not known to be one.
   *
   * @param q Unit rotation.
   * @param v Vector to rotate.
   * @returns A new rotated vector.
   *
   * @evidence contracts/development/implementation.md#principled-implementation The expansion `v' = v + w·t + q⃗ × t` with `t = 2·(q⃗ × v)`, algebraically equal to `q · v · q*` for a unit quaternion, where the conjugate is the inverse.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Rotates directly from the quaternion instead of building a rotation matrix, since callers rotate one vector at a time.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The quaternion is not normalized here, so a caller passing a non-unit rotation gets the stated distortion instead of a hidden correction.
   * @evidence contracts/development/common.md#meaningful-documentation States the operation, the unit-length premise and what happens without it.
   * @evidence contracts/development/implementation.md#efficient-algorithms Two cross products and eighteen multiplications in constant time, fewer operations than forming the full product `q · v · q*` or a 3×3 matrix for one vector.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of one rotation and one vector that coordinates no work across calls.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Allocates only the returned vector and retains nothing.
   */
  export const rotateVector: (
    q: IAutoMovieQuaternion,
    v: IAutoMovieVector3,
  ) => IAutoMovieVector3 = (
    q: IAutoMovieQuaternion,
    v: IAutoMovieVector3,
  ): IAutoMovieVector3 => {
    const tx: number = 2 * (q.y * v.z - q.z * v.y);
    const ty: number = 2 * (q.z * v.x - q.x * v.z);
    const tz: number = 2 * (q.x * v.y - q.y * v.x);
    return {
      x: v.x + q.w * tx + (q.y * tz - q.z * ty),
      y: v.y + q.w * ty + (q.z * tx - q.x * tz),
      z: v.z + q.w * tz + (q.x * ty - q.y * tx),
    };
  };

  /**
   * Spherical linear interpolation from `a` (at `t = 0`) to `b` (at `t = 1`)
   * along the shorter arc.
   *
   * When the quaternions' dot product `cos θ` exceeds `0.9995`, so the two
   * rotations differ by less than about 3.6 degrees, it returns the normalized
   * linear interpolation instead, which is nearly identical there and avoids
   * dividing by a vanishing `sin θ`. A `t` outside `[0, 1]` extrapolates along
   * the same arc.
   *
   * @param a Unit rotation at `t = 0`.
   * @param b Unit rotation at `t = 1`.
   * @param t Interpolation parameter.
   * @returns A new unit quaternion; both branches normalize, because the
   *   arccosine near the switch threshold leaves the spherical weights
   *   inexact.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Shoemake's slerp, `sin((1 − t)θ)/sin θ · a + sin(tθ)/sin θ · b` with `θ` the angle between the operands, after negating `b` when `a · b < 0` so the path takes the shorter of the two arcs that represent the same rotation pair.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One function with the near-parallel branch inside, because every caller, clip and motion sampling, driver blending and iterative IK, needs the same guarded interpolation.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The `0.9995` threshold, shared through QUATERNION_NLERP_DOT_THRESHOLD with component-extrema admission, is the documented numerical switch for a vanishing `sin θ`, the same for every caller, not tuned to any clip or fixture.
   * @evidence contracts/development/common.md#meaningful-documentation States the endpoints, the shorter-arc choice, the near-parallel threshold with its angle and why it exists, extrapolation outside `[0, 1]`, and when the result is unit length.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms One dot product, one arccosine and three sines in constant time, with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of two rotations and a parameter that coordinates no work across calls.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Each branch creates one temporary weighted quaternion and returns its normalized copy, without retaining either endpoint.
   */
  export const slerp: (
    a: IAutoMovieQuaternion,
    b: IAutoMovieQuaternion,
    t: number,
  ) => IAutoMovieQuaternion = (
    a: IAutoMovieQuaternion,
    b: IAutoMovieQuaternion,
    t: number,
  ): IAutoMovieQuaternion => {
    let cos: number = a.x * b.x + a.y * b.y + a.z * b.z + a.w * b.w;
    let bx: number = b.x;
    let by: number = b.y;
    let bz: number = b.z;
    let bw: number = b.w;
    if (cos < 0) {
      // Take the shorter arc.
      cos = -cos;
      bx = -bx;
      by = -by;
      bz = -bz;
      bw = -bw;
    }
    if (cos > QUATERNION_NLERP_DOT_THRESHOLD) {
      // Nearly parallel: normalized linear interpolation.
      return normalize({
        x: a.x + (bx - a.x) * t,
        y: a.y + (by - a.y) * t,
        z: a.z + (bz - a.z) * t,
        w: a.w + (bw - a.w) * t,
      });
    }
    const theta: number = Math.acos(cos);
    const sin: number = Math.sin(theta);
    const wa: number = Math.sin((1 - t) * theta) / sin;
    const wb: number = Math.sin(t * theta) / sin;
    // acos loses relative accuracy as cos approaches the switch threshold, so
    // the weights alone leave a norm error near 1e-13; normalize like nlerp.
    return normalize({
      x: a.x * wa + bx * wb,
      y: a.y * wa + by * wb,
      z: a.z * wa + bz * wb,
      w: a.w * wa + bw * wb,
    });
  };

  /**
   * The angle of the rotation that takes `a` to `b`, in radians within
   * `[0, π]`: the geodesic distance between the two rotations. `q` and `-q`
   * are the same rotation, so negating either argument changes nothing.
   *
   * The angle is `2 atan2(|v|, |w|)` of the relative quaternion
   * `inverse(a) * b`, with `v` its vector part and `w` its scalar part. The
   * shorter formula `2 acos |a · b|` reads a small angle from how far a
   * cosine falls short of 1, which binary64 resolves only to about 1.1e-16,
   * so it returns every angle below about 3e-8 radian as 0 or as one of a few
   * steps that size; the vector part keeps full relative precision there. A
   * search that ranks candidates by this angle needs that precision to settle
   * on the same candidate for mirrored inputs.
   *
   * @param a Unit rotation.
   * @param b Unit rotation.
   * @returns The angle in radians.
   *
   * @evidence contracts/development/implementation.md#principled-implementation The relative rotation of two unit quaternions is `inverse(a) * b`, whose vector part has length `sin(θ/2)` and whose scalar part is `cos(θ/2)`; reading the half angle from both through atan2 is accurate at every angle, where arccosine of the dot product loses all digits of an angle below the square root of the unit roundoff.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One owner for the distance between rotations that the chain fit's reference term, its effector error and its continuity order all read, composed from this namespace's own `inverse` and `multiply`.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No clamp of a dot product and no threshold: the absolute scalar part is the stated identification of `q` with `-q`, and the result is exact to rounding for every pair.
   * @evidence contracts/development/common.md#meaningful-documentation States the unit, the range, the sign insensitivity, the formula and why the shorter arccosine form is not used, and the unit-length premise of both arguments.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms One Hamilton product, one hypotenuse and one arctangent in constant time, with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of two rotations that coordinates no work across calls.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Creates two temporary quaternions and returns a number; nothing is retained.
   */
  export const angle: (
    a: IAutoMovieQuaternion,
    b: IAutoMovieQuaternion,
  ) => number = (a: IAutoMovieQuaternion, b: IAutoMovieQuaternion): number => {
    const relative: IAutoMovieQuaternion = multiply(inverse(a), b);
    return (
      2 *
      Math.atan2(
        Math.hypot(relative.x, relative.y, relative.z),
        Math.abs(relative.w),
      )
    );
  };
}
