import { QUATERNION_NLERP_DOT_THRESHOLD } from "../../math/constants/QUATERNION_NLERP_DOT_THRESHOLD";

/**
 * Quaternion operations on caller-owned arrays, `[x, y, z, w]` at an offset,
 * for sweeps posed every frame without allocating.
 *
 * Each operation reads its inputs fully before writing, so an output may
 * share storage with an input. They follow `Quaternion`'s conventions: the
 * Hamilton product `a b` applies `b` first, a basis maps `+X`, `+Y`, `+Z` to
 * its three columns, and slerp takes the shorter arc and switches to
 * normalized linear interpolation above the shared near-parallel threshold.
 *
 * @evidence contracts/common.md#principled-implementation The Hamilton product, conjugation of unit quaternions, the trace-branch conversion from an orthonormal basis, vector rotation by `v + 2w (q x v) + 2 q x (q x v)` and Shoemake's slerp, the same formulas `Quaternion` and `quaternionFromAutoMovieBasis` use.
 * @evidence contracts/common.md#clear-and-simple-design Only the operations a posed sweep needs, each a plain function over arrays and offsets.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The slerp threshold is the shared `QUATERNION_NLERP_DOT_THRESHOLD`, not a local constant.
 * @evidence contracts/common.md#meaningful-documentation States the layout, the aliasing rule and the conventions shared with `Quaternion`.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A namespace; every member is constant time without allocation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A namespace of pure operations.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources A namespace retaining nothing.
 */
export namespace AutoMovieSweepRotation {
  /**
   * Write the product `a b`.
   *
   * @evidence contracts/common.md#principled-implementation The Hamilton product.
   * @evidence contracts/common.md#clear-and-simple-design Reads all eight components before writing four.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The result is not renormalized; callers that need a unit result say so.
   * @evidence contracts/common.md#meaningful-documentation States the order of application.
   * @evidence contracts/performance.md#efficient-algorithms Sixteen products, no allocation.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure operation.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Retains nothing.
   */
  export const multiply = (
    a: ArrayLike<number>,
    ai: number,
    b: ArrayLike<number>,
    bi: number,
    out: { [index: number]: number },
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
   * Scale a quaternion to unit length in place; a zero quaternion becomes the identity.
   *
   * @evidence contracts/common.md#principled-implementation Division by the Euclidean norm.
   * @evidence contracts/common.md#clear-and-simple-design In place, the only use posing has.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A zero input takes the identity, as `Quaternion.normalize` does, rather than producing NaN.
   * @evidence contracts/common.md#meaningful-documentation States the zero case.
   * @evidence contracts/performance.md#efficient-algorithms One square root, no allocation.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure operation.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Retains nothing.
   */
  export const normalize = (q: { [index: number]: number }, i: number): void => {
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

  /**
   * Write the inverse of a unit quaternion, its conjugate.
   *
   * @evidence contracts/common.md#principled-implementation The conjugate inverts a unit quaternion.
   * @evidence contracts/common.md#clear-and-simple-design Callers hold unit quaternions, so no division is needed.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Only valid for unit input, which every caller normalizes first.
   * @evidence contracts/common.md#meaningful-documentation States the unit premise.
   * @evidence contracts/performance.md#efficient-algorithms Four assignments.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure operation.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Retains nothing.
   */
  export const conjugate = (q: ArrayLike<number>, i: number, out: { [index: number]: number }, oi: number): void => {
    const x: number = q[i]!;
    const y: number = q[i + 1]!;
    const z: number = q[i + 2]!;
    out[oi + 3] = q[i + 3]!;
    out[oi] = -x;
    out[oi + 1] = -y;
    out[oi + 2] = -z;
  };

  /**
   * Write the unit quaternion of the rotation taking `+X`, `+Y`, `+Z` to three orthonormal columns stored at `xi`, `yi` and `zi`.
   *
   * @evidence contracts/common.md#principled-implementation The trace-branch conversion of a rotation matrix, choosing the largest diagonal term for stability, as `quaternionFromAutoMovieBasis` does.
   * @evidence contracts/common.md#clear-and-simple-design The columns are read from one array at three offsets, the layout of a written frame.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The result is normalized, absorbing rounding in the basis.
   * @evidence contracts/common.md#meaningful-documentation States the mapping.
   * @evidence contracts/performance.md#efficient-algorithms Constant time, no allocation.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure operation.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Retains nothing.
   */
  export const fromBasis = (
    m: ArrayLike<number>,
    xi: number,
    yi: number,
    zi: number,
    out: { [index: number]: number },
    oi: number,
  ): void => {
    const m00: number = m[xi]!;
    const m10: number = m[xi + 1]!;
    const m20: number = m[xi + 2]!;
    const m01: number = m[yi]!;
    const m11: number = m[yi + 1]!;
    const m21: number = m[yi + 2]!;
    const m02: number = m[zi]!;
    const m12: number = m[zi + 1]!;
    const m22: number = m[zi + 2]!;
    const trace: number = m00 + m11 + m22;
    if (trace > 0) {
      const s: number = Math.sqrt(trace + 1) * 2;
      out[oi + 3] = s / 4;
      out[oi] = (m21 - m12) / s;
      out[oi + 1] = (m02 - m20) / s;
      out[oi + 2] = (m10 - m01) / s;
    } else if (m00 > m11 && m00 > m22) {
      const s: number = Math.sqrt(1 + m00 - m11 - m22) * 2;
      out[oi + 3] = (m21 - m12) / s;
      out[oi] = s / 4;
      out[oi + 1] = (m01 + m10) / s;
      out[oi + 2] = (m02 + m20) / s;
    } else if (m11 > m22) {
      const s: number = Math.sqrt(1 + m11 - m00 - m22) * 2;
      out[oi + 3] = (m02 - m20) / s;
      out[oi] = (m01 + m10) / s;
      out[oi + 1] = s / 4;
      out[oi + 2] = (m12 + m21) / s;
    } else {
      const s: number = Math.sqrt(1 + m22 - m00 - m11) * 2;
      out[oi + 3] = (m10 - m01) / s;
      out[oi] = (m02 + m20) / s;
      out[oi + 1] = (m12 + m21) / s;
      out[oi + 2] = s / 4;
    }
    normalize(out, oi);
  };

  /**
   * Write a vector rotated by a unit quaternion.
   *
   * @evidence contracts/common.md#principled-implementation `v + 2w (q x v) + 2 q x (q x v)`, the formula `Quaternion.rotateVector` uses.
   * @evidence contracts/common.md#clear-and-simple-design Reads the vector before writing, so it may rotate in place.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Assumes a unit quaternion, as every caller supplies.
   * @evidence contracts/common.md#meaningful-documentation States the formula.
   * @evidence contracts/performance.md#efficient-algorithms Fifteen products, no allocation.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure operation.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Retains nothing.
   */
  export const rotate = (
    q: ArrayLike<number>,
    qi: number,
    v: ArrayLike<number>,
    vi: number,
    out: { [index: number]: number },
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
   * Write the spherical interpolation from `a` to `b` at `t`, along the shorter arc.
   *
   * @evidence contracts/common.md#principled-implementation Shoemake's slerp, with `b` negated when `a . b < 0` and normalized linear interpolation above the shared near-parallel threshold, as `Quaternion.slerp`.
   * @evidence contracts/common.md#clear-and-simple-design Reads both inputs before writing.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The threshold is the shared constant.
   * @evidence contracts/common.md#meaningful-documentation States the arc and the threshold.
   * @evidence contracts/performance.md#efficient-algorithms One arccosine and three sines at most, no allocation.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure operation.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Retains nothing.
   */
  export const slerp = (
    a: ArrayLike<number>,
    ai: number,
    b: ArrayLike<number>,
    bi: number,
    t: number,
    out: { [index: number]: number },
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
}
