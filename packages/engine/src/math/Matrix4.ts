import { IAutoMovieQuaternion, IAutoMovieVector3 } from "@automovie/interface";
import { Quaternion } from "./Quaternion";
import { Vector3 } from "./Vector3";
import { rotationBetween } from "./rotationBetween";
/**
 * Pure 4×4 matrix math in column-major order, element `m[col * 4 + row]`, the
 * storage order of glTF and `three.js`.
 *
 * The interface never exposes a matrix: nodes carry translation, rotation and
 * scale so every value stays animatable (`IAutoMovieTransform`). Composing a
 * hierarchy under non-uniform scale needs a real matrix product, because a
 * scaled parent rotating a child produces a shear that no translation,
 * rotation and scale triple can carry, so the engine composes world matrices
 * here and hands them to the renderer. Every function leaves its inputs
 * unchanged and returns a new value.
 *
 * @evidence contracts/common.md#principled-implementation Column-major 4×4 affine matrices with `T · R · S` composition, the representation glTF node transforms and `three.js` use, so a matrix built here means the same thing to the engine and to the viewer that renders it.
 * @evidence contracts/common.md#clear-and-simple-design A namespace of stateless functions over plain `number[]` instead of a matrix class, so the engine's records stay JSON values and the module stays free of a renderer dependency.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No function special-cases a caller or matrix; `decompose` completes a collapsed axis by the same rule for every matrix, and the affine premise of `transformPoint` is stated rather than compensated.
 * @evidence contracts/common.md#meaningful-documentation States the storage order and element formula, why matrices exist internally though the interface carries only transforms, and that every function returns a new value.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The namespace groups fixed-size affine operations; matrix multiplication and decomposition state their arithmetic on their members.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Matrix results depend on current coefficients and transforms, and this module owns no composition cache across hierarchy passes.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Three canonical axis records remain for collapsed-basis completion; each matrix result is a separate caller-owned array and no input matrix is retained.
 */
export namespace Matrix4 {
  /**
   * A new identity matrix.
   *
   * @evidence contracts/common.md#principled-implementation The sixteen entries of the 4×4 identity, ones on the diagonal, which is the same array in either storage order.
   * @evidence contracts/common.md#clear-and-simple-design A function rather than a shared constant, because `multiply` and callers that fill a matrix in place must never alias one global array.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Returns the exact identity for every call with no cached or caller-specific value.
   * @evidence contracts/common.md#meaningful-documentation States that each call returns a new array, which is the fact a caller that mutates the result needs.
   * @evidenceExclude contracts/performance.md#efficient-algorithms One sixteen-element array literal with no algorithm to choose.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work A fresh array is the contract, so sharing one would be wrong rather than cheaper.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The sixteen identity entries are freshly allocated for the caller; no shared mutable matrix is retained.
   */
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
   *
   * @evidence contracts/common.md#principled-implementation Each basis column is the rotation matrix column of the unit quaternion, from the standard expansion `1 - 2(y² + z²)`, `2(xy + wz)` and so on, multiplied by that axis's scale, with the translation in the fourth column; the doubled components `x2`, `y2`, `z2` are the `three.js` factoring, kept so results match the viewer exactly.
   * @evidence contracts/common.md#clear-and-simple-design Builds the composed matrix directly instead of multiplying three separate matrices, which is both the `three.js` arithmetic the viewer must match and the only composition order the engine uses.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The quaternion is not normalized here; validators admit only near-unit rotations, and a silent normalization would make the engine differ from the viewer for the same transform.
   * @evidence contracts/common.md#meaningful-documentation States the order the parts apply in, the bit-for-bit agreement with `three.js`, the unit-rotation premise and what breaks without it, how a zero scale behaves, and each parameter's role.
   * @evidenceExclude contracts/performance.md#efficient-algorithms A fixed set of twelve products and the scaled basis, in constant time with no algorithm to choose.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure function of one transform that coordinates no work across calls.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Doubled quaternion components remain scalar locals, and the sixteen composed coefficients transfer to the caller without retaining the translation or scale records.
   */
  export const compose: (t: IAutoMovieVector3, r: IAutoMovieQuaternion, s: IAutoMovieVector3) => number[] = (
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
   *
   * @evidence contracts/common.md#principled-implementation The matrix product sums `a(row, k) · b(k, col)` through column-major indices for every row and column, including the fourth row; finite sixteen-entry operands are the caller premise, and large products may overflow binary64.
   * @evidence contracts/common.md#clear-and-simple-design One general product shared by hierarchy composition, world drivers, springs and placement code, returning a new array so no caller's matrix is overwritten.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Every entry is summed in the same `k` order for every matrix; no identity or affine input takes a shortcut that would change rounding between callers.
   * @evidence contracts/common.md#meaningful-documentation States which operand applies first, the storage order of both inputs, and that the result is new with inputs unchanged.
   * @evidence contracts/performance.md#efficient-algorithms Constant time: 64 multiply-adds into one preallocated sixteen-element array, the direct product for a fixed 4×4 size where no faster method applies.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure function of two matrices that coordinates no work across calls.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources One sixteen-entry product array accumulates the sums and becomes caller-owned; neither operand is retained or overwritten.
   */
  export const multiply: (a: number[], b: number[]) => number[] = (a: number[], b: number[]): number[] => {
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
   *
   * @evidence contracts/common.md#principled-implementation The image of the local origin `(0, 0, 0, 1)` under an affine column-major matrix is its fourth column, elements 12 to 14, so reading them is exact with no arithmetic.
   * @evidence contracts/common.md#clear-and-simple-design One named read for the translation column, which resolve, placement and drawing code use instead of indexing elements 12 to 14 themselves.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Reads the same three elements for every matrix; a projective fourth row is outside the affine matrices this namespace builds and is not compensated.
   * @evidence contracts/common.md#meaningful-documentation States what the column means for a world matrix and which elements are read.
   * @evidenceExclude contracts/performance.md#efficient-algorithms Three array reads with no algorithm to choose.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure read that coordinates no work across calls.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The extracted origin owns its three copied translation values and keeps no reference to the matrix array.
   */
  export const position: (m: number[]) => IAutoMovieVector3 = (m: number[]): IAutoMovieVector3 => ({
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
   *
   * @evidence contracts/common.md#principled-implementation The column-major product of the upper three rows with the homogeneous point `(x, y, z, 1)`, which is the full transform for the affine matrices `compose` and `multiply` produce; it assumes that affinity and states it rather than dividing by a fourth coordinate that is always one.
   * @evidence contracts/common.md#clear-and-simple-design Sits beside `compose` and `multiply` in the matrix namespace, so callers that compose a matrix also map points through it here instead of each keeping a private copy of the same twelve products.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No matrix or caller is special-cased; the dropped fourth row is the stated affine premise, not a compensation.
   * @evidence contracts/common.md#meaningful-documentation States the formula, the affine premise and why no divide happens, that a direction must not use it, the storage order, and each parameter's space.
   * @evidenceExclude contracts/performance.md#efficient-algorithms Nine multiplications and nine additions in constant time, with no algorithm to choose.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure map of one point that coordinates no work across calls.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Allocates the returned point only and retains nothing.
   */
  export const transformPoint: (m: number[], p: IAutoMovieVector3) => IAutoMovieVector3 = (
    m: number[],
    p: IAutoMovieVector3,
  ): IAutoMovieVector3 => ({
    x: m[0]! * p.x + m[4]! * p.y + m[8]! * p.z + m[12]!,
    y: m[1]! * p.x + m[5]! * p.y + m[9]! * p.z + m[13]!,
    z: m[2]! * p.x + m[6]! * p.y + m[10]! * p.z + m[14]!,
  });

  /** Canonical X, Y and Z axes, the identity basis. */
  const AXES: readonly IAutoMovieVector3[] = [
    { x: 1, y: 0, z: 0 },
    { x: 0, y: 1, z: 0 },
    { x: 0, y: 0, z: 1 },
  ];

  /**
   * Replaces each null (collapsed) column of a unit basis with its orthonormal
   * completion, leaving every present column unchanged.
   */
  const completeBasis: (columns: readonly (IAutoMovieVector3 | null)[]) => IAutoMovieVector3[] = (
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
      const completed: IAutoMovieVector3[] = columns.slice() as IAutoMovieVector3[];
      completed[missing] = Vector3.normalize(normal);
      return completed;
    }
    if (present.length === 1)
      return alignedBasis(present[0]!, columns[present[0]!]!);
    return AXES.slice();
  };

  /**
   * The identity basis turned by the shortest arc that carries canonical axis
   * `axis` onto the unit vector `direction`, with that column set to
   * `direction` itself.
   */
  const alignedBasis: (axis: number, direction: IAutoMovieVector3) => IAutoMovieVector3[] = (
    axis: number,
    direction: IAutoMovieVector3,
  ): IAutoMovieVector3[] => {
    const turn: IAutoMovieQuaternion = rotationBetween(AXES[axis]!, direction);
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
   *
   * @evidence contracts/common.md#principled-implementation Scale is each basis column's `Math.hypot` length and the rotation is read from the scale-normalized basis by Shepperd's largest-diagonal extraction, in the exact arithmetic of `three.js` `Matrix4.decompose`; the premise is an orthonormal right-handed basis after normalization, which positive-scale validation guarantees for unsheared transforms, and a zero-length column is replaced by its orthonormal completion so the extraction still receives a rotation matrix.
   * @evidence contracts/common.md#clear-and-simple-design The completion runs only when a column has zero length, so every other matrix takes exactly the `three.js` arithmetic; the extraction stays inline rather than calling `quaternionFromAutoMovieBasis`, whose normalization and different factoring would change results the viewer must match.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A collapsed axis is completed from the surviving columns rather than divided by a floored length, because a floored divisor leaves a non-unit rotation that distorts the surviving axes when composed again; a tiny nonzero scale is divided by its own length, and mirrored or sheared input is stated as unsupported rather than adjusted.
   * @evidence contracts/common.md#meaningful-documentation States the inverse relation to `compose`, which pass relies on it, the nonnegative-scale premise and why it holds, the mirrored and sheared limitation, how a collapsed axis is completed, and the round-trip and finiteness guarantees.
   * @evidence contracts/performance.md#efficient-algorithms Constant time: three column lengths, nine divisions, one branch of the quaternion extraction, and for a collapsed matrix at most one cross product or one shortest-arc rotation of two axes.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure function of one matrix that coordinates no work across calls.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Allocates the three basis vectors and the returned record and retains nothing.
   */
  export const decompose: (m: number[]) => { position: IAutoMovieVector3; rotation: IAutoMovieQuaternion; scale: IAutoMovieVector3; } = (
    m: number[],
  ): {
    position: IAutoMovieVector3;
    rotation: IAutoMovieQuaternion;
    scale: IAutoMovieVector3;
  } => {
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
