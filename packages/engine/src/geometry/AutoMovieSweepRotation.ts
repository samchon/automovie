import type { IAutoMovieSweepRotation } from "@automovie/interface";

import { QUATERNION_NLERP_DOT_THRESHOLD } from "../math/QUATERNION_NLERP_DOT_THRESHOLD";
import { readBasisQuaternion } from "../math/internal/readBasisQuaternion";

/**
 * Quaternion operations on caller-owned arrays, `[x, y, z, w]` at an offset,
 * for sweeps posed every frame without allocating.
 *
 * Each operation reads its inputs fully before writing, so an output may share
 * storage with an input. They follow `Quaternion`'s conventions: the Hamilton
 * product `a b` applies `b` first, a basis maps `+X`, `+Y`, `+Z` to its three
 * columns, and slerp takes the shorter arc and switches to normalized linear
 * interpolation above the shared near-parallel threshold.
 */
export namespace AutoMovieSweepRotation {
  /** Write the product `a b`. */
  export const multiply = (
    a: ArrayLike<number>,
    ai: number,
    b: ArrayLike<number>,
    bi: number,
    out: IAutoMovieSweepRotation.IMultiplyOut,
    oi: number,
  ): void => {
    const ax: number = a[ai]!;
    const ay: number = a[ai + 1]!;
    const az: number = a[ai + 2]!;
    const aw: number = a[ai + 3]!;
    const bx: number = b[bi]!;
    const by: number = b[bi + 1]!;
    const bz: number = b[bi + 2]!;
    const bw: number = b[bi + 3]!;
    out[oi] = aw * bx + ax * bw + ay * bz - az * by;
    out[oi + 1] = aw * by - ax * bz + ay * bw + az * bx;
    out[oi + 2] = aw * bz + ax * by - ay * bx + az * bw;
    out[oi + 3] = aw * bw - ax * bx - ay * by - az * bz;
  };

  /**
   * Scale a quaternion to unit length in place; a zero quaternion becomes the
   * identity.
   */
  export const normalize = (
    q: IAutoMovieSweepRotation.INormalizeQ,
    i: number,
  ): void => {
    const size: number = Math.hypot(q[i]!, q[i + 1]!, q[i + 2]!, q[i + 3]!);
    if (size === 0) {
      q[i] = 0;
      q[i + 1] = 0;
      q[i + 2] = 0;
      q[i + 3] = 1;
      return;
    }
    for (let k: number = 0; k < 4; ++k) q[i + k] = q[i + k]! / size;
  };

  /** Write the inverse of a unit quaternion, its conjugate. */
  export const conjugate = (
    q: ArrayLike<number>,
    i: number,
    out: IAutoMovieSweepRotation.IConjugateOut,
    oi: number,
  ): void => {
    const x: number = q[i]!;
    const y: number = q[i + 1]!;
    const z: number = q[i + 2]!;
    out[oi + 3] = q[i + 3]!;
    out[oi] = -x;
    out[oi + 1] = -y;
    out[oi + 2] = -z;
  };

  /**
   * Write the unit quaternion of the rotation taking `+X`, `+Y`, `+Z` to three
   * finite, right-handed orthonormal columns stored at `xi`, `yi` and `zi`. The
   * caller admits the basis and supplies valid array offsets. The output
   * receives `[x, y, z, w]` at `oi` and may overlap the input columns.
   */
  export const fromBasis = (
    m: ArrayLike<number>,
    xi: number,
    yi: number,
    zi: number,
    out: IAutoMovieSweepRotation.IFromBasisOut,
    oi: number,
  ): void => {
    readBasisQuaternion(
      m[xi]!,
      m[xi + 1]!,
      m[xi + 2]!,
      m[yi]!,
      m[yi + 1]!,
      m[yi + 2]!,
      m[zi]!,
      m[zi + 1]!,
      m[zi + 2]!,
      writeBasisRotation,
      out,
      oi,
    );
  };

  /** Write a vector rotated by a unit quaternion. */
  export const rotate = (
    q: ArrayLike<number>,
    qi: number,
    v: ArrayLike<number>,
    vi: number,
    out: IAutoMovieSweepRotation.IRotateOut,
    oi: number,
  ): void => {
    const qx: number = q[qi]!;
    const qy: number = q[qi + 1]!;
    const qz: number = q[qi + 2]!;
    const qw: number = q[qi + 3]!;
    const vx: number = v[vi]!;
    const vy: number = v[vi + 1]!;
    const vz: number = v[vi + 2]!;
    const tx: number = 2 * (qy * vz - qz * vy);
    const ty: number = 2 * (qz * vx - qx * vz);
    const tz: number = 2 * (qx * vy - qy * vx);
    out[oi] = vx + qw * tx + (qy * tz - qz * ty);
    out[oi + 1] = vy + qw * ty + (qz * tx - qx * tz);
    out[oi + 2] = vz + qw * tz + (qx * ty - qy * tx);
  };

  /**
   * Write the spherical interpolation from `a` to `b` at `t`, along the shorter
   * arc.
   */
  export const slerp = (
    a: ArrayLike<number>,
    ai: number,
    b: ArrayLike<number>,
    bi: number,
    t: number,
    out: IAutoMovieSweepRotation.ISlerpOut,
    oi: number,
  ): void => {
    const ax: number = a[ai]!;
    const ay: number = a[ai + 1]!;
    const az: number = a[ai + 2]!;
    const aw: number = a[ai + 3]!;
    let bx: number = b[bi]!;
    let by: number = b[bi + 1]!;
    let bz: number = b[bi + 2]!;
    let bw: number = b[bi + 3]!;
    let cos: number = ax * bx + ay * by + az * bz + aw * bw;
    if (cos < 0) {
      cos = -cos;
      bx = -bx;
      by = -by;
      bz = -bz;
      bw = -bw;
    }
    if (cos > QUATERNION_NLERP_DOT_THRESHOLD) {
      out[oi] = ax + (bx - ax) * t;
      out[oi + 1] = ay + (by - ay) * t;
      out[oi + 2] = az + (bz - az) * t;
      out[oi + 3] = aw + (bw - aw) * t;
      normalize(out, oi);
      return;
    }
    const theta: number = Math.acos(cos);
    const sin: number = Math.sin(theta);
    const wa: number = Math.sin((1 - t) * theta) / sin;
    const wb: number = Math.sin(t * theta) / sin;
    out[oi] = ax * wa + bx * wb;
    out[oi + 1] = ay * wa + by * wb;
    out[oi + 2] = az * wa + bz * wb;
    out[oi + 3] = aw * wa + bw * wb;
  };

  /*
   * Write and normalize the completed X/Y/Z/W components at the output offset.
   */
  function writeBasisRotation(
    x: number,
    y: number,
    z: number,
    w: number,
    out: IAutoMovieSweepRotation.IFromBasisOut,
    oi: number,
  ): void {
    out[oi + 3] = w;
    out[oi] = x;
    out[oi + 1] = y;
    out[oi + 2] = z;
    normalize(out, oi);
  }
}
