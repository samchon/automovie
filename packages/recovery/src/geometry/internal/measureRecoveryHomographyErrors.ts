import { AutoMovieEngineMatrix3 } from "@automovie/engine";
import type { IAutoMovieRecoveryHomographyErrorsMeasurementOperation } from "@automovie/interface";

/*
 * Measure the root-mean-square forward/backward homography transfer in pixels.
 * A mapped point on the projective horizon or an unrepresentable transfer is
 * null, which never counts as finite support for the planar competitor.
 */
export function measureRecoveryHomographyErrors(
  model: Parameters<IAutoMovieRecoveryHomographyErrorsMeasurementOperation.Operation>[0],
  first: Parameters<IAutoMovieRecoveryHomographyErrorsMeasurementOperation.Operation>[1],
  second: Parameters<IAutoMovieRecoveryHomographyErrorsMeasurementOperation.Operation>[2],
): ReturnType<IAutoMovieRecoveryHomographyErrorsMeasurementOperation.Operation> {
  if (first.length !== second.length)
    throw new Error("camera-homography: paired transfer points required");
  return first.map(
    (point: readonly [number, number], at: number): number | null => {
      const other: readonly [number, number] = second[at]!;
      const forward: [number, number, number] = AutoMovieEngineMatrix3.apply(
        model.matrix,
        [...point, 1],
      );
      const backward: [number, number, number] = AutoMovieEngineMatrix3.apply(
        model.inverse,
        [...other, 1],
      );
      if (forward[2] === 0 || backward[2] === 0) return null;
      const distance: number =
        Math.hypot(
          forward[0] / forward[2] - other[0],
          forward[1] / forward[2] - other[1],
          backward[0] / backward[2] - point[0],
          backward[1] / backward[2] - point[1],
        ) / Math.SQRT2;
      return Number.isFinite(distance) ? distance : null;
    },
  );
}
