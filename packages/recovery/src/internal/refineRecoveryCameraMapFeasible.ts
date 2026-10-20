import type {
  IAutoMovieRecoveryCameraMapBudget,
  IAutoMovieRecoveryCameraMapPolicy,
} from "@automovie/interface/recovery";

import type { IAutoMovieRecoveryMapLandmark } from "../structures/image/IAutoMovieRecoveryMapLandmark";
import type { IAutoMovieRecoveryMapPose } from "../structures/image/IAutoMovieRecoveryMapPose";
import type { IAutoMovieRecoveryFeasibleJointOptions } from "../structures/internal/IAutoMovieRecoveryFeasibleJointOptions";
import type { IAutoMovieRecoveryFeasibleModel } from "../structures/internal/IAutoMovieRecoveryFeasibleModel";
import type { IAutoMovieRecoveryMapJointResult } from "../structures/internal/IAutoMovieRecoveryMapJointResult";
import type { IAutoMovieRecoveryMapState } from "../structures/internal/IAutoMovieRecoveryMapState";
import { createRecoveryMapTangent } from "./createRecoveryMapTangent";
import { evaluateRecoveryScenePoint } from "./evaluateRecoveryScenePoint";
import { linearizeRecoveryFeasibleMap } from "./linearizeRecoveryFeasibleMap";
import { projectRecoveryMapPoint } from "./projectRecoveryMapPoint";
import { refineRecoveryFeasibleState } from "./refineRecoveryFeasibleState";
import { solveRecoveryMapJointStep } from "./solveRecoveryMapJointStep";
import { stepRecoveryMapPose } from "./stepRecoveryMapPose";
import { stepRecoveryRelativePose } from "./stepRecoveryRelativePose";

/**
 * Refine a fixed camera map while retaining every hard pixel observation.
 * This internal opt-in method uses the same robust objective, seven-freedom
 * gauge, independent original ranks and actual point qualification. Pixel KKT
 * is claimed only while nonpixel gates remain strictly interior; other gate
 * blockage is incomplete, and the coordinator still owns atomic acceptance.
 *
 * @evidence contracts/common.md#principled-implementation A rank-qualified column-scaled point-first QR supplies an invertible damped metric. The pure tilted model gives objective descent and active-pixel inwardness, followed by actual SO3/sphere/Euclidean retraction and complete point gates. Original-coordinate normal KKT, not a tiny step or cost stop, terminates this method.
 * @evidence contracts/common.md#clear-and-simple-design This camera owner connects generic bounded direction work to the actual projection, rank, gauge, observation identities and joint report; ordinary public calls retain the existing method until explicitly selected internally.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No observation deletion, failed-point filtering, new pixel tolerance, extra nonlinear trial allowance, initial-state success fallback or independent later-translation normalization supplies an accepted map. Data rank is checked without damping or inequalities.
 * @evidence contracts/common.md#meaningful-documentation States normalized disk model, physical KKT tolerance 1e-8, fixed positive metric damping 1e-3, strict nonpixel-interior limitation, same-population objective and incomplete termination.
 * @evidence contracts/performance.md#efficient-algorithms For E observations, L landmarks and C=6N-7 camera columns, metric QR/SVD costs O(E*C^2+S*C^3), whitening O(E*C^2+L*C), sparse passes O(E*C+L), and full point gates sum(k_point^2). Optional q-by-H original working transpose adds O(S*(q+H)*H^2+q*H^2); its admitted inverse actions, selected-trial projections and every actual arc/backtrack also consume original work/trial ceilings.
 * @evidence contracts/performance.md#reuse-equivalent-work The current weighted blocks supply original rank and one arrowhead metric shared by every current inequality. Backtracks retain this model until a feasible state is accepted; no image extraction, matching or prior fitted answer is repeated.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The owner first admits borrowed/current states plus four detached candidates, blocks, current metric and physical/whitened rows. Optional working factor copies, coordinates, step/correction and trial g arrays are then jointly admitted against the remaining same resident/direction ceiling before allocation. Candidate slots alias best/current roles; no image, native reactor or history is retained.
 */
export function refineRecoveryCameraMapFeasible(
  initialPoses: readonly IAutoMovieRecoveryMapPose[],
  initialLandmarks: readonly IAutoMovieRecoveryMapLandmark[],
  intrinsics: readonly (readonly number[])[],
  policy: IAutoMovieRecoveryCameraMapPolicy,
  budget: IAutoMovieRecoveryCameraMapBudget,
  options: IAutoMovieRecoveryFeasibleJointOptions,
  checkpoint: () => void,
  charge: (work: number) => void,
): IAutoMovieRecoveryMapJointResult {
  const cameras: number = initialPoses.length;
  const points: number = initialLandmarks.length;
  if (points < 6 || cameras < 2 || points > budget.maxTracks || !Number.isSafeInteger(4 * points))
    throw new Error("camera-feasible: bounded landmark metadata required");
  charge(4 * points);
  const observations: number = initialLandmarks.reduce(
    (sum: number, landmark: IAutoMovieRecoveryMapLandmark): number =>
      sum + landmark.observations.length,
    0,
  );
  const cameraWidth: number = 6 * cameras - 7;
  const width: number = cameraWidth + 3 * points;
  // Every whitened pixel row has at most C camera and three point entries;
  // the dense objective has width entries. Reserve both result step copies.
  const directionCoefficients: number = width + observations * (cameraWidth + 3);
  const directionRows: number = observations + 1;
  const directionEntries: number = 2 * directionCoefficients + 3 * directionRows + 2 * width + 128;
  const minimumDirectionWork: number = 288 * directionCoefficients + 1058 * directionRows + 137 * width + 1025;
  // Four detached candidates share observations with the current state; this
  // additional conservative scalar reserve also covers fully copied rows.
  const retained: number =
    24 * observations * (cameraWidth + 20) +
    24 * cameraWidth * cameraWidth +
    24 * points * (cameraWidth + 4) +
    16 * width + 128 +
    64 * (observations + points + cameras + 1);
  const evaluationWork: number =
    8 * observations * (cameraWidth + 4) +
    32 *
      initialLandmarks.reduce(
        (sum: number, landmark: IAutoMovieRecoveryMapLandmark): number =>
          sum + landmark.observations.length ** 2,
        0,
      );
  const modelWork: number =
    12 * observations * (cameraWidth + 4) +
    8 * observations * cameraWidth * cameraWidth +
    12 * points * (cameraWidth + 4) +
    4 * (2 * observations + points) * cameraWidth * cameraWidth +
    4 * budget.maxSingularSweeps * cameraWidth ** 3 +
    54 * budget.maxSingularSweeps * (observations + points);
  if (
    cameras < 2 ||
    intrinsics.length !== cameras ||
    points < 6 ||
    points > budget.maxTracks ||
    observations > budget.maxObservations ||
    ![
      retained,
      evaluationWork,
      modelWork,
      options.maxResidentLinearEntries,
      directionCoefficients, directionEntries, minimumDirectionWork,
      options.directionBudget.maxEntries, options.directionBudget.maxIterations,
      options.directionBudget.maxWork,
    ].every(
      (value: number): boolean => Number.isSafeInteger(value) && value > 0,
    ) ||
    retained > options.maxResidentLinearEntries ||
    directionEntries > options.directionBudget.maxEntries ||
    minimumDirectionWork > options.directionBudget.maxWork ||
    initialPoses[0]!.rotation.length !== 9 ||
    initialPoses[0]!.rotation.some(
      (value: number, at: number): boolean =>
        value !== (at === 0 || at === 4 || at === 8 ? 1 : 0),
    ) ||
    initialPoses[0]!.translation.some((value: number): boolean => value !== 0)
  )
    throw new Error(
      "camera-feasible: bounded full-population identity gauge required",
    );
  const initial: IAutoMovieRecoveryMapState = structuredClone({
    poses: initialPoses.slice(),
    landmarks: initialLandmarks.slice(),
  });
  const charts: Parameters<typeof evaluateRecoveryScenePoint>[3] =
    intrinsics.map((matrix: readonly number[]): (typeof charts)[number] => ({
      matrix: matrix.slice(),
    }));
  let minimumPointDesignRatio: number = Infinity,
    minimumCameraDesignRatio: number = Infinity;
  let initialSquaredError: number | null = null;
  const squared: (state: IAutoMovieRecoveryMapState) => number = (
    state: IAutoMovieRecoveryMapState,
  ): number => {
    let total: number = 0;
    for (const landmark of state.landmarks)
      for (const observation of landmark.observations) {
        const projected: ReturnType<typeof projectRecoveryMapPoint> =
          projectRecoveryMapPoint(
            state.poses[observation.viewIndex]!,
            landmark.point,
            intrinsics[observation.viewIndex]!,
          );
        if (projected === null)
          throw new Error("camera-feasible: final positive depth required");
        total +=
          Math.hypot(
            projected.pixel[0] - observation.pixel[0],
            projected.pixel[1] - observation.pixel[1],
          ) ** 2;
      }
    return total;
  };
  const fit: ReturnType<
    typeof refineRecoveryFeasibleState<IAutoMovieRecoveryMapState>
  > = refineRecoveryFeasibleState(
    {
      initial,
      evaluate: (state: IAutoMovieRecoveryMapState): number | null => {
        charge(evaluationWork);
        if (Math.abs(Math.hypot(...state.poses[1]!.translation) - 1) > 1e-10)
          return null;
        let cost: number = 0,
          square: number = 0;
        for (const landmark of state.landmarks) {
          const qualification: ReturnType<typeof evaluateRecoveryScenePoint> =
            evaluateRecoveryScenePoint(
              landmark.point,
              landmark.observations,
              state.poses,
              charts,
              policy,
            );
          if (
            !qualification.accepted ||
            !(
              qualification.acuteParallaxDegrees! >
              policy.minimumPointParallaxDegrees
            )
          )
            return null;
          for (const observation of landmark.observations) {
            const projected: ReturnType<typeof projectRecoveryMapPoint> =
              projectRecoveryMapPoint(
                state.poses[observation.viewIndex]!,
                landmark.point,
                intrinsics[observation.viewIndex]!,
              );
            if (projected === null) return null;
            const norm: number = Math.hypot(
              projected.pixel[0] - observation.pixel[0],
              projected.pixel[1] - observation.pixel[1],
            );
            cost +=
              norm * (norm / (Math.hypot(1, norm / policy.lossScalePx) + 1));
            square += norm * norm;
          }
        }
        if (!Number.isFinite(cost) || !Number.isFinite(square))
          throw new Error("camera-feasible: nonrepresentable actual objective");
        initialSquaredError ??= square;
        return cost;
      },
      linearize: (
        state: IAutoMovieRecoveryMapState,
      ): IAutoMovieRecoveryFeasibleModel => {
        charge(modelWork);
        const local: ReturnType<typeof linearizeRecoveryFeasibleMap> =
          linearizeRecoveryFeasibleMap(state, intrinsics, policy);
        const solution: ReturnType<typeof solveRecoveryMapJointStep> =
          solveRecoveryMapJointStep(
            local.blocks,
            policy.minimumDesignSingularRatio,
            1e-3,
            budget,
            true,
          );
        minimumPointDesignRatio = Math.min(
          minimumPointDesignRatio,
          solution.minimumPointDesignRatio,
        );
        minimumCameraDesignRatio = Math.min(
          minimumCameraDesignRatio,
          solution.cameraDesignRatio,
        );
        if (
          !(
            solution.minimumPointDesignRatio > policy.minimumDesignSingularRatio
          ) ||
          !(solution.cameraDesignRatio > policy.minimumDesignSingularRatio)
        )
          throw new Error(
            "camera-feasible: strict original-rank interior required",
          );
        const metric: NonNullable<(typeof solution)["metric"]> =
          solution.metric!;
        return {
          rows: local.rows.map(metric.whiten),
          physicalRows: local.rows,
          width,
          fromMetric: metric.unwhiten,
          toPhysicalCovector: metric.toPhysicalCovector,
        };
      },
      retract: (
        state: IAutoMovieRecoveryMapState,
        step: readonly number[],
      ): IAutoMovieRecoveryMapState => {
        charge(8 * (width + observations));
        return {
          poses: [
            state.poses[0]!,
            stepRecoveryRelativePose(
              state.poses[1]!,
              createRecoveryMapTangent(state.poses[1]!.translation),
              step.slice(0, 5),
            ),
            ...state.poses
              .slice(2)
              .map(
                (
                  pose: IAutoMovieRecoveryMapPose,
                  at: number,
                ): IAutoMovieRecoveryMapPose =>
                  stepRecoveryMapPose(
                    pose,
                    step.slice(5 + 6 * at, 11 + 6 * at),
                  ),
              ),
          ],
          landmarks: state.landmarks.map(
            (
              landmark: IAutoMovieRecoveryMapLandmark,
              at: number,
            ): IAutoMovieRecoveryMapLandmark => ({
              ...landmark,
              point: landmark.point.map(
                (value: number, axis: number): number =>
                  value + step[cameraWidth + 3 * at + axis]!,
              ) as [number, number, number],
            }),
          ),
        };
      },
      constraintValues: options.sqpAcceleration === true ? (
        state: IAutoMovieRecoveryMapState,
        selected: readonly number[],
      ): number[] | null => {
        charge(32 * (observations + width + selected.length));
        if (selected.some((row: number, at: number): boolean =>
          !Number.isSafeInteger(row) || row < 1 || row > observations ||
          (at > 0 && row <= selected[at - 1]!),
        )) throw new Error("camera-sqp: ordered original inequality rows required");
        if (Math.abs(Math.hypot(...state.poses[1]!.translation) - 1) > 1e-10)
          return null;
        const values: number[] = [];
        let row: number = 0, at: number = 0;
        for (const landmark of state.landmarks)
          for (const observation of landmark.observations) {
            row++;
            if (selected[at] !== row) continue;
            const projected: ReturnType<typeof projectRecoveryMapPoint> =
              projectRecoveryMapPoint(state.poses[observation.viewIndex]!, landmark.point, intrinsics[observation.viewIndex]!);
            if (projected === null) return null;
            const norm: number = Math.hypot(
              projected.pixel[0] - observation.pixel[0], projected.pixel[1] - observation.pixel[1],
            );
            const value: number = (norm / policy.maximumReprojectionErrorPx) ** 2 - 1;
            if (!Number.isFinite(value)) return null;
            values.push(value);
            at++;
          }
        if (values.length !== selected.length)
          throw new Error("camera-sqp: unchanged original observation population required");
        return values;
      } : undefined,
    },
    budget.maxRefinementIterations,
    1e-8,
    options.directionBudget,
    checkpoint,
    charge,
    options.sqpAcceleration === true ? {
      maxSweeps: budget.maxSingularSweeps,
      minimumSingularRatio: policy.minimumDesignSingularRatio,
      maxEntries: options.directionBudget.maxEntries,
      maxResidentEntries: options.maxResidentLinearEntries,
      retainedEntries: retained,
      maxWork: options.directionBudget.maxWork,
    } : undefined,
  );
  charge(evaluationWork);
  return {
    ...fit.state,
    report: {
      converged: fit.converged,
      termination: fit.termination === "kkt" ? "pixel-kkt" : fit.termination,
      iterations: fit.iterations,
      acceptedSteps: fit.acceptedSteps,
      observationCount: observations,
      initialCost: fit.initialCost,
      finalCost: fit.finalCost,
      initialSquaredError: initialSquaredError!,
      finalSquaredError: squared(fit.state),
      minimumCameraDesignRatio,
      minimumPointDesignRatio,
    },
  };
}
