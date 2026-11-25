import {
  AutoMovieMatrix3,
  decomposeAutoMovieSingularMatrix,
} from "@automovie/engine";
import type {
  IAutoMovieRecoveryCameraChartCreationOperation,
  IAutoMovieRecoveryMapObservation,
  IAutoMovieRecoveryMapPose,
  IAutoMovieRecoveryScenePointEvaluationOperation,
  IAutoMovieRecoverySceneTrackTriangulationOperation,
} from "@automovie/interface";

import { evaluateRecoveryScenePoint } from "./evaluateRecoveryScenePoint";

/**
 * Triangulate one new track using only already registered camera observations.
 * The original 2k-by-4 homogeneous design uses calibrated world-to-camera rows;
 * its finite point remains in the common seed gauge, not a new pair unit
 * gauge.
 */
export function triangulateRecoverySceneTrack(
  observations: Parameters<IAutoMovieRecoverySceneTrackTriangulationOperation.Operation>[0],
  poses: Parameters<IAutoMovieRecoverySceneTrackTriangulationOperation.Operation>[1],
  charts: Parameters<IAutoMovieRecoverySceneTrackTriangulationOperation.Operation>[2],
  policy: Parameters<IAutoMovieRecoverySceneTrackTriangulationOperation.Operation>[3],
  budget: Parameters<IAutoMovieRecoverySceneTrackTriangulationOperation.Operation>[4],
): ReturnType<IAutoMovieRecoverySceneTrackTriangulationOperation.Operation> {
  if (
    observations.length < 2 ||
    observations.length * 8 > budget.maxLinearEntries ||
    new Set(
      observations.map(
        (observation: IAutoMovieRecoveryMapObservation): number =>
          observation.viewIndex,
      ),
    ).size !== observations.length
  )
    return {
      point: null,
      reasons: ["insufficient-distinct-point-observations"],
    };
  const rows: number[][] = [];
  for (const observation of observations) {
    const pose: IAutoMovieRecoveryMapPose | null | undefined =
      poses[observation.viewIndex];
    const chart:
      | ReturnType<IAutoMovieRecoveryCameraChartCreationOperation.Operation>
      | undefined = charts[observation.viewIndex];
    if (!pose || !chart)
      return { point: null, reasons: ["unregistered-point-observation"] };
    const ray: [number, number, number] = AutoMovieMatrix3.apply(
      chart.inverse,
      [...observation.pixel, 1],
    );
    for (let axis: number = 0; axis < 2; axis++)
      rows.push([
        ...Array.from(
          { length: 3 },
          (_: unknown, column: number): number =>
            (ray[axis]! / ray[2]) * pose.rotation[6 + column]! -
            pose.rotation[3 * axis + column]!,
        ),
        (ray[axis]! / ray[2]) * pose.translation[2] - pose.translation[axis]!,
      ]);
  }
  let factors: ReturnType<typeof decomposeAutoMovieSingularMatrix>;
  try {
    factors = decomposeAutoMovieSingularMatrix(rows, {
      maxEntries: budget.maxLinearEntries,
      maxSweeps: budget.maxSingularSweeps,
      orthogonalityTolerance: 1e-12,
    });
  } catch (error: unknown) {
    if (
      !(error instanceof Error) ||
      error.name !== "Error" ||
      !error.message.startsWith("singular-matrix:")
    )
      throw error;
    return { point: null, reasons: [`point-design-refusal: ${error.message}`] };
  }
  if (
    !(
      factors.singularValues[2]! / factors.singularValues[0]! >=
      policy.minimumDesignSingularRatio
    ) ||
    !(
      factors.singularValues[3]! / factors.singularValues[2]! <=
      policy.maximumDltNullRatio
    )
  )
    return { point: null, reasons: ["unresolved-point-design"] };
  const homogeneous: number[] = factors.rightColumns[3]!;
  if (homogeneous[3] === 0)
    return { point: null, reasons: ["point-at-infinity"] };
  const point: [number, number, number] = [
    homogeneous[0]! / homogeneous[3]!,
    homogeneous[1]! / homogeneous[3]!,
    homogeneous[2]! / homogeneous[3]!,
  ];
  // A near-zero homogeneous weight overflows the point it divides.
  if (
    point.some(
      (value: number): boolean => value === Infinity || value === -Infinity,
    )
  )
    return { point: null, reasons: ["nonfinite-point"] };
  const measured: ReturnType<IAutoMovieRecoveryScenePointEvaluationOperation.Operation> =
    evaluateRecoveryScenePoint(point, observations, poses, charts, policy);
  return { point: measured.accepted ? point : null, reasons: measured.reasons };
}
