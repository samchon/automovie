import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Vector3 } from "../math/Vector3";
import { quaternionFromAutoMovieBasis } from "../math/quaternionFromAutoMovieBasis";

/**
 * The principal moments and axes of a symmetric 3x3 inertia tensor, by a
 * Jacobi diagonalization of the tensor divided by its largest entry, so the
 * stopping criterion compares dimensionless numbers at any SI scale.
 *
 * The moments come back in ascending order with their axes as a right-handed
 * rotation from the principal frame to the tensor's frame. The input rows are
 * modified in place.
 *
 * @param tensor Three rows of three finite numbers, symmetric, kg m² or any
 *   one unit; modified in place.
 * @returns The ascending principal moments in the tensor's unit and the
 *   rotation whose columns are their axes.
 * @throws {Error} When every entry is zero.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the method, the scaling, the order of the moments, the handedness of the axes and that the input is consumed.
 * @evidence contracts/development/implementation.md#principled-implementation Cyclic Jacobi rotations (Golub and Van Loan, Matrix Computations, section 8.5) zero each off-diagonal pair in a fixed order; an entry counts as zero against the machine epsilon of its two diagonal neighbours, and 32 sweeps bound the work far above the handful a 3x3 tensor needs.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The single owner of the engine's inertia diagonalization: aggregate mass properties and hull solids both read it instead of carrying their own solve.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No fixed absolute tolerance enters; the non-null assertions index fixed 3x3 arrays the function itself builds or requires.
 * @evidence contracts/development/implementation.md#efficient-algorithms Constant work: at most 32 sweeps of three plane rotations over nine entries.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its tensor; it shares nothing between calls.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Keeps nothing between calls; its temporaries die with the call.
 */
export function physicalPrincipalAxes(tensor: number[][]): {
  moments: IAutoMovieVector3;
  rotation: IAutoMovieQuaternion;
} {
  // Jacobi's stopping criterion must compare dimensionless entries rather
  // than mixing a fixed unit-one floor with moments measured in kg m².
  const scale: number = Math.max(
    ...tensor.flat().map((value: number): number => Math.abs(value)),
  );
  if (!(scale > 0)) throw new Error("Invalid aggregate inertia tensor");
  for (const row of tensor)
    for (let column: number = 0; column < 3; column++) row[column]! /= scale;
  const vectors: number[][] = [
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1],
  ];
  // Symmetric Jacobi diagonalization, fixed pair order and bounded work.
  for (let sweep: number = 0; sweep < 32; sweep++)
    for (const [p, q] of [
      [0, 1],
      [0, 2],
      [1, 2],
    ] as const) {
      const off: number = tensor[p]![q]!;
      if (
        Math.abs(off) <=
        Number.EPSILON *
          Math.max(Math.abs(tensor[p]![p]!), Math.abs(tensor[q]![q]!))
      )
        continue;
      const angle: number =
        0.5 * Math.atan2(2 * off, tensor[q]![q]! - tensor[p]![p]!);
      const c: number = Math.cos(angle);
      const s: number = Math.sin(angle);
      const pp: number = tensor[p]![p]!;
      const qq: number = tensor[q]![q]!;
      tensor[p]![p] = c * c * pp - 2 * s * c * off + s * s * qq;
      tensor[q]![q] = s * s * pp + 2 * s * c * off + c * c * qq;
      tensor[p]![q] = 0;
      tensor[q]![p] = 0;
      for (let k: number = 0; k < 3; k++) {
        if (k !== p && k !== q) {
          const kp: number = tensor[k]![p]!;
          const kq: number = tensor[k]![q]!;
          tensor[k]![p] = c * kp - s * kq;
          tensor[p]![k] = tensor[k]![p]!;
          tensor[k]![q] = s * kp + c * kq;
          tensor[q]![k] = tensor[k]![q]!;
        }
        const vp: number = vectors[k]![p]!;
        const vq: number = vectors[k]![q]!;
        vectors[k]![p] = c * vp - s * vq;
        vectors[k]![q] = s * vp + c * vq;
      }
    }
  const order: number[] = [0, 1, 2].sort(
    (a: number, b: number): number => tensor[a]![a]! - tensor[b]![b]!,
  );
  const principal: IAutoMovieVector3[] = order.map(
    (index: number): IAutoMovieVector3 => ({
      x: vectors[0]![index]!,
      y: vectors[1]![index]!,
      z: vectors[2]![index]!,
    }),
  );
  if (
    Vector3.dot(Vector3.cross(principal[0]!, principal[1]!), principal[2]!) < 0
  )
    principal[2] = Vector3.scale(principal[2]!, -1);
  return {
    moments: {
      x: tensor[order[0]!]![order[0]!]! * scale,
      y: tensor[order[1]!]![order[1]!]! * scale,
      z: tensor[order[2]!]![order[2]!]! * scale,
    },
    rotation: quaternionFromAutoMovieBasis(
      principal[0]!,
      principal[1]!,
      principal[2]!,
    ),
  };
}
