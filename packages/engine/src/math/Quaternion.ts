import type {
  IAutoMovieEuler,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { QUATERNION_NLERP_DOT_THRESHOLD } from "./constants/QUATERNION_NLERP_DOT_THRESHOLD";
import { quaternionNormalizationDivisor as normalizationDivisor } from "./quaternionNormalizationDivisor";
import { readNormalizedQuaternion } from "./readNormalizedQuaternion";
import { readQuaternionAngle } from "./readQuaternionAngle";
import { readRotatedVector } from "./readRotatedVector";

/**
 * Pure quaternion math over {@link IAutoMovieQuaternion}, components `(x, y, z, w)` in glTF order.
 *
 * Quaternions are the engine's internal rotation representation: the model writes joint angles in degrees, `jointToQuaternion` turns them into quaternions, and the renderer consumes those. Unless a function says otherwise, a rotation argument must be a unit quaternion. Every function leaves its inputs unchanged and returns a new value.
 */
export namespace Quaternion {
  /**
   * A new quaternion of the identity rotation, `(0, 0, 0, 1)`.
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

  /** Private unchanged axes share only their lazy direction/length preparation. */
  const eulerX: (angle: number) => IAutoMovieQuaternion = prepareAxisAngle(EULER_AXES.X!);
  const eulerY: (angle: number) => IAutoMovieQuaternion = prepareAxisAngle(EULER_AXES.Y!);
  const eulerZ: (angle: number) => IAutoMovieQuaternion = prepareAxisAngle(EULER_AXES.Z!);

  /**
   * The Hamilton product `a * b`, the rotation that applies `b` first and
   * then `a`.
   *
   * @param a Outer (later) rotation.
   * @param b Inner (earlier) rotation.
   * @returns A new quaternion; its length is the product of the two lengths,
   *   so unit inputs give a unit result up to rounding.
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
   * Extreme finite components are rescaled by their largest magnitude before squaring, preserving direction even when the original norm is unrepresentable. Ordinary near-unit inputs keep the direct summed-square arithmetic. A non-finite component makes the result non-finite.
   *
   * @param q Quaternion of any finite length.
   * @returns A new unit quaternion representing the same rotation.
   */
  export const normalize: (q: IAutoMovieQuaternion) => IAutoMovieQuaternion = (
    q: IAutoMovieQuaternion,
  ): IAutoMovieQuaternion => readNormalizedQuaternion(q, normalizedRecord, undefined);

  /** Fresh public normalization output from the completed scalar computation. */
  function normalizedRecord(x: number, y: number, z: number, w: number): IAutoMovieQuaternion {
    return { x, y, z, w };
  }

  /**
   * The inverse rotation of `q`, its conjugate normalized.
   *
   * For a unit quaternion this is the exact inverse, so multiply(q,inverse(q)) is identity; for a near-unit one normalization keeps a valid rotation. Camera projection, frustum tests, IK and seat solving use it to bring world vectors into a local frame.
   *
   * @param q Rotation to invert.
   * @returns A new unit quaternion.
   */
  export const inverse: (q: IAutoMovieQuaternion) => IAutoMovieQuaternion = (
    q: IAutoMovieQuaternion,
  ): IAutoMovieQuaternion => readNormalizedQuaternion.fromScalars(
    -q.x, -q.y, -q.z, q.w, normalizedRecord, undefined,
  );

  /**
   * The rotation of `angleDeg` degrees about `axis`, positive by the
   * right-hand rule.
   *
   * @param axis Rotation axis of any nonzero length; a zero axis returns identity.
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
   * Build fresh axis-angle rotations on one unchanged borrowed axis. Construction reads no component. First actual use prepares the original scaled direction and length; later angles keep exactly (angleDeg*DEG2RAD)/2, sin(half)/len, component multiplication and cosine. Keep the axis unchanged from first use until releasing the closure.
   *
   * @param axis Fixed direction, with the direct entry's zero/nonfinite semantics.
   * @returns A lazy reader producing a fresh quaternion for every angle.
   */
  export function prepareAxisAngle(
    axis: IAutoMovieVector3,
  ): (angleDeg: number) => IAutoMovieQuaternion {
    const state: IAxisAngleState = {};
    return (angleDeg: number): IAutoMovieQuaternion => {
      const known: IAxisAngleState["reading"] = state.reading;
      return known === undefined
        ? axisAngle(axis, angleDeg, state)
        : angleOnAxis(known.value, known.length, angleDeg);
    };
  }

  /** One reader's lazy fixed-axis preparation, never a completed rotation. */
  interface IAxisAngleState {
    /** Original scaled direction and its length, populated on first use only. */
    reading?: { value: IAutoMovieVector3; length: number };
  }

  /** Preserve the direct formula, optionally borrowing unchanged axis scalars. */
  function axisAngle(
    axis: IAutoMovieVector3,
    angleDeg: number,
    state?: IAxisAngleState,
  ): IAutoMovieQuaternion {
    const known: IAxisAngleState["reading"] = state?.reading;
    const divisor: number = known === undefined
      ? normalizationDivisor(axis.x, axis.y, axis.z) : 1;
    const value: IAutoMovieVector3 =
      known?.value ?? (divisor === 1
        ? axis
        : {
            x: axis.x / divisor,
            y: axis.y / divisor,
            z: axis.z / divisor,
          });
    const len: number = known?.length ?? Math.sqrt(
      value.x * value.x + value.y * value.y + value.z * value.z,
    );
    if (state !== undefined && known === undefined)
      state.reading = { value, length: len };
    return angleOnAxis(value, len, angleDeg);
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
   * The rotation of intrinsic Euler angles in degrees, applying the axes in `euler.order`, the convention `three.js` uses, so order `"XYZ"` equals `qx · qy · qz`.
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
      const factor: IAutoMovieQuaternion = letter === "X" ? eulerX(angle)
        : letter === "Y" ? eulerY(angle) : letter === "Z" ? eulerZ(angle)
          : fromAxisAngle(EULER_AXES[letter]!, angle);
      result = multiply(result, factor);
    }
    return result;
  };

  /**
   * The vector `v` rotated by the unit quaternion `q`, `q · v · q⁻¹`.
   *
   * A non-unit q also scales and distorts the result, so normalize first when its length is not known to be one.
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
   * The exact Y component of rotateVector(q,v), without its vector record or
   * unused X/Z output expressions. The same unit-quaternion premise applies;
   * no normalization is added and nonunit distortion/nonfinite arithmetic stay.
   */
  export function rotateVectorY(q: IAutoMovieQuaternion, v: IAutoMovieVector3): number {
    const tx: number = 2 * (q.y * v.z - q.z * v.y);
    const ty: number = 2 * (q.z * v.x - q.x * v.z);
    const tz: number = 2 * (q.x * v.y - q.y * v.x);
    return v.y + q.w * ty + (q.z * tx - q.x * tz);
  }

  /**
   * Spherical linear interpolation from `a` (at `t = 0`) to `b` (at `t = 1`) along the shorter arc.
   *
   * When the quaternions' dot product `cos θ` exceeds `0.9995`, so the two rotations differ by less than about 3.6 degrees, it returns normalized linear interpolation to avoid dividing by a vanishing `sin θ`. A `t` outside `[0, 1]` extrapolates along the same arc.
   *
   * @param a Unit rotation at `t = 0`.
   * @param b Unit rotation at `t = 1`.
   * @param t Interpolation parameter.
   * @returns A new unit quaternion; both branches normalize because arccosine near the switch threshold leaves spherical weights inexact.
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
   * Prepare repeated progress reads between two unchanged borrowed unit rotations. Construction reads no endpoint. First use prepares the original dot, shorter-arc endpoint components and spherical theta/sine. Every progress retains its original weights and normalization; progress outside [0,1] extrapolates. Release the reader with its fixed pair.
   */
  export function prepareSlerp(
    a: IAutoMovieQuaternion,
    b: IAutoMovieQuaternion,
  ): (t: number) => IAutoMovieQuaternion {
    const state: ISlerpState = {};
    return (t: number): IAutoMovieQuaternion => interpolateSlerp(a, b, t, state);
  }

  /** Fixed arc scalars, including the already sign-adjusted second endpoint. */
  interface ISlerpArc {
    /** Original sign-adjusted endpoint dot, before the interpolation branch. */
    cosine: number;

    /** Second endpoint X after the original shorter-arc sign. */
    bx: number;

    /** Second endpoint Y after the same sign choice. */
    by: number;

    /** Second endpoint Z after the same sign choice. */
    bz: number;

    /** Second endpoint W after the same sign choice. */
    bw: number;

    /** Original spherical angle and its sine; absent on the linear branch. */
    theta?: number;

    /** Sine of that angle, used as the unchanged weight denominator. */
    sine?: number;
  }

  /** One unchanged endpoint pair's lazy metadata, never an interpolated result. */
  interface ISlerpState {
    /** Prepared at the first actual interpolation read. */
    arc?: ISlerpArc;
  }

  /** Direct and fixed-pair interpolation under the original arithmetic policy. */
  function interpolateSlerp(
    a: IAutoMovieQuaternion, b: IAutoMovieQuaternion, t: number,
    state?: ISlerpState,
  ): IAutoMovieQuaternion {
    const known: ISlerpArc | undefined = state?.arc;
    let cos: number = known?.cosine ?? a.x * b.x + a.y * b.y + a.z * b.z + a.w * b.w;
    let bx: number = known?.bx ?? b.x;
    let by: number = known?.by ?? b.y;
    let bz: number = known?.bz ?? b.z;
    let bw: number = known?.bw ?? b.w;
    if (known === undefined && cos < 0) {
      // Take the shorter arc.
      cos = -cos;
      bx = -bx;
      by = -by;
      bz = -bz;
      bw = -bw;
    }
    if (known === undefined && state !== undefined)
      state.arc = { cosine: cos, bx, by, bz, bw };
    if (cos > QUATERNION_NLERP_DOT_THRESHOLD) {
      // Nearly parallel: normalized linear interpolation.
      return readNormalizedQuaternion.fromScalars(
        a.x + (bx - a.x) * t,
        a.y + (by - a.y) * t,
        a.z + (bz - a.z) * t,
        a.w + (bw - a.w) * t,
        normalizedRecord, undefined,
      );
    }
    const theta: number = known?.theta ?? Math.acos(cos);
    const sin: number = known?.sine ?? Math.sin(theta);
    if (known === undefined && state !== undefined) {
      state.arc!.theta = theta;
      state.arc!.sine = sin;
    }
    const wa: number = Math.sin((1 - t) * theta) / sin;
    const wb: number = Math.sin(t * theta) / sin;
    // acos loses relative accuracy as cos approaches the switch threshold, so
    // the weights alone leave a norm error near 1e-13; normalize like nlerp.
    return readNormalizedQuaternion.fromScalars(
      a.x * wa + bx * wb,
      a.y * wa + by * wb,
      a.z * wa + bz * wb,
      a.w * wa + bw * wb,
      normalizedRecord, undefined,
    );
  }

  /**
   * The angle of the rotation that takes `a` to `b`, in radians within `[0, π]`: the geodesic distance between the two rotations. `q` and `-q` are the same rotation, so negating either argument changes nothing.
   *
   * The angle is `2 atan2(|v|, |w|)` of `inverse(a) * b`. The shorter `2 acos |a · b|` reads an angle from a cosine's deficit from 1, which binary64 resolves only to about 1.1e-16: angles below about 3e-8 radian collapse to 0 or a few steps that size. The relative vector part keeps full relative precision, which candidate ranking needs for mirrored inputs.
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
   * Read angle(normalize(a), b), in radians, without a normalized output record.
   * Both the initial normalize and inverse's conjugate normalization execute
   * exactly as in that expression; zero/nonfinite behavior remains arithmetic.
   */
  export function angleAfterNormalize(
    a: IAutoMovieQuaternion,
    b: IAutoMovieQuaternion,
  ): number {
    return readQuaternionAngle.afterNormalization(a, b);
  }
}
