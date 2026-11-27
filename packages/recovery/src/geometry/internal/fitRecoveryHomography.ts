import { AutoMovieEngineMatrix3, AutoMovieEngineMath } from "@automovie/engine";
import type {
  IAutoMovieRecoveryHomographyFittingOperation,
  IAutoMovieRecoveryImagePointsNormalizationOperation,
} from "@automovie/interface";

import { normalizeRecoveryImagePoints } from "./normalizeRecoveryImagePoints";

/*
 * Fit a normalized DLT image homography and its independently representable
 * inverse for a competing planar/pure-rotation explanation. It maps first-image
 * pixel centres to second-image pixel centres; it does not identify scene
 * depth.
 */
export function fitRecoveryHomography(
  first: Parameters<IAutoMovieRecoveryHomographyFittingOperation.Operation>[0],
  second: Parameters<IAutoMovieRecoveryHomographyFittingOperation.Operation>[1],
  minimumRatio: Parameters<IAutoMovieRecoveryHomographyFittingOperation.Operation>[2],
  maxSweeps: Parameters<IAutoMovieRecoveryHomographyFittingOperation.Operation>[3],
): ReturnType<IAutoMovieRecoveryHomographyFittingOperation.Operation> {
  if (first.length !== second.length || first.length < 4)
    throw new Error("camera-homography: at least four paired points required");
  const a: ReturnType<IAutoMovieRecoveryImagePointsNormalizationOperation.Operation> =
    normalizeRecoveryImagePoints(first);
  const b: ReturnType<IAutoMovieRecoveryImagePointsNormalizationOperation.Operation> =
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
  const options: Parameters<typeof AutoMovieEngineMath.decomposeSingularMatrix>[1] = {
    maxEntries: Math.max(81, rows.length * 9),
    maxSweeps,
    orthogonalityTolerance: 1e-12,
  };
  const factors: ReturnType<typeof AutoMovieEngineMath.decomposeSingularMatrix> =
    AutoMovieEngineMath.decomposeSingularMatrix(rows, options);
  const ratio: number = factors.singularValues[7]! / factors.singularValues[0]!;
  if (factors.singularValues[0] === 0 || ratio < minimumRatio)
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
  const raw: number[] = AutoMovieEngineMatrix3.multiply(
    inverseTransform,
    AutoMovieEngineMatrix3.multiply(factors.rightColumns[8]!, a.transform),
  );
  const norm: number = Math.hypot(...raw);
  if (!(norm > 0)) throw new Error("camera-homography: nonrepresentable map");
  const matrix: number[] = raw.map((value: number): number => value / norm);
  const singular: ReturnType<typeof AutoMovieEngineMath.decomposeSingularMatrix> =
    AutoMovieEngineMath.decomposeSingularMatrix(
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
  return { matrix, inverse, designSingularRatio: ratio };
}
