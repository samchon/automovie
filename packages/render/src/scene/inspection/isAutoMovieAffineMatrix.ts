import type { Matrix4 } from "three";

/**
 * Whether a matrix is finite and affine, with bottom row (0, 0, 0, 1).
 *
 * @param matrix The matrix to check.
 * @returns True when every element is finite and the bottom row is affine.
 */
export function isAutoMovieAffineMatrix(matrix: Matrix4): boolean {
  const elements: number[] = matrix.elements;
  return (
    elements[3] === 0 &&
    elements[7] === 0 &&
    elements[11] === 0 &&
    elements[15] === 1
  );
}
