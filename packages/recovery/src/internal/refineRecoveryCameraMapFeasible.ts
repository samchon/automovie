import type {
  IAutoMovieRecoveryCameraMapBudget,
  IAutoMovieRecoveryCameraMapPolicy,
} from "@automovie/interface/recovery";

import type { IAutoMovieRecoveryMapLandmark } from "../structures/image/IAutoMovieRecoveryMapLandmark";
import type { IAutoMovieRecoveryMapPose } from "../structures/image/IAutoMovieRecoveryMapPose";
import type { IAutoMovieRecoveryRegularizationReport } from "../structures/image/IAutoMovieRecoveryRegularizationReport";
import type { IAutoMovieRecoveryMapJointBlock } from "../structures/internal/IAutoMovieRecoveryMapJointBlock";
import type { IAutoMovieRecoveryFeasibleJointOptions } from "../structures/internal/IAutoMovieRecoveryFeasibleJointOptions";
import type { IAutoMovieRecoveryFeasibleModel } from "../structures/internal/IAutoMovieRecoveryFeasibleModel";
import type { IAutoMovieRecoveryMapJointResult } from "../structures/internal/IAutoMovieRecoveryMapJointResult";
import type { IAutoMovieRecoveryMapState } from "../structures/internal/IAutoMovieRecoveryMapState";
import { createRecoveryMapTangent } from "./createRecoveryMapTangent";
import { evaluateRecoveryScenePoint } from "./evaluateRecoveryScenePoint";
import { linearizeRecoveryFeasibleMap } from "./linearizeRecoveryFeasibleMap";
import { projectRecoveryMapPoint } from "./projectRecoveryMapPoint";
import { predictRecoveryMapDecrease } from "./predictRecoveryMapDecrease";
import { refineRecoveryFeasibleState } from "./refineRecoveryFeasibleState";
import { factorRecoveryMapMetric } from "./factorRecoveryMapMetric";
import { stepRecoveryMapPose } from "./stepRecoveryMapPose";
import { stepRecoveryRelativePose } from "./stepRecoveryRelativePose";
import { updateRecoveryRegularization } from "./updateRecoveryRegularization";

/**
 * Refine a fixed camera map while retaining every hard pixel observation.
 * This internal opt-in method uses the same robust objective, seven-freedom
 * gauge, independent original ranks and actual point qualification. Pixel KKT
 * is claimed only while nonpixel gates remain strictly interior; other gate
 * blockage is incomplete, and the coordinator still owns atomic acceptance.
 *
 * @evidence contracts/common.md#principled-implementation Original point and reduced-camera rank qualification precedes the raw damped point-first QR metric, without synthesizing unused unconstrained LS answers. Pure tilted directions, actual SO3/sphere/Euclidean retraction and complete point gates remain independent. Optional selected-increment agreement prepares only the next existing metric; original-coordinate normal KKT alone terminates normally.
 * @evidence contracts/common.md#clear-and-simple-design This camera owner connects generic bounded direction work to the actual projection, rank, gauge, observation identities and joint report; ordinary public calls retain the existing method until explicitly selected internally.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No observation deletion, failed-point filtering, new pixel tolerance, extra nonlinear trial allowance, initial-state success fallback or independent later-translation normalization supplies an accepted map. Data rank is checked without damping or inequalities.
 * @evidence contracts/common.md#meaningful-documentation States normalized disks, physical KKT tolerance1e-8, initial damping1e-3 per fit and optional next-model reactions. Metric support requires original rank and finite used raw factors/actions, not the full LS operation's additional unused normalization/SVD/answer support. No such omitted computation is caught as success. Invalid computed agreement retains the previous coefficient; actual qualification and core errors remain independent.
 * @evidence contracts/performance.md#efficient-algorithms For E observations, L landmarks and C=6N-7 camera columns, metric QR/SVD costs O(E*C^2+S*C^3), whitening O(E*C^2+L*C), sparse passes O(E*C+L), and full point gates sum(k_point^2). Optional working factors add O(S*(q+H)*H^2+q*H^2). Accepted agreement separately precharges32*(E*(C+4)+n+L+1) for one current-design prediction, without another factor, geometry trial or model.
 * @evidence contracts/performance.md#reuse-equivalent-work Current weighted blocks supply original rank and one arrowhead metric shared by every current inequality. Actual evaluation borrows each complete point-gate projection's residual norm for the same global cost/SSE accumulation, discarding partial sums on any gate refusal and checking objective finiteness only after every point passes. Backtracks retain the model without repeated image extraction or matching.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Before copying, the owner admits borrowed/current states, four candidates and chosen increments beside rows, factors and optional working space. Adaptive mode additionally admits4*E*(C+4)+8*n+256 slots for current weighted blocks/gradient and bounded reaction metadata, releasing design references immediately after the selected-step reaction. Candidate roles alias existing states; only scalar regularization metadata transfers, without geometry history or handles.
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
  const adaptive: boolean = options.adaptiveRegularization === true;
  const agreementEntries: number = adaptive ? 4 * observations * (cameraWidth + 4) + 8 * width + 256 : 0;
  const agreementWork: number = adaptive ? 32 * (observations * (cameraWidth + 4) + width + points + 1) : 0;
  // Every whitened pixel row has at most C camera and three point entries;
  // the dense objective has width entries. Reserve both result step copies.
  const directionCoefficients: number = width + observations * (cameraWidth + 3);
  const directionRows: number = observations + 1;
  const directionEntries: number = 2 * directionCoefficients + 3 * directionRows + 2 * width + 128;
  const minimumDirectionWork: number = 288 * directionCoefficients + 1058 * directionRows + 137 * width + 1025;
  // Four detached pose/point records need at most48V+16L scalars. The two
  // additionally retained best/mixed increments need2n=12V+6L-14; their
  // total60V+22L is below64*(E+L+V+1). The current increment is in16n.
  const retained: number =
    24 * observations * (cameraWidth + 20) +
    24 * cameraWidth * cameraWidth +
    24 * points * (cameraWidth + 4) +
    16 * width + 128 +
    64 * (observations + points + cameras + 1) + agreementEntries;
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
    (adaptive && (!Number.isSafeInteger(agreementEntries) || agreementEntries <= 0 ||
      !Number.isSafeInteger(agreementWork) || agreementWork <= 0)) ||
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
  let damping: number = 1e-3;
  let currentBlocks: readonly IAutoMovieRecoveryMapJointBlock[] | null = null;
  let currentGradient: readonly number[] | null = null;
  let currentBase: IAutoMovieRecoveryMapState | null = null;
  const regularization: IAutoMovieRecoveryRegularizationReport | null = adaptive ? {
    initialDamping: damping, finalDamping: damping,
    supportedUpdates: 0, unsupportedUpdates: 0, lastUpdate: null,
  } : null;
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
        const observe: (norm: number) => void = (norm: number): void => {
          cost += norm * (norm / (Math.hypot(1, norm / policy.lossScalePx) + 1));
          square += norm * norm;
        };
        for (const landmark of state.landmarks) {
          const qualification: ReturnType<typeof evaluateRecoveryScenePoint> =
            evaluateRecoveryScenePoint(
              landmark.point,
              landmark.observations,
              state.poses,
              charts,
              policy,
              observe,
            );
          if (
            !qualification.accepted ||
            !(
              qualification.acuteParallaxDegrees! >
              policy.minimumPointParallaxDegrees
            )
          )
            return null;
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
        const solution: ReturnType<typeof factorRecoveryMapMetric> =
          factorRecoveryMapMetric(
            local.blocks,
            policy.minimumDesignSingularRatio,
            damping,
            budget,
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
        const metric: (typeof solution)["metric"] = solution.metric;
        if (adaptive) {
          currentBlocks = local.blocks;
          currentGradient = local.rows[0]!.values;
          currentBase = state;
        }
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
      accepted: adaptive ? (
        base: IAutoMovieRecoveryMapState, increment: readonly number[], oldCost: number, newCost: number,
      ): void => {
        charge(agreementWork);
        if (currentBase !== base || currentBlocks === null || currentGradient === null ||
            increment.length !== width || !(Number.isFinite(oldCost) && Number.isFinite(newCost) && newCost < oldCost))
          throw new Error("camera-regularization: selected current-base actual decrease required");
        const prediction: number | null = predictRecoveryMapDecrease(currentBlocks, currentGradient, increment);
        const update: NonNullable<IAutoMovieRecoveryRegularizationReport["lastUpdate"]> =
          updateRecoveryRegularization(damping, oldCost - newCost, prediction);
        damping = update.damping;
        regularization!.finalDamping = damping;
        if (update.supported) regularization!.supportedUpdates++;
        else regularization!.unsupportedUpdates++;
        regularization!.lastUpdate = update;
        currentBlocks = null;
        currentGradient = null;
        currentBase = null;
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
      ...(regularization === null ? {} : { regularization: { ...regularization } }),
    },
  };
}
