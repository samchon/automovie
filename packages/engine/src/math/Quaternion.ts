import type {
  IAutoMovieEuler,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { QUATERNION_NLERP_DOT_THRESHOLD } from "./QUATERNION_NLERP_DOT_THRESHOLD";
import { quaternionNormalizationDivisor as normalizationDivisor } from "./internal/quaternionNormalizationDivisor";
import { readNormalizedQuaternion } from "./internal/readNormalizedQuaternion";
import { readQuaternionAngle } from "./internal/readQuaternionAngle";
import { readRotatedVector } from "./internal/readRotatedVector";

/**
 * Pure quaternion math over {@link IAutoMovieQuaternion}, components `(x, y, z,
 * w)` in glTF order.
 *
 * Quaternions are the engine's internal rotation representation: the model
 * writes joint angles in degrees, `jointToQuaternion` turns them into
 * quaternions, and the renderer consumes those. Unless a function says
 * otherwise, a rotation argument must be a unit quaternion. Every function
 * leaves its inputs unchanged and returns a new value.
 */
export namespace Quaternion {
  /** A new quaternion of the identity rotation, `(0, 0, 0, 1)`. */
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

  /** Private unchanged axes share their prepared direction and length. */
  const eulerX: (angle: number) => IAutoMovieQuaternion = prepareAxisAngle(
    EULER_AXES.X!,
  );
  const eulerY: (angle: number) => IAutoMovieQuaternion = prepareAxisAngle(
    EULER_AXES.Y!,
  );
  const eulerZ: (angle: number) => IAutoMovieQuaternion = prepareAxisAngle(
    EULER_AXES.Z!,
  );

  /**
   * The Hamilton product `a * b`, the rotation that applies `b` first and then
   * `a`.
   *
   * @param a Outer (later) rotation.
   * @param b Inner (earlier) rotation.
   * @returns A new quaternion; its length is the product of the two lengths, so
   *   unit inputs give a unit result up to rounding.
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
   * squaring, preserving direction even when the original norm is
   * unrepresentable. Ordinary near-unit inputs keep the direct summed-square
   * arithmetic. A non-finite component makes the result non-finite.
   *
   * @param q Quaternion of any finite length.
   * @returns A new unit quaternion representing the same rotation.
   */
  export const normalize: (q: IAutoMovieQuaternion) => IAutoMovieQuaternion = (
    q: IAutoMovieQuaternion,
  ): IAutoMovieQuaternion =>
    readNormalizedQuaternion(q, normalizedRecord, undefined);

  /** Fresh public normalization output from the completed scalar computation. */
  function normalizedRecord(
    x: number,
    y: number,
    z: number,
    w: number,
  ): IAutoMovieQuaternion {
    return { x, y, z, w };
  }

  /**
   * The inverse rotation of `q`, its conjugate normalized.
   *
   * For a unit quaternion this is the exact inverse, so multiply(q,inverse(q))
   * is identity; for a near-unit one normalization keeps a valid rotation.
   * Camera projection, frustum tests, IK and seat solving use it to bring world
   * vectors into a local frame.
   *
   * @param q Rotation to invert.
   * @returns A new unit quaternion.
   */
  export const inverse: (q: IAutoMovieQuaternion) => IAutoMovieQuaternion = (
    q: IAutoMovieQuaternion,
  ): IAutoMovieQuaternion =>
    readNormalizedQuaternion.fromScalars(
      -q.x,
      -q.y,
      -q.z,
      q.w,
      normalizedRecord,
      undefined,
    );

  /**
   * The rotation of `angleDeg` degrees about `axis`, positive by the right-hand
   * rule.
   *
   * @param axis Rotation axis of any nonzero length; a zero axis returns
   *   identity.
   * @param angleDeg Angle in degrees.
   * @returns A new unit quaternion.
   */
  export const fromAxisAngle: (
    axis: IAutoMovieVector3,
    angleDeg: number,
  ) => IAutoMovieQuaternion = (
    axis: IAutoMovieVector3,
    angleDeg: number,
  ): IAutoMovieQuaternion => {
    return axisAngle(axis, angleDeg);
  };

  /**
   * Build fresh axis-angle rotations from a fixed snapshot of the supplied
   * axis. Preparation scales the direction and reads its length once. Each
   * angle uses the direct formula without reading the original axis.
   *
   * @param axis Fixed direction, with the direct entry's zero/nonfinite
   *   semantics.
   * @returns A reader producing a fresh quaternion for every angle.
   */
  export function prepareAxisAngle(
    axis: IAutoMovieVector3,
  ): (angleDeg: number) => IAutoMovieQuaternion {
    const x: number = axis.x;
    const y: number = axis.y;
    const z: number = axis.z;
    const divisor: number = normalizationDivisor(x, y, z);
    const direction: IAutoMovieVector3 = {
      x: x / divisor,
      y: y / divisor,
      z: z / divisor,
    };
    const length: number = axisLength(direction);
    return (angleDeg: number): IAutoMovieQuaternion =>
      angleOnAxis(direction, length, angleDeg);
  }

  /** Scale before squaring so finite extreme coordinates retain their direction. */
  function axisAngle(
    axis: IAutoMovieVector3,
    angleDeg: number,
  ): IAutoMovieQuaternion {
    const divisor: number = normalizationDivisor(axis.x, axis.y, axis.z);
    const value: IAutoMovieVector3 =
      divisor === 1
        ? axis
        : {
            x: axis.x / divisor,
            y: axis.y / divisor,
            z: axis.z / divisor,
          };
    return angleOnAxis(value, axisLength(value), angleDeg);
  }

  /** Length of an axis already scaled to keep its squares representable. */
  function axisLength(axis: IAutoMovieVector3): number {
    return Math.sqrt(axis.x * axis.x + axis.y * axis.y + axis.z * axis.z);
  }

  /** Original half-angle formula after fixed direction/length preparation. */
  function angleOnAxis(
    value: IAutoMovieVector3,
    len: number,
    angleDeg: number,
  ): IAutoMovieQuaternion {
    if (len === 0) return identity();
    const half: number = (angleDeg * DEG2RAD) / 2;
    const s: number = Math.sin(half) / len;
    return {
      x: value.x * s,
      y: value.y * s,
      z: value.z * s,
      w: Math.cos(half),
    };
  }

  /**
   * The rotation of intrinsic Euler angles in degrees, applying the axes in
   * `euler.order`, the convention `three.js` uses, so order `"XYZ"` equals `qx
   * · qy · qz`.
   *
   * @param euler Angles in degrees and their application order.
   * @returns A new unit quaternion.
   */
  export const fromEuler: (euler: IAutoMovieEuler) => IAutoMovieQuaternion = (
    euler: IAutoMovieEuler,
  ): IAutoMovieQuaternion => {
    let result: IAutoMovieQuaternion = identity();
    for (const letter of euler.order) {
      const angle: number =
        letter === "X" ? euler.x : letter === "Y" ? euler.y : euler.z;
      const factor: IAutoMovieQuaternion =
        letter === "X"
          ? eulerX(angle)
          : letter === "Y"
            ? eulerY(angle)
            : letter === "Z"
              ? eulerZ(angle)
              : fromAxisAngle(EULER_AXES[letter]!, angle);
      result = multiply(result, factor);
    }
    return result;
  };

  /**
   * The vector `v` rotated by the unit quaternion `q`, `q · v · q⁻¹`.
   *
   * A non-unit q also scales and distorts the result, so normalize first when
   * its length is not known to be one.
   *
   * @param q Unit rotation.
   * @param v Vector to rotate.
   * @returns A new rotated vector.
   */
  export const rotateVector: (
    q: IAutoMovieQuaternion,
    v: IAutoMovieVector3,
  ) => IAutoMovieVector3 = (
    q: IAutoMovieQuaternion,
    v: IAutoMovieVector3,
  ): IAutoMovieVector3 => readRotatedVector(q, v, rotatedRecord, undefined);

  /** Fresh public vector after the original completed rotation expressions. */
  function rotatedRecord(x: number, y: number, z: number): IAutoMovieVector3 {
    return { x, y, z };
  }

  /**
   * The Y component of rotateVector(q,v). The ordinary read skips the vector
   * record and unused X/Z output expressions.
   */
  export function rotateVectorY(
    q: IAutoMovieQuaternion,
    v: IAutoMovieVector3,
  ): number {
    const tx: number = 2 * (q.y * v.z - q.z * v.y);
    const ty: number = 2 * (q.z * v.x - q.x * v.z);
    const tz: number = 2 * (q.x * v.y - q.y * v.x);
    const y: number = v.y + q.w * ty + (q.z * tx - q.x * tz);
    return Math.abs(y) < Infinity
      ? y
      : readRotatedVector(q, v, rotatedY, undefined);
  }

  /** Read only Y after recovering an overflowing rotation. */
  function rotatedY(_x: number, y: number): number {
    return y;
  }

  /**
   * Spherical linear interpolation from `a` (at `t = 0`) to `b` (at `t = 1`)
   * along the shorter arc.
   *
   * When the quaternions' dot product `cos θ` exceeds `0.9995`, so the two
   * rotations differ by less than about 3.6 degrees, it returns normalized
   * linear interpolation to avoid dividing by a vanishing `sin θ`. A `t`
   * outside `[0, 1]` extrapolates along the same arc.
   *
   * @param a Unit rotation at `t = 0`.
   * @param b Unit rotation at `t = 1`.
   * @param t Interpolation parameter.
   * @returns A new unit quaternion; both branches normalize because arccosine
   *   near the switch threshold leaves spherical weights inexact.
   */
  export const slerp: (
    a: IAutoMovieQuaternion,
    b: IAutoMovieQuaternion,
    t: number,
  ) => IAutoMovieQuaternion = (
    a: IAutoMovieQuaternion,
    b: IAutoMovieQuaternion,
    t: number,
  ): IAutoMovieQuaternion => interpolateSlerp(a, b, t);

  /**
   * Prepare repeated progress reads between snapshots of two unit rotations.
   * Preparation fixes the shorter arc and its angular weight denominator. Each
   * returned rotation depends only on progress, including extrapolation outside
   * [0, 1].
   */
  export function prepareSlerp(
    a: IAutoMovieQuaternion,
    b: IAutoMovieQuaternion,
  ): (t: number) => IAutoMovieQuaternion {
    const first: IAutoMovieQuaternion = { x: a.x, y: a.y, z: a.z, w: a.w };
    const bx: number = b.x;
    const by: number = b.y;
    const bz: number = b.z;
    const bw: number = b.w;
    const cosine: number =
      first.x * bx + first.y * by + first.z * bz + first.w * bw;
    const sign: number = cosine < 0 ? -1 : 1;
    const x: number = bx * sign;
    const y: number = by * sign;
    const z: number = bz * sign;
    const w: number = bw * sign;
    const shortestCosine: number = cosine * sign;
    if (shortestCosine > QUATERNION_NLERP_DOT_THRESHOLD)
      return (t: number): IAutoMovieQuaternion =>
        slerpLinear(first, x, y, z, w, t);
    const theta: number = Math.acos(shortestCosine);
    const sine: number = Math.sin(theta);
    return (t: number): IAutoMovieQuaternion =>
      slerpAngular(first, x, y, z, w, t, theta, sine);
  }

  /** Choose the direct arc without retaining endpoint data between calls. */
  function interpolateSlerp(
    a: IAutoMovieQuaternion,
    b: IAutoMovieQuaternion,
    t: number,
  ): IAutoMovieQuaternion {
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
    if (cos > QUATERNION_NLERP_DOT_THRESHOLD)
      return slerpLinear(a, bx, by, bz, bw, t);
    const theta: number = Math.acos(cos);
    return slerpAngular(a, bx, by, bz, bw, t, theta, Math.sin(theta));
  }

  /** Normalize the chord when the shorter arc is nearly parallel. */
  function slerpLinear(
    a: IAutoMovieQuaternion,
    bx: number,
    by: number,
    bz: number,
    bw: number,
    t: number,
  ): IAutoMovieQuaternion {
    return readNormalizedQuaternion.fromScalars(
      a.x + (bx - a.x) * t,
      a.y + (by - a.y) * t,
      a.z + (bz - a.z) * t,
      a.w + (bw - a.w) * t,
      normalizedRecord,
      undefined,
    );
  }

  /** Read spherical weights from the fixed angular span and denominator. */
  function slerpAngular(
    a: IAutoMovieQuaternion,
    bx: number,
    by: number,
    bz: number,
    bw: number,
    t: number,
    theta: number,
    sine: number,
  ): IAutoMovieQuaternion {
    const wa: number = Math.sin((1 - t) * theta) / sine;
    const wb: number = Math.sin(t * theta) / sine;
    // acos loses relative accuracy as cos approaches the switch threshold, so
    // the weights alone leave a norm error near 1e-13; normalize like nlerp.
    return readNormalizedQuaternion.fromScalars(
      a.x * wa + bx * wb,
      a.y * wa + by * wb,
      a.z * wa + bz * wb,
      a.w * wa + bw * wb,
      normalizedRecord,
      undefined,
    );
  }

  /**
   * The angle of the rotation that takes `a` to `b`, in radians within `[0,
   * π]`: the geodesic distance between the two rotations. `q` and `-q` are the
   * same rotation, so negating either argument changes nothing.
   *
   * The angle is `2 atan2(|v|, |w|)` of `inverse(a) * b`. The shorter `2 acos
   *
   * |a · b|` reads an angle from a cosine's deficit from 1, which binary64
   *
   * Resolves only to about 1.1e-16: angles below about 3e-8 radian collapse to
   * 0 or a few steps that size. The relative vector part keeps full relative
   * precision, which candidate ranking needs for mirrored inputs.
   *
   * @param a Unit rotation.
   * @param b Unit rotation.
   * @returns The angle in radians.
   */
  export const angle: (
    a: IAutoMovieQuaternion,
    b: IAutoMovieQuaternion,
  ) => number = (a: IAutoMovieQuaternion, b: IAutoMovieQuaternion): number => {
    return readQuaternionAngle(a, b);
  };

  /**
   * Read angle(normalize(a), b), in radians, without a normalized output
   * record. Both the initial normalize and inverse's conjugate normalization
   * execute exactly as in that expression; zero/nonfinite behavior remains
   * arithmetic.
   */
  export function angleAfterNormalize(
    a: IAutoMovieQuaternion,
    b: IAutoMovieQuaternion,
  ): number {
    return readQuaternionAngle.afterNormalization(a, b);
  }
}
