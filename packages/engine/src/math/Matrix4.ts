import {
  type IAutoMovieMatrix4,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "./Quaternion";
import { Vector3 } from "./Vector3";
import { AutoMovieEngineMath } from "./AutoMovieEngineMath";

/**
 * Pure 4×4 matrix math in column-major order, element `m[col * 4 + row]`, the
 * storage order of glTF and `three.js`.
 *
 * The interface never exposes a matrix: nodes carry translation, rotation and
 * scale so every value stays animatable (`IAutoMovieTransform`). Composing a
 * hierarchy under non-uniform scale needs a real matrix product, because a
 * scaled parent rotating a child produces a shear that no translation, rotation
 * and scale triple can carry, so the engine composes world matrices here and
 * hands them to the renderer. Every function leaves its inputs unchanged and
 * returns a new value.
 */
export namespace Matrix4 {
  /** A new identity matrix. */
  export const identity: () => number[] = (): number[] => [
    1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1,
  ];

  /**
   * The matrix `T · R · S` of a translation, rotation and scale, so a point is
   * scaled, then rotated, then translated.
   *
   * The arithmetic is the same as `three.js` `Matrix4.compose`, so engine and
   * viewer agree bit for bit. The rotation must be a unit quaternion; any other
   * length scales and skews the basis instead of rotating it. A zero scale
   * component yields a zero basis column, which `decompose` accepts.
   *
   * @param t Translation, in parent units.
   * @param r Unit rotation quaternion.
   * @param s Per-axis scale factor.
   * @returns A new column-major matrix.
   */
  export const compose: (
    t: IAutoMovieVector3,
    r: IAutoMovieQuaternion,
    s: IAutoMovieVector3,
  ) => number[] = (
    t: IAutoMovieVector3,
    r: IAutoMovieQuaternion,
    s: IAutoMovieVector3,
  ): number[] => {
    const x2: number = r.x + r.x;
    const y2: number = r.y + r.y;
    const z2: number = r.z + r.z;
    const xx: number = r.x * x2;
    const xy: number = r.x * y2;
    const xz: number = r.x * z2;
    const yy: number = r.y * y2;
    const yz: number = r.y * z2;
    const zz: number = r.z * z2;
    const wx: number = r.w * x2;
    const wy: number = r.w * y2;
    const wz: number = r.w * z2;
    return [
      (1 - (yy + zz)) * s.x,
      (xy + wz) * s.x,
      (xz - wy) * s.x,
      0,
      (xy - wz) * s.y,
      (1 - (xx + zz)) * s.y,
      (yz + wx) * s.y,
      0,
      (xz + wy) * s.z,
      (yz - wx) * s.z,
      (1 - (xx + yy)) * s.z,
      0,
      t.x,
      t.y,
      t.z,
      1,
    ];
  };

  /**
   * The matrix product `a · b`, which applies `b` first and then `a`.
   *
   * @param a Outer (later) transform, column-major.
   * @param b Inner (earlier) transform, column-major.
   * @returns A new column-major matrix; neither input is changed.
   */
  export const multiply: (a: number[], b: number[]) => number[] = (
    a: number[],
    b: number[],
  ): number[] => {
    const out: number[] = new Array<number>(16);
    for (let col: number = 0; col < 4; ++col)
      for (let row: number = 0; row < 4; ++row) {
        let sum: number = 0;
        for (let k: number = 0; k < 4; ++k)
          sum += a[k * 4 + row]! * b[col * 4 + k]!;
        out[col * 4 + row] = sum;
      }
    return out;
  };

  /**
   * The translation column of a matrix, which for a world matrix is the world
   * position of its local origin.
   *
   * @param m Column-major matrix.
   * @returns A new vector of elements 12, 13 and 14.
   */
  export const position: (m: number[]) => IAutoMovieVector3 = (
    m: number[],
  ): IAutoMovieVector3 => ({
    x: m[12]!,
    y: m[13]!,
    z: m[14]!,
  });

  /**
   * The image of a point under an affine matrix, `m · (p, 1)`, with the fourth
   * row ignored.
   *
   * Every matrix this namespace builds is affine, so the ignored row is always
   * `(0, 0, 0, 1)` and no perspective divide is needed. A direction is not a
   * point: it must not take the translation column, so transform it with the
   * rotation and scale instead.
   *
   * @param m Column-major affine matrix, element `m[col * 4 + row]`.
   * @param p Point in the matrix's source space.
   * @returns A fresh point in the target space.
   */
  export const transformPoint: (
    m: number[],
    p: IAutoMovieVector3,
  ) => IAutoMovieVector3 = (
    m: number[],
    p: IAutoMovieVector3,
  ): IAutoMovieVector3 => ({
    x: m[0]! * p.x + m[4]! * p.y + m[8]! * p.z + m[12]!,
    y: m[1]! * p.x + m[5]! * p.y + m[9]! * p.z + m[13]!,
    z: m[2]! * p.x + m[6]! * p.y + m[10]! * p.z + m[14]!,
  });

  /*
   * Canonical X, Y and Z axes, the identity basis.
   */
  const AXES: readonly IAutoMovieVector3[] = [
    { x: 1, y: 0, z: 0 },
    { x: 0, y: 1, z: 0 },
    { x: 0, y: 0, z: 1 },
  ];

  /*
   * Replaces each null (collapsed) column of a unit basis with its orthonormal
   * completion, leaving every present column unchanged.
   */
  const completeBasis: (
    columns: readonly (IAutoMovieVector3 | null)[],
  ) => IAutoMovieVector3[] = (
    columns: readonly (IAutoMovieVector3 | null)[],
  ): IAutoMovieVector3[] => {
    const present: number[] = [0, 1, 2].filter(
      (axis: number): boolean => columns[axis] !== null,
    );
    if (present.length === 3) return columns as IAutoMovieVector3[];
    if (present.length === 2) {
      const missing: number = 3 - present[0]! - present[1]!;
      const next: IAutoMovieVector3 = columns[(missing + 1) % 3]!;
      const after: IAutoMovieVector3 = columns[(missing + 2) % 3]!;
      const normal: IAutoMovieVector3 = Vector3.cross(next, after);
      // Parallel survivors span one direction only, like a single survivor.
      if (Vector3.length(normal) === 0)
        return alignedBasis((missing + 1) % 3, next);
      const completed: IAutoMovieVector3[] =
        columns.slice() as IAutoMovieVector3[];
      completed[missing] = Vector3.normalize(normal);
      return completed;
    }
    if (present.length === 1)
      return alignedBasis(present[0]!, columns[present[0]!]!);
    return AXES.slice();
  };

  /*
   * The identity basis turned by the shortest arc that carries canonical axis
   * `axis` onto the unit vector `direction`, with that column set to
   * `direction` itself.
   */
  const alignedBasis: (
    axis: number,
    direction: IAutoMovieVector3,
  ) => IAutoMovieVector3[] = (
    axis: number,
    direction: IAutoMovieVector3,
  ): IAutoMovieVector3[] => {
    const turn: IAutoMovieQuaternion = AutoMovieEngineMath.rotationBetween(AXES[axis]!, direction);
    return AXES.map(
      (canonical: IAutoMovieVector3, at: number): IAutoMovieVector3 =>
        at === axis ? direction : Quaternion.rotateVector(turn, canonical),
    );
  };

  /**
   * Splits an affine matrix into the translation, rotation and scale that
   * {@link compose} would rebuild it from.
   *
   * The world driver pass reads a node's world position and orientation this
   * way, recomputes it for an aim, parent or IK driver, and composes it back.
   * Scale is the length of each basis column and is never negative, since
   * validators admit only positive scale and the engine never mirrors. A matrix
   * with a mirrored or sheared basis, such as a child rotated under a
   * non-uniformly scaled parent, has no exact decomposition; its rotation is
   * then an approximation that need not be unit length.
   *
   * A collapsed axis, whose basis column has length exactly zero, carries no
   * direction, so its rotation axis is completed from the others: one missing
   * axis is the right-handed cross product of the remaining two, and with only
   * one axis left the other two follow the shortest-arc rotation that carries
   * that axis's canonical direction onto it. A fully collapsed matrix has the
   * identity rotation. For a finite unsheared matrix, composing the result
   * again reproduces every nonzero column to rounding, and the rotation is a
   * finite unit quaternion.
   *
   * @param m Column-major affine matrix.
   * @returns New position, rotation and scale; `m` is unchanged.
   */
  export const decompose: (
    m: number[],
  ) => IAutoMovieMatrix4.IDecomposeResult = (
    m: number[],
  ): IAutoMovieMatrix4.IDecomposeResult => {
    const sx: number = Math.hypot(m[0]!, m[1]!, m[2]!);
    const sy: number = Math.hypot(m[4]!, m[5]!, m[6]!);
    const sz: number = Math.hypot(m[8]!, m[9]!, m[10]!);
    const [u, v, n]: IAutoMovieVector3[] = completeBasis([
      sx === 0 ? null : { x: m[0]! / sx, y: m[1]! / sx, z: m[2]! / sx },
      sy === 0 ? null : { x: m[4]! / sy, y: m[5]! / sy, z: m[6]! / sy },
      sz === 0 ? null : { x: m[8]! / sz, y: m[9]! / sz, z: m[10]! / sz },
    ]) as [IAutoMovieVector3, IAutoMovieVector3, IAutoMovieVector3];

    // Rotation basis r[row][col]: column c is basis vector c.
    const r00: number = u.x;
    const r10: number = u.y;
    const r20: number = u.z;
    const r01: number = v.x;
    const r11: number = v.y;
    const r21: number = v.z;
    const r02: number = n.x;
    const r12: number = n.y;
    const r22: number = n.z;

    const trace: number = r00 + r11 + r22;
    let x: number;
    let y: number;
    let z: number;
    let w: number;
    if (trace > 0) {
      const s: number = 0.5 / Math.sqrt(trace + 1);
      w = 0.25 / s;
      x = (r21 - r12) * s;
      y = (r02 - r20) * s;
      z = (r10 - r01) * s;
    } else if (r00 > r11 && r00 > r22) {
      const s: number = 2 * Math.sqrt(1 + r00 - r11 - r22);
      w = (r21 - r12) / s;
      x = 0.25 * s;
      y = (r01 + r10) / s;
      z = (r02 + r20) / s;
    } else if (r11 > r22) {
      const s: number = 2 * Math.sqrt(1 + r11 - r00 - r22);
      w = (r02 - r20) / s;
      x = (r01 + r10) / s;
      y = 0.25 * s;
      z = (r12 + r21) / s;
    } else {
      const s: number = 2 * Math.sqrt(1 + r22 - r00 - r11);
      w = (r10 - r01) / s;
      x = (r02 + r20) / s;
      y = (r12 + r21) / s;
      z = 0.25 * s;
    }
    return {
      position: { x: m[12]!, y: m[13]!, z: m[14]! },
      rotation: { x, y, z, w },
      scale: { x: sx, y: sy, z: sz },
    };
  };
}
