import { AutoMovieMatrix3 } from "@automovie/engine/math/AutoMovieMatrix3";
import { decomposeAutoMovieSingularMatrix } from "@automovie/engine/math/decomposeAutoMovieSingularMatrix";
import type {
  IAutoMovieRecoveryCameraMapBudget,
  IAutoMovieRecoveryCameraMapPolicy,
} from "@automovie/interface/recovery";

import type { IAutoMovieRecoveryMapObservation } from "../structures/image/IAutoMovieRecoveryMapObservation";
import type { IAutoMovieRecoveryMapPose } from "../structures/image/IAutoMovieRecoveryMapPose";
import type { IAutoMovieRecoverySceneTriangulation } from "../structures/internal/IAutoMovieRecoverySceneTriangulation";
import type { createRecoveryCameraChart } from "./createRecoveryCameraChart";
import { evaluateRecoveryScenePoint } from "./evaluateRecoveryScenePoint";

/**
 * Triangulate one new track using only already registered camera observations.
 * The original 2k-by-4 homogeneous design uses calibrated world-to-camera rows;
 * its finite point remains in the common seed gauge, not a new pair unit gauge.
 *
 * @evidence contracts/common.md#principled-implementation Each calibrated ray supplies two original projection equations. Third-direction rank, last-direction gap and finite division precede independent all-observation depth, acute-angle and pixel gates. Unregistered observations cannot enter the design.
 * @evidence contracts/common.md#clear-and-simple-design This helper reconstructs one candidate point; scene ownership selects registered observations and commits or rolls back complete camera/point transactions.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No target camera creates its own PnP point, no arbitrary subset hides a bad retained measurement, and no point at infinity, weak angle or damped rank is accepted.
 * @evidence contracts/common.md#meaningful-documentation States original multiview DLT, common frame, independent null/rank/point qualification and declared numerical refusal versus unexpected failure.
 * @evidence contracts/performance.md#efficient-algorithms k admitted observations require one bounded four-column SVD costing O(S*k) and delegated O(k^2) angle qualification; no scene-wide design or image data is retained.
 * @evidence contracts/performance.md#reuse-equivalent-work Existing charts and measured coordinates form the design without extraction or descriptor comparisons; one reconstructed point supplies all qualification metrics.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only an owned point or null and reasons return. Small original rows, factors and rays expire without mutation or external resources.
 */
export function triangulateRecoverySceneTrack(
  observations: readonly IAutoMovieRecoveryMapObservation[],
  poses: readonly (IAutoMovieRecoveryMapPose | null)[],
  charts: readonly ReturnType<typeof createRecoveryCameraChart>[],
  policy: IAutoMovieRecoveryCameraMapPolicy,
  budget: IAutoMovieRecoveryCameraMapBudget,
): IAutoMovieRecoverySceneTriangulation {
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
    const chart: ReturnType<typeof createRecoveryCameraChart> | undefined =
      charts[observation.viewIndex];
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
  if (!point.every(Number.isFinite))
    return { point: null, reasons: ["nonfinite-point"] };
  const measured: ReturnType<typeof evaluateRecoveryScenePoint> =
    evaluateRecoveryScenePoint(point, observations, poses, charts, policy);
  return { point: measured.accepted ? point : null, reasons: measured.reasons };
}
