/**
 * Inverts a nonsingular row-major 4x4 affine matrix whose last row is [0,0,0,1].
 *
 * @evidence contracts/common.md#principled-implementation The adjugate over the 3x3 linear block and inverse translation invert a declared affine transform.
 * @evidence contracts/common.md#clear-and-simple-design A singular block is rejected rather than creating non-finite registration coordinates.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Branches follow the declared operation or source protocol rather than specimen-specific coordinates or expected results.
 * @evidence contracts/common.md#meaningful-documentation States the operation, physical interpretation and its documented degeneracy or ownership limits.
 * @evidence contracts/performance.md#efficient-algorithms Constant 4x4 arithmetic and storage.
 * @evidence contracts/performance.md#reuse-equivalent-work Each call depends directly on its arguments; no retained cache or effectful shared work exists.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returns a new matrix without retaining or modifying the source.
 */
export function affInv(matrix: number[][]): number[][] {
  const a: number[] = matrix[0],
    b: number[] = matrix[1],
    c: number[] = matrix[2];
  const det: number =
    a[0] * (b[1] * c[2] - b[2] * c[1]) -
    a[1] * (b[0] * c[2] - b[2] * c[0]) +
    a[2] * (b[0] * c[1] - b[1] * c[0]);
  if (!Number.isFinite(det) || det === 0)
    throw new Error("Affine matrix is singular");
  const inverse: number[][] = [
    [
      (b[1] * c[2] - b[2] * c[1]) / det,
      (a[2] * c[1] - a[1] * c[2]) / det,
      (a[1] * b[2] - a[2] * b[1]) / det,
    ],
    [
      (b[2] * c[0] - b[0] * c[2]) / det,
      (a[0] * c[2] - a[2] * c[0]) / det,
      (a[2] * b[0] - a[0] * b[2]) / det,
    ],
    [
      (b[0] * c[1] - b[1] * c[0]) / det,
      (a[1] * c[0] - a[0] * c[1]) / det,
      (a[0] * b[1] - a[1] * b[0]) / det,
    ],
  ];
  const translation: number[] = [matrix[0][3], matrix[1][3], matrix[2][3]];
  return [0, 1, 2]
    .map((i: number): number[] => [
      ...inverse[i],
      -(
        inverse[i][0] * translation[0] +
        inverse[i][1] * translation[1] +
        inverse[i][2] * translation[2]
      ),
    ])
    .concat([[0, 0, 0, 1]]);
}
