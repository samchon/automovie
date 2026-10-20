import { AutoMovieMatrix3 } from "@automovie/engine/math/AutoMovieMatrix3";
import { decomposeAutoMovieSingularMatrix } from "@automovie/engine/math/decomposeAutoMovieSingularMatrix";

import { normalizeRecoveryImagePoints } from "./normalizeRecoveryImagePoints";

/**
 * Fit a normalized DLT image homography and its independently representable
 * inverse for a competing planar/pure-rotation explanation. It maps first-image
 * pixel centres to second-image pixel centres; it does not identify scene depth.
 *
 * @evidence contracts/common.md#principled-implementation Independent centroid/mean-distance normalization balances the original 2N-by-9 projective design. Original-design SVD supplies its null vector and rank diagnostic; chart denormalization precedes a separate 3-by-3 singular inverse and forward/backward transfer measurements by the caller.
 * @evidence contracts/common.md#clear-and-simple-design This planar competitor remains separate from calibrated epipolar fitting because a good homography explains an ambiguity rather than a nonplanar camera baseline.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No normal equations, diagonal ridge, selected plane, guessed inverse or truth camera rescues degenerate correspondence geometry; nonrepresentable inverses throw.
 * @evidence contracts/common.md#meaningful-documentation Defines map direction, pixel-centre chart, independent normalization, original-design rank test and lack of depth authority.
 * @evidence contracts/performance.md#efficient-algorithms N correspondences require O(N) storage and O(S*N*9^2) bounded design rotations plus fixed 3-by-3 inverse work; scoring a changed subset needs its own normalization.
 * @evidence contracts/performance.md#reuse-equivalent-work One fitted matrix and inverse serve all candidate scoring; the inverse uses the same 3-by-3 factors for all entries rather than repeated solves.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only two owned nine-number matrices and the rank ratio return; normalized points, factors and designs are call-local with no retained cache or handle.
 */
export function fitRecoveryHomography(
  first: readonly (readonly [number, number])[],
  second: readonly (readonly [number, number])[],
  minimumRatio: number,
  maxSweeps: number,
): { matrix: number[]; inverse: number[]; designSingularRatio: number } {
  if (first.length !== second.length || first.length < 4)
    throw new Error("camera-homography: at least four paired points required");
  const a: ReturnType<typeof normalizeRecoveryImagePoints> =
    normalizeRecoveryImagePoints(first);
  const b: ReturnType<typeof normalizeRecoveryImagePoints> =
    normalizeRecoveryImagePoints(second);
  const rows: number[][] = [];
  for (let at: number = 0; at < first.length; at++) {
    const x: number = a.points[at]![0],
      y: number = a.points[at]![1];
    const u: number = b.points[at]![0],
      v: number = b.points[at]![1];
    rows.push(
      [-x, -y, -1, 0, 0, 0, u * x, u * y, u],
      [0, 0, 0, -x, -y, -1, v * x, v * y, v],
    );
  }
  const options: Parameters<typeof decomposeAutoMovieSingularMatrix>[1] = {
    maxEntries: Math.max(81, rows.length * 9),
    maxSweeps,
    orthogonalityTolerance: 1e-12,
  };
  const factors: ReturnType<typeof decomposeAutoMovieSingularMatrix> =
    decomposeAutoMovieSingularMatrix(rows, options);
  const ratio: number = factors.singularValues[7]! / factors.singularValues[0]!;
  if (!Number.isFinite(ratio) || ratio < minimumRatio)
    throw new Error("camera-homography: rank-degenerate design");
  // Hartley normalization is a similarity: its inverse can be written directly
  // without a general matrix inverse or fitting any additional observations.
  const bt: number[] = b.transform;
  const inverseTransform: number[] = [
    1 / bt[0]!,
    0,
    -bt[2]! / bt[0]!,
    0,
    1 / bt[4]!,
    -bt[5]! / bt[4]!,
    0,
    0,
    1,
  ];
  const raw: number[] = AutoMovieMatrix3.multiply(
    inverseTransform,
    AutoMovieMatrix3.multiply(factors.rightColumns[8]!, a.transform),
  );
  const norm: number = Math.hypot(...raw);
  if (!(norm > 0) || !Number.isFinite(norm))
    throw new Error("camera-homography: nonrepresentable map");
  const matrix: number[] = raw.map((value: number): number => value / norm);
  const singular: ReturnType<typeof decomposeAutoMovieSingularMatrix> =
    decomposeAutoMovieSingularMatrix(
      [matrix.slice(0, 3), matrix.slice(3, 6), matrix.slice(6, 9)],
      options,
    );
  if (
    !(
      singular.singularValues[2]! / singular.singularValues[0]! >
      singular.relativeNullCutoff
    )
  )
    throw new Error("camera-homography: unresolved inverse");
  const inverse: number[] = new Array<number>(9).fill(0);
  for (let row: number = 0; row < 3; row++)
    for (let column: number = 0; column < 3; column++)
      for (let at: number = 0; at < 3; at++)
        inverse[row * 3 + column] +=
          (singular.rightColumns[at]![row]! *
            singular.leftColumns[at]![column]!) /
          singular.singularValues[at]!;
  if (!inverse.every(Number.isFinite))
    throw new Error("camera-homography: nonrepresentable inverse");
  return { matrix, inverse, designSingularRatio: ratio };
}
