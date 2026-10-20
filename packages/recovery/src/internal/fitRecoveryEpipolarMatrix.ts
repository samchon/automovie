import { AutoMovieMatrix3 } from "@automovie/engine/math/AutoMovieMatrix3";
import { decomposeAutoMovieSingularMatrix } from "@automovie/engine/math/decomposeAutoMovieSingularMatrix";

import { normalizeRecoveryImagePoints } from "./normalizeRecoveryImagePoints";

/**
 * Fit x2 transpose F x1 = 0 with normalized original-design eight-point SVD.
 * Rank two is imposed in the normalized image chart before denormalization,
 * following Hartley's normalized algorithm; this is an algebraic initializer,
 * not a calibrated-pose fit or a pixel-error certificate.
 *
 * @evidence contracts/common.md#principled-implementation Independent image normalization balances the eight-point design. Its eighth/largest original singular-value ratio tests identifiable row rank, its last right vector supplies the homogeneous solution and a separate 3-by-3 SVD imposes rank two before explicit chart denormalization.
 * @evidence contracts/common.md#clear-and-simple-design This camera-specific initializer uses generic engine decomposition and matrix products; consensus and calibrated refinement own the later pixel objective and acceptance.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No A-transpose-A eigensystem, ridge, discarded correspondence, forced singular floor or expected pose substitutes for a weak design. Nonrepresentable or rank-ambiguous inputs throw.
 * @evidence contracts/common.md#meaningful-documentation Defines the epipolar equation, normalization/rank-two order, operational design ratio, homogeneous sign convention and algebraic-initializer limitation.
 * @evidence contracts/performance.md#efficient-algorithms For N matches, the nine-column original design requires O(N) storage and O(S*N*9^2) bounded Jacobi work; the rank-two projection and chart composition have fixed dimensions.
 * @evidence contracts/performance.md#reuse-equivalent-work Each image transform serves its complete current subset and the same generic factorization provides rank diagnostics and the null vector. Changed subsets require new normalization and are not reused blindly.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Temporary normalized points, design and factors expire synchronously; only nine F entries and a rank ratio return. No source image, external handle or cache is retained.
 */
export function fitRecoveryEpipolarMatrix(
  first: readonly (readonly [number, number])[],
  second: readonly (readonly [number, number])[],
  minimumRatio: number,
  maxSweeps: number,
): { matrix: number[]; designSingularRatio: number } {
  if (first.length !== second.length || first.length < 8)
    throw new Error("camera-design: at least eight paired points required");
  const a: ReturnType<typeof normalizeRecoveryImagePoints> =
    normalizeRecoveryImagePoints(first);
  const b: ReturnType<typeof normalizeRecoveryImagePoints> =
    normalizeRecoveryImagePoints(second);
  const rows: number[][] = a.points.map(
    (point: [number, number], at: number): number[] => {
      const other: [number, number] = b.points[at]!;
      return [
        other[0] * point[0],
        other[0] * point[1],
        other[0],
        other[1] * point[0],
        other[1] * point[1],
        other[1],
        point[0],
        point[1],
        1,
      ];
    },
  );
  const options: Parameters<typeof decomposeAutoMovieSingularMatrix>[1] = {
    maxEntries: Math.max(81, 9 * rows.length),
    maxSweeps,
    orthogonalityTolerance: 1e-12,
  };
  const decomposition: ReturnType<typeof decomposeAutoMovieSingularMatrix> =
    decomposeAutoMovieSingularMatrix(rows, options);
  const ratio: number =
    decomposition.singularValues[7]! / decomposition.singularValues[0]!;
  if (!Number.isFinite(ratio) || ratio < minimumRatio)
    throw new Error("camera-design: rank-degenerate eight-point design");
  const homogeneous: number[] = decomposition.rightColumns[8]!;
  const rank: ReturnType<typeof decomposeAutoMovieSingularMatrix> =
    decomposeAutoMovieSingularMatrix(
      [
        homogeneous.slice(0, 3),
        homogeneous.slice(3, 6),
        homogeneous.slice(6, 9),
      ],
      options,
    );
  const rankTwo: number[] = new Array<number>(9).fill(0);
  for (let row: number = 0; row < 3; row++)
    for (let column: number = 0; column < 3; column++)
      for (let at: number = 0; at < 2; at++)
        rankTwo[3 * row + column] +=
          rank.singularValues[at]! *
          rank.leftColumns[at]![row]! *
          rank.rightColumns[at]![column]!;
  const matrix: number[] = AutoMovieMatrix3.multiply(
    AutoMovieMatrix3.transpose(b.transform),
    AutoMovieMatrix3.multiply(rankTwo, a.transform),
  );
  const norm: number = Math.hypot(...matrix);
  if (!(norm > 0) || !Number.isFinite(norm))
    throw new Error("camera-design: nonrepresentable fundamental matrix");
  let anchor: number = 0;
  for (let at: number = 1; at < 9; at++)
    if (Math.abs(matrix[at]!) > Math.abs(matrix[anchor]!)) anchor = at;
  const sign: number = matrix[anchor]! < 0 ? -1 : 1;
  return {
    matrix: matrix.map((value: number): number => (sign * value) / norm),
    designSingularRatio: ratio,
  };
}
