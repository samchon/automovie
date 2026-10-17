/**
 * Multiplies row-major 4x4 affine matrices with no frame or unit conversion.
 *
 * @evidence contracts/common.md#principled-implementation Ordinary row-major matrix multiplication composes affine maps without implicit frame conversion.
 * @evidence contracts/common.md#clear-and-simple-design Both transforms are supplied explicitly; order remains visible at the call site.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Branches follow the declared operation or source protocol rather than specimen-specific coordinates or expected results.
 * @evidence contracts/common.md#meaningful-documentation States the operation, physical interpretation and its documented degeneracy or ownership limits.
 * @evidence contracts/performance.md#efficient-algorithms Constant 4x4 arithmetic and storage.
 * @evidence contracts/performance.md#reuse-equivalent-work Each call depends directly on its arguments; no retained cache or effectful shared work exists.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returns a fresh matrix without retaining inputs.
 */
export function affMul(a: number[][], b: number[][]): number[][] {
  return [0, 1, 2, 3].map((i: number): number[] =>
    [0, 1, 2, 3].map(
      (j: number): number =>
        a[i][0] * b[0][j] +
        a[i][1] * b[1][j] +
        a[i][2] * b[2][j] +
        a[i][3] * b[3][j],
    ),
  );
}
