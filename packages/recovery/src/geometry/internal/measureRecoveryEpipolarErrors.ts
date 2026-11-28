import { AutoMovieEngineMatrix3 } from "@automovie/engine";
import type { IAutoMovieRecoveryEpipolarErrorsMeasurementOperation } from "@automovie/interface";

/*
 * Measure signed Sampson distance and mean two-sided point-to-line distance in
 * the supplied integer-pixel-centre charts. Undefined lines or nonfinite
 * residuals remain null observations and cannot be counted as inliers. Invalid
 * matrices or nonrepresentable matrix-vector actions throw in the algebra
 * owner. Sampson distance is a local approximation, not reprojection truth.
 */
export function measureRecoveryEpipolarErrors(
  matrix: Parameters<IAutoMovieRecoveryEpipolarErrorsMeasurementOperation.Operation>[0],
  first: Parameters<IAutoMovieRecoveryEpipolarErrorsMeasurementOperation.Operation>[1],
  second: Parameters<IAutoMovieRecoveryEpipolarErrorsMeasurementOperation.Operation>[2],
): ReturnType<IAutoMovieRecoveryEpipolarErrorsMeasurementOperation.Operation> {
  if (first.length !== second.length)
    throw new Error("camera-error: paired points required");
  const transpose: number[] = AutoMovieEngineMatrix3.transpose(matrix);
  return first.map(
    (
      point: readonly [number, number],
      at: number,
    ): {
      signedSampsonPx: number;
      symmetricPointLinePx: number;
    } | null => {
      const other: readonly [number, number] = second[at]!;
      const line2: [number, number, number] = AutoMovieEngineMatrix3.apply(
        matrix,
        [point[0], point[1], 1],
      );
      const line1: [number, number, number] = AutoMovieEngineMatrix3.apply(
        transpose,
        [other[0], other[1], 1],
      );
      const incidence: number =
        other[0] * line2[0] + other[1] * line2[1] + line2[2];
      const norm1: number = Math.hypot(line1[0], line1[1]);
      const norm2: number = Math.hypot(line2[0], line2[1]);
      const denominator: number = Math.hypot(norm1, norm2);
      if (
        !(norm1 > 0) ||
        !(norm2 > 0) ||
        !Number.isFinite(denominator) ||
        !Number.isFinite(incidence)
      )
        return null;
      const signedSampsonPx: number = incidence / denominator;
      const symmetricPointLinePx: number =
        (Math.abs(incidence) / norm1 + Math.abs(incidence) / norm2) / 2;
      return Number.isFinite(signedSampsonPx) &&
        Number.isFinite(symmetricPointLinePx)
        ? { signedSampsonPx, symmetricPointLinePx }
        : null;
    },
  );
}
