import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../../../math/Quaternion";
import { MotionTrajectoryPolynomial } from "./MotionTrajectoryPolynomial";

/*
 * Rotation-vector operations shared by trajectory construction and playback.
 */
export namespace MotionTrajectoryRotation {
  /*
   * Read a dense rotation vector from four or five polynomial coefficients.
   */
  export function curve(
    terms: readonly IAutoMovieVector3[],
    u: number,
  ): IAutoMovieVector3 {
    return {
      x: MotionTrajectoryPolynomial.value(
        u,
        terms[0]!.x,
        terms[1]!.x,
        terms[2]!.x,
        terms[3]!.x,
        terms[4]?.x,
      ),
      y: MotionTrajectoryPolynomial.value(
        u,
        terms[0]!.y,
        terms[1]!.y,
        terms[2]!.y,
        terms[3]!.y,
        terms[4]?.y,
      ),
      z: MotionTrajectoryPolynomial.value(
        u,
        terms[0]!.z,
        terms[1]!.z,
        terms[2]!.z,
        terms[3]!.z,
        terms[4]?.z,
      ),
    };
  }

  /*
   * Differentiate the same rotation-vector curve with respect to seconds.
   */
  export function curveDerivative(
    terms: readonly IAutoMovieVector3[],
    u: number,
    h: number,
  ): IAutoMovieVector3 {
    return {
      x:
        MotionTrajectoryPolynomial.slope(
          u,
          terms[0]!.x,
          terms[1]!.x,
          terms[2]!.x,
          terms[3]!.x,
          terms[4]?.x,
        ) / h,
      y:
        MotionTrajectoryPolynomial.slope(
          u,
          terms[0]!.y,
          terms[1]!.y,
          terms[2]!.y,
          terms[3]!.y,
          terms[4]?.y,
        ) / h,
      z:
        MotionTrajectoryPolynomial.slope(
          u,
          terms[0]!.z,
          terms[1]!.z,
          terms[2]!.z,
          terms[3]!.z,
          terms[4]?.z,
        ) / h,
    };
  }

  /*
   * Turn `q` by `exp(v/2)` in its body frame; null or absent blocks stay
   * unchanged.
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

  /*
   * Scale a vector, preserving an absent orientation block.
   */
  export function scaled(
    v: IAutoMovieVector3 | undefined,
    s: number,
  ): IAutoMovieVector3 | undefined {
    return v === undefined ? undefined : { x: s * v.x, y: s * v.y, z: s * v.z };
  }

  /*
   * The inverse exponential differential `w + r cross w/2 + r cross (r cross
   * w)/12`.
   *
   * For `q' = q w/2` this is the body-frame Bernoulli series through its second
   * bracket. The third Bernoulli number is zero, retaining order five as well
   * as four (Munthe-Kaas 1999, Appl Numer Math 29:115-127).
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
