import { AutoMovieEngineMatrix3, AutoMovieEngineMath } from "@automovie/engine";
import type {
  IAutoMovieRecoveryEpipolarMatrixFittingOperation,
  IAutoMovieRecoveryImagePointsNormalizationOperation,
} from "@automovie/interface";

import { normalizeRecoveryImagePoints } from "./normalizeRecoveryImagePoints";

/*
 * Fit x2 transpose F x1 = 0 with normalized original-design eight-point SVD.
 * Rank two is imposed in the normalized image chart before denormalization,
 * following Hartley's normalized algorithm; this is an algebraic initializer,
 * not a calibrated-pose fit or a pixel-error certificate.
 */
export function fitRecoveryEpipolarMatrix(
  first: Parameters<IAutoMovieRecoveryEpipolarMatrixFittingOperation.Operation>[0],
  second: Parameters<IAutoMovieRecoveryEpipolarMatrixFittingOperation.Operation>[1],
  minimumRatio: Parameters<IAutoMovieRecoveryEpipolarMatrixFittingOperation.Operation>[2],
  maxSweeps: Parameters<IAutoMovieRecoveryEpipolarMatrixFittingOperation.Operation>[3],
): ReturnType<IAutoMovieRecoveryEpipolarMatrixFittingOperation.Operation> {
  if (first.length !== second.length || first.length < 8)
    throw new Error("camera-design: at least eight paired points required");
  const a: ReturnType<IAutoMovieRecoveryImagePointsNormalizationOperation.Operation> =
    normalizeRecoveryImagePoints(first);
  const b: ReturnType<IAutoMovieRecoveryImagePointsNormalizationOperation.Operation> =
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
  const options: Parameters<typeof AutoMovieEngineMath.decomposeSingularMatrix>[1] = {
    maxEntries: Math.max(81, 9 * rows.length),
    maxSweeps,
    orthogonalityTolerance: 1e-12,
  };
  const decomposition: ReturnType<typeof AutoMovieEngineMath.decomposeSingularMatrix> =
    AutoMovieEngineMath.decomposeSingularMatrix(rows, options);
  const ratio: number =
    decomposition.singularValues[7]! / decomposition.singularValues[0]!;
  if (decomposition.singularValues[0] === 0 || ratio < minimumRatio)
    throw new Error("camera-design: rank-degenerate eight-point design");
  const homogeneous: number[] = decomposition.rightColumns[8]!;
  const rank: ReturnType<typeof AutoMovieEngineMath.decomposeSingularMatrix> =
    AutoMovieEngineMath.decomposeSingularMatrix(
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
  const matrix: number[] = AutoMovieEngineMatrix3.multiply(
    AutoMovieEngineMatrix3.transpose(b.transform),
    AutoMovieEngineMatrix3.multiply(rankTwo, a.transform),
  );
  const norm: number = Math.hypot(...matrix);
  if (!(norm > 0))
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
