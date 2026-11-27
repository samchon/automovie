import type {
  IAutoMoviePrincipalTensorFrame,
  IAutoMovieVector3,
} from "@automovie/interface";

import { quaternionFromBasis } from "../../math/internal/quaternionFromBasis";

/*
 * The principal moments and axes of a symmetric 3x3 inertia tensor, by a Jacobi
 * diagonalization of the tensor divided by its largest entry, so the stopping
 * criterion compares dimensionless numbers at any SI scale.
 *
 * The moments come back in ascending order with their axes as a right-handed
 * rotation from the principal frame to the tensor's frame. The input rows are
 * modified in place.
 * Parameter tensor: Three rows of three finite numbers, symmetric, kg m² or any one
 * unit; modified in place.
 * Returns: The ascending principal moments in the tensor's unit and the
 * rotation whose columns are their axes.
 * When every entry is zero.
 */
export function physicalPrincipalAxes(
  tensor: number[][],
): IAutoMoviePrincipalTensorFrame {
  // Jacobi's stopping criterion must compare dimensionless entries rather
  // than mixing a fixed unit-one floor with moments measured in kg m².
  let scale: number = Number.NEGATIVE_INFINITY;
  for (const row of tensor)
    for (const value of row) scale = Math.max(scale, Math.abs(value));
  if (!(scale > 0)) throw new Error("Invalid aggregate inertia tensor");
  for (const row of tensor)
    for (let column: number = 0; column < 3; column++) row[column]! /= scale;
  const vectors: number[][] = [
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1],
  ];

  // Symmetric Jacobi diagonalization, fixed pair order and bounded work.
  for (let sweep: number = 0; sweep < 32; sweep++) {
    let changed: boolean = false;
    for (const [p, q] of PAIRS) {
      const off: number = tensor[p]![q]!;
      if (
        Math.abs(off) <=
        Number.EPSILON *
          Math.max(Math.abs(tensor[p]![p]!), Math.abs(tensor[q]![q]!))
      )
        continue;
      changed = true;
      const angle: number =
        0.5 * Math.atan2(2 * off, tensor[q]![q]! - tensor[p]![p]!);
      const c: number = Math.cos(angle);
      const s: number = Math.sin(angle);
      const pp: number = tensor[p]![p]!;
      const qq: number = tensor[q]![q]!;
      const cc: number = c * c;
      const ss: number = s * s;
      const coupled: number = 2 * s * c * off;
      tensor[p]![p] = cc * pp - coupled + ss * qq;
      tensor[q]![q] = ss * pp + coupled + cc * qq;
      tensor[p]![q] = 0;
      tensor[q]![p] = 0;
      for (let k: number = 0; k < 3; k++) {
        if (k !== p && k !== q) {
          const kp: number = tensor[k]![p]!;
          const kq: number = tensor[k]![q]!;
          const rotatedP: number = c * kp - s * kq;
          const rotatedQ: number = s * kp + c * kq;
          tensor[k]![p] = rotatedP;
          tensor[p]![k] = rotatedP;
          tensor[k]![q] = rotatedQ;
          tensor[q]![k] = rotatedQ;
        }
        const vp: number = vectors[k]![p]!;
        const vq: number = vectors[k]![q]!;
        vectors[k]![p] = c * vp - s * vq;
        vectors[k]![q] = s * vp + c * vq;
      }
    }
    if (!changed) break;
  }
  // Adjacent strict swaps preserve the original order of equal moments.
  let firstIndex: number = 0;
  let secondIndex: number = 1;
  let thirdIndex: number = 2;
  if (tensor[firstIndex]![firstIndex]! > tensor[secondIndex]![secondIndex]!) {
    const previous: number = firstIndex;
    firstIndex = secondIndex;
    secondIndex = previous;
  }
  if (tensor[secondIndex]![secondIndex]! > tensor[thirdIndex]![thirdIndex]!) {
    const previous: number = secondIndex;
    secondIndex = thirdIndex;
    thirdIndex = previous;
  }
  if (tensor[firstIndex]![firstIndex]! > tensor[secondIndex]![secondIndex]!) {
    const previous: number = firstIndex;
    firstIndex = secondIndex;
    secondIndex = previous;
  }
  const first: IAutoMovieVector3 = {
    x: vectors[0]![firstIndex]!,
    y: vectors[1]![firstIndex]!,
    z: vectors[2]![firstIndex]!,
  };
  const second: IAutoMovieVector3 = {
    x: vectors[0]![secondIndex]!,
    y: vectors[1]![secondIndex]!,
    z: vectors[2]![secondIndex]!,
  };
  const third: IAutoMovieVector3 = {
    x: vectors[0]![thirdIndex]!,
    y: vectors[1]![thirdIndex]!,
    z: vectors[2]![thirdIndex]!,
  };
  const handedness: number =
    (first.y * second.z - first.z * second.y) * third.x +
    (first.z * second.x - first.x * second.z) * third.y +
    (first.x * second.y - first.y * second.x) * third.z;
  if (handedness < 0) {
    third.x *= -1;
    third.y *= -1;
    third.z *= -1;
  }
  return {
    moments: {
      x: tensor[firstIndex]![firstIndex]! * scale,
      y: tensor[secondIndex]![secondIndex]! * scale,
      z: tensor[thirdIndex]![thirdIndex]! * scale,
    },
    rotation: quaternionFromBasis(first, second, third),
  };
}

/*
 * The immutable cyclic plane order, independent of every input tensor.
 */
const PAIRS: readonly (readonly [number, number])[] = [
  [0, 1],
  [0, 2],
  [1, 2],
];
