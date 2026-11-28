import type {
  IAutoMovieEuler,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieEngineQuaternionNlerpDotThreshold } from "./AutoMovieEngineQuaternionNlerpDotThreshold";
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
export namespace AutoMovieEngineQuaternion {
  /**
   * Create a quaternion for the identity rotation, with zero vector part and
   * scalar part one.
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

  /**
   * Return the Hamilton product of two quaternions.
   *
   * For rotations, the right operand acts first. Unit inputs produce a unit
   * rotation to rounding, and the result is fresh.
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
   * Return a unit copy of a quaternion. An all-zero input yields identity.
   *
   * Extreme finite magnitudes are scaled before taking the norm. Nonfinite
   * components can propagate.
   */
  export const normalize: (q: IAutoMovieQuaternion) => IAutoMovieQuaternion = (
    q: IAutoMovieQuaternion,
  ): IAutoMovieQuaternion =>
    readNormalizedQuaternion(q, normalizedRecord, undefined);
  /**
   * Return the conjugate normalized to a unit quaternion.
   *
   * This is the reverse rotation for a unit input. A zero input yields
   * identity. The result is a fresh quaternion.
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
   * Build a right-handed rotation from an axis and angle in degrees.
   *
   * The axis may have any finite nonzero magnitude. A zero axis yields
   * identity. The result is a fresh quaternion.
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
   * Snapshot an axis and return a function that builds its rotation for each
   * angle in degrees.
   *
   * Later changes to the axis do not change the reader. Its zero-axis behavior
   * is identity and every sample is a fresh quaternion.
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

  /**
   * Build a quaternion from intrinsic Euler angles in degrees.
   *
   * Multiply each axis rotation in the supplied order. For XYZ this forms qX
   * times qY times qZ.
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
   * Rotate a vector by a unit quaternion and return a fresh vector.
   *
   * Normalize the quaternion first if its unit length is unknown. The direct
   * formula is retained for representable components even when a separate
   * component needs overflow recovery.
   */
  export const rotateVector: (
    q: IAutoMovieQuaternion,
    v: IAutoMovieVector3,
  ) => IAutoMovieVector3 = (
    q: IAutoMovieQuaternion,
    v: IAutoMovieVector3,
  ): IAutoMovieVector3 => readRotatedVector(q, v, rotatedRecord, undefined);

  /** Read only the Y coordinate of a vector rotated by a unit quaternion. */
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

  /**
   * Interpolate two unit rotations along their shorter arc.
   *
   * Progress outside zero through one extrapolates. Near-coincident endpoints
   * use normalized linear interpolation. Each read returns a fresh unit
   * rotation.
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
   * Snapshot two unit rotations for repeated shortest-arc interpolation.
   *
   * The reader depends on progress and the stored endpoints. Later endpoint
   * edits do not affect it. Progress can extrapolate beyond zero through one.
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
    if (shortestCosine > AutoMovieEngineQuaternionNlerpDotThreshold)
      return (t: number): IAutoMovieQuaternion =>
        slerpLinear(first, x, y, z, w, t);
    const theta: number = Math.acos(shortestCosine);
    const sine: number = Math.sin(theta);
    return (t: number): IAutoMovieQuaternion =>
      slerpAngular(first, x, y, z, w, t, theta, sine);
  }

  /**
   * Measure the shortest angle between two unit rotations in radians.
   *
   * The result is from zero through pi. Negating either quaternion leaves its
   * geometric rotation and separation unchanged.
   */
  export const angle: (
    a: IAutoMovieQuaternion,
    b: IAutoMovieQuaternion,
  ) => number = (a: IAutoMovieQuaternion, b: IAutoMovieQuaternion): number => {
    return readQuaternionAngle(a, b);
  };

  /**
   * Measure the shortest angle after independently normalizing the first
   * quaternion.
   *
   * This performs the first normalization and then the angle calculation,
   * retaining their separate rounding and zero/nonfinite behavior.
   */
  export function angleAfterNormalize(
    a: IAutoMovieQuaternion,
    b: IAutoMovieQuaternion,
  ): number {
    return readQuaternionAngle.afterNormalization(a, b);
  }

  /*
   * The canonical axes `fromEuler` turns about, keyed by order letter.
   */
  const EULER_AXES: Readonly<Record<string, IAutoMovieVector3>> = {
    X: { x: 1, y: 0, z: 0 },
    Y: { x: 0, y: 1, z: 0 },
    Z: { x: 0, y: 0, z: 1 },
  };

  /*
   * Private unchanged axes share their prepared direction and length.
   */
  const eulerX: (angle: number) => IAutoMovieQuaternion = prepareAxisAngle(
    EULER_AXES.X!,
  );

  const eulerY: (angle: number) => IAutoMovieQuaternion = prepareAxisAngle(
    EULER_AXES.Y!,
  );

  const eulerZ: (angle: number) => IAutoMovieQuaternion = prepareAxisAngle(
    EULER_AXES.Z!,
  );

  /*
   * Fresh public normalization output from the completed scalar computation.
   */
  function normalizedRecord(
    x: number,
    y: number,
    z: number,
    w: number,
  ): IAutoMovieQuaternion {
    return { x, y, z, w };
  }

  /*
   * Scale before squaring so finite extreme coordinates retain their direction.
   */
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

  /*
   * Length of an axis already scaled to keep its squares representable.
   */
  function axisLength(axis: IAutoMovieVector3): number {
    return Math.sqrt(axis.x * axis.x + axis.y * axis.y + axis.z * axis.z);
  }

  /*
   * Original half-angle formula after fixed direction/length preparation.
   */
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

  /*
   * Fresh public vector after the original completed rotation expressions.
   */
  function rotatedRecord(x: number, y: number, z: number): IAutoMovieVector3 {
    return { x, y, z };
  }

  /*
   * Read only Y after recovering an overflowing rotation.
   */
  function rotatedY(_x: number, y: number): number {
    return y;
  }

  /*
   * Choose the direct arc without retaining endpoint data between calls.
   */
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
    if (cos > AutoMovieEngineQuaternionNlerpDotThreshold)
      return slerpLinear(a, bx, by, bz, bw, t);
    const theta: number = Math.acos(cos);
    return slerpAngular(a, bx, by, bz, bw, t, theta, Math.sin(theta));
  }

  /*
   * Normalize the chord when the shorter arc is nearly parallel.
   */
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

  /*
   * Read spherical weights from the fixed angular span and denominator.
   */
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
}
