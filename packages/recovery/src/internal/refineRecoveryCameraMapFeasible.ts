import type {
  IAutoMovieRecoveryCameraMapBudget,
  IAutoMovieRecoveryCameraMapPolicy,
} from "@automovie/interface/recovery";

import type { IAutoMovieRecoveryCurvatureReport } from "../structures/image/IAutoMovieRecoveryCurvatureReport";
import type { IAutoMovieRecoveryMapLandmark } from "../structures/image/IAutoMovieRecoveryMapLandmark";
import type { IAutoMovieRecoveryMapPose } from "../structures/image/IAutoMovieRecoveryMapPose";
import type { IAutoMovieRecoveryRegularizationReport } from "../structures/image/IAutoMovieRecoveryRegularizationReport";
import type { IAutoMovieRecoveryCurvatureAdmission } from "../structures/internal/IAutoMovieRecoveryCurvatureAdmission";
import type { IAutoMovieRecoveryFeasibleJointOptions } from "../structures/internal/IAutoMovieRecoveryFeasibleJointOptions";
import type { IAutoMovieRecoveryFeasibleMapWork } from "../structures/internal/IAutoMovieRecoveryFeasibleMapWork";
import type { IAutoMovieRecoveryFeasibleModel } from "../structures/internal/IAutoMovieRecoveryFeasibleModel";
import type { IAutoMovieRecoveryMapCurvatureBlocks } from "../structures/internal/IAutoMovieRecoveryMapCurvatureBlocks";
import type { IAutoMovieRecoveryMapCurvatureFit } from "../structures/internal/IAutoMovieRecoveryMapCurvatureFit";
import type { IAutoMovieRecoveryMapJointBlock } from "../structures/internal/IAutoMovieRecoveryMapJointBlock";
import type { IAutoMovieRecoveryMapJointResult } from "../structures/internal/IAutoMovieRecoveryMapJointResult";
import type { IAutoMovieRecoveryMapState } from "../structures/internal/IAutoMovieRecoveryMapState";
import type { IAutoMovieRecoveryUntiltedEstimate } from "../structures/internal/IAutoMovieRecoveryUntiltedEstimate";
import { admitRecoveryMapCurvature } from "./admitRecoveryMapCurvature";
import { assembleRecoveryMapCurvature } from "./assembleRecoveryMapCurvature";
import { copyRecoveryUntiltedEstimate } from "./copyRecoveryUntiltedEstimate";
import { createRecoveryMapTangent } from "./createRecoveryMapTangent";
import { evaluateRecoveryScenePoint } from "./evaluateRecoveryScenePoint";
import { factorRecoveryMapCurvature } from "./factorRecoveryMapCurvature";
import { factorRecoveryMapMetric } from "./factorRecoveryMapMetric";
import { linearizeRecoveryFeasibleMap } from "./linearizeRecoveryFeasibleMap";
import { predictRecoveryMapDecrease } from "./predictRecoveryMapDecrease";
import { prepareRecoveryFeasibleMapWork } from "./prepareRecoveryFeasibleMapWork";
import { projectRecoveryMapPoint } from "./projectRecoveryMapPoint";
import { refineRecoveryFeasibleState } from "./refineRecoveryFeasibleState";
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
 * @evidence contracts/common.md#principled-implementation Original point and reduced-camera ranks precede GN metric formation. Requested lagged curvature starts with GN, copies only a selected model's complete-affine-qualified original untilted dual, and may form a fixed-lagged local loss/disk Hessian on the next existing model. A complete computed point/Schur factor and all fixed rows must qualify before return, otherwise whole GN is used. Physical SO3/sphere/Euclidean retraction, complete gates and original normal KKT remain independent.
 * @evidence contracts/common.md#clear-and-simple-design This camera owner connects generic bounded direction work to the actual projection, rank, gauge, observation identities and joint report; ordinary public calls retain the existing method until explicitly selected internally.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No observation deletion, failed-point filtering, new pixel tolerance, extra nonlinear trial allowance, initial-state success fallback or independent later-translation normalization supplies an accepted map. Data rank is checked without damping or inequalities.
 * @evidence contracts/common.md#meaningful-documentation States normalized disks, physical KKT tolerance1e-8 and initial damping1e-3 per fit. Lagged requires explicit SQP and is independent of adaptive agreement. Null clears old seeds; qualified empty is valid, and qualification is independent of mixed/path support. Seed normalization curvature uses the anchored numerical chart t+N(t+Bz)-N(t), preserving original f/A/actual retraction. No intended-Hessian accuracy, condition or finite-trial theorem follows. After model return factor/rows are fixed and action/core errors propagate without late GN. Invalid computed agreement retains the previous coefficient.
 * @evidence contracts/performance.md#efficient-algorithms Original model QR/SVD, row construction/ownership scans, whitening and full actions retain the conservative full-LS model envelope, whose unused damped-normalized SVD/answers and point back substitution remain omitted in metric-only mode. Shared triangular ownership adds O(C^2+n+Zphysical+C+L), without changing GN numerical accumulation. Requested setup prepays512, every requested existing model32, and selected owned dual copying64(H+1), independently of generic wrapper32. Each eligible seeded model prepays131072(E+1)+128(LC^2+C^3+EC^2+LC+C^2+n+E+1) for one additional current-state derivative/scatter/factor/complete-row pass, including all failed prefixes and validation. No extra nonlinear actual trial/model/evaluate is made. Adaptive agreement separately prepays32*(E*(C+4)+n+L+1) for original-design selected-u prediction.
 * @evidence contracts/performance.md#reuse-equivalent-work Current weighted blocks supply original rank and one arrowhead metric shared by every current inequality. Actual evaluation borrows each complete point-gate projection's residual norm for the same global cost/SSE accumulation, discarding partial sums on any gate refusal and checking objective finiteness only after every point passes. Backtracks retain the model without repeated image extraction or matching.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Base retention admits borrowed/current states, four candidates, chosen increments, physical/metric rows and GN factors. Requested F256 is mandatory before records; eligible mode additionally retains S=4E+256 and A=8(C^2+3LC+9L+Zw+n+E+1)+8192 through generic/aux/terminal admission, with A also below maxLinearEntries and unchanged sparse row/materialization limits. S admits old/new owned dual overlap. A admits simultaneous GN/curvature/partial rows and fixed local scratch; partial optional and unused GN buffers actually expire before direction work without refunding reservations. Adaptive weighted-design retention remains separate and releases after selection. Only plain regularization/curvature scalars transfer; no dual/factor/history escapes the fit.
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
  const lagged: boolean = options.laggedLagrangianMetric === true;
  if (lagged && options.sqpAcceleration !== true)
    throw new Error(
      "camera-curvature: lagged metric requires explicit SQP acceleration",
    );
  const {
    observations,
    cameraWidth,
    width,
    adaptive,
    agreementWork,
    retained,
    evaluationWork,
    modelWork,
  }: IAutoMovieRecoveryFeasibleMapWork = prepareRecoveryFeasibleMapWork(
    initialPoses,
    initialLandmarks,
    intrinsics,
    budget,
    options,
    charge,
  );
  const curvatureAdmission: IAutoMovieRecoveryCurvatureAdmission | null = lagged
    ? admitRecoveryMapCurvature(
        cameraWidth,
        initialLandmarks.length,
        observations,
        retained,
        options.maxResidentLinearEntries,
        budget.maxLinearEntries,
        charge,
      )
    : null;
  const curvature: IAutoMovieRecoveryCurvatureReport | null =
    curvatureAdmission === null
      ? null
      : {
          eligible: curvatureAdmission.eligible,
          models: 0,
          capacity: 0,
          noSeed: 0,
          attempted: 0,
          supported: 0,
          refused: 0,
          latestReason: null,
        };
  let seed: IAutoMovieRecoveryUntiltedEstimate | null = null;
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
  const regularization: IAutoMovieRecoveryRegularizationReport | null = adaptive
    ? {
        initialDamping: damping,
        finalDamping: damping,
        supportedUpdates: 0,
        unsupportedUpdates: 0,
        lastUpdate: null,
      }
    : null;
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
          cost +=
            norm * (norm / (Math.hypot(1, norm / policy.lossScalePx) + 1));
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
        if (lagged) {
          charge(32);
          curvature!.models++;
        }
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
        let metric: (typeof solution)["metric"] = solution.metric;
        let rows: IAutoMovieRecoveryFeasibleModel["rows"] | null = null;
        if (curvature !== null) {
          if (!curvatureAdmission!.eligible) {
            curvature.capacity++;
            curvature.latestReason = "capacity";
          } else if (seed === null) {
            curvature.noSeed++;
            curvature.latestReason = "no-seed";
          } else {
            charge(curvatureAdmission!.work);
            curvature.attempted++;
            const blocks: IAutoMovieRecoveryMapCurvatureBlocks | null =
              assembleRecoveryMapCurvature(
                state,
                intrinsics,
                policy,
                seed,
                solution,
                damping,
              );
            const optional: IAutoMovieRecoveryMapCurvatureFit =
              blocks === null
                ? {
                    metric: null,
                    rows: null,
                    reason: "local-formation",
                  }
                : factorRecoveryMapCurvature(
                    blocks,
                    solution.cameraScales,
                    solution.pointScales,
                    local.rows,
                  );
            curvature.latestReason = optional.reason;
            if (optional.metric !== null && optional.rows !== null) {
              metric = optional.metric;
              rows = optional.rows;
              curvature.supported++;
            } else curvature.refused++;
          }
        }
        if (adaptive) {
          currentBlocks = local.blocks;
          currentGradient = local.rows[0]!.values;
          currentBase = state;
        }
        return {
          rows: rows ?? local.rows.map(metric.whiten),
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
      constraintValues:
        options.sqpAcceleration === true
          ? (
              state: IAutoMovieRecoveryMapState,
              selected: readonly number[],
            ): number[] | null => {
              charge(32 * (observations + width + selected.length));
              if (
                selected.some(
                  (row: number, at: number): boolean =>
                    !Number.isSafeInteger(row) ||
                    row < 1 ||
                    row > observations ||
                    (at > 0 && row <= selected[at - 1]!),
                )
              )
                throw new Error(
                  "camera-sqp: ordered original inequality rows required",
                );
              if (
                Math.abs(Math.hypot(...state.poses[1]!.translation) - 1) > 1e-10
              )
                return null;
              const values: number[] = [];
              let row: number = 0,
                at: number = 0;
              for (const landmark of state.landmarks)
                for (const observation of landmark.observations) {
                  row++;
                  if (selected[at] !== row) continue;
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
                  const value: number =
                    (norm / policy.maximumReprojectionErrorPx) ** 2 - 1;
                  if (!Number.isFinite(value)) return null;
                  values.push(value);
                  at++;
                }
              if (values.length !== selected.length)
                throw new Error(
                  "camera-sqp: unchanged original observation population required",
                );
              return values;
            }
          : undefined,
      requestUntiltedEstimate:
        curvatureAdmission?.eligible === true ? true : undefined,
      accepted:
        adaptive || lagged
          ? (
              base: IAutoMovieRecoveryMapState,
              increment: readonly number[],
              oldCost: number,
              newCost: number,
              estimate?: IAutoMovieRecoveryUntiltedEstimate | null,
            ): void => {
              if (curvatureAdmission?.eligible === true) {
                if (estimate === undefined)
                  throw new Error(
                    "camera-curvature: explicitly requested current estimate required",
                  );
                seed = copyRecoveryUntiltedEstimate(
                  estimate,
                  width,
                  observations + 1,
                  charge,
                );
              }
              if (adaptive) {
                charge(agreementWork);
                if (
                  currentBase !== base ||
                  currentBlocks === null ||
                  currentGradient === null ||
                  increment.length !== width ||
                  !(
                    Number.isFinite(oldCost) &&
                    Number.isFinite(newCost) &&
                    newCost < oldCost
                  )
                )
                  throw new Error(
                    "camera-regularization: selected current-base actual decrease required",
                  );
                const prediction: number | null = predictRecoveryMapDecrease(
                  currentBlocks,
                  currentGradient,
                  increment,
                );
                const update: NonNullable<
                  IAutoMovieRecoveryRegularizationReport["lastUpdate"]
                > = updateRecoveryRegularization(
                  damping,
                  oldCost - newCost,
                  prediction,
                );
                damping = update.damping;
                regularization!.finalDamping = damping;
                if (update.supported) regularization!.supportedUpdates++;
                else regularization!.unsupportedUpdates++;
                regularization!.lastUpdate = update;
                currentBlocks = null;
                currentGradient = null;
                currentBase = null;
              }
            }
          : undefined,
    },
    budget.maxRefinementIterations,
    1e-8,
    options.directionBudget,
    checkpoint,
    charge,
    options.sqpAcceleration === true
      ? {
          maxSweeps: budget.maxSingularSweeps,
          minimumSingularRatio: policy.minimumDesignSingularRatio,
          maxEntries: options.directionBudget.maxEntries,
          maxResidentEntries: options.maxResidentLinearEntries,
          retainedEntries: curvatureAdmission?.retainedEntries ?? retained,
          maxWork: options.directionBudget.maxWork,
        }
      : undefined,
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
      ...(regularization === null
        ? {}
        : { regularization: { ...regularization } }),
      ...(curvature === null ? {} : { curvature: { ...curvature } }),
    },
  };
}
