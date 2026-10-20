import type {
  IAutoMovieRecoveryCameraMapBudget,
  IAutoMovieRecoveryCameraMapPolicy,
} from "@automovie/interface/recovery";

import type { IAutoMovieRecoveryMapLandmark } from "../structures/image/IAutoMovieRecoveryMapLandmark";
import type { IAutoMovieRecoveryMapPose } from "../structures/image/IAutoMovieRecoveryMapPose";
import type { IAutoMovieRecoveryFeasibleJointOptions } from "../structures/internal/IAutoMovieRecoveryFeasibleJointOptions";
import type { IAutoMovieRecoveryMapJointResult } from "../structures/internal/IAutoMovieRecoveryMapJointResult";
import type { IAutoMovieRecoveryMapJointBlock } from "../structures/internal/IAutoMovieRecoveryMapJointBlock";
import type { IAutoMovieRecoveryMapEvaluation } from "../structures/internal/IAutoMovieRecoveryMapEvaluation";
import { createRecoveryMapTangent } from "./createRecoveryMapTangent";
import { projectRecoveryMapPoint } from "./projectRecoveryMapPoint";
import { refineRecoveryCameraMapFeasible } from "./refineRecoveryCameraMapFeasible";
import { solveRecoveryMapJointStep } from "./solveRecoveryMapJointStep";
import { stepRecoveryMapPose } from "./stepRecoveryMapPose";
import { stepRecoveryRelativePose } from "./stepRecoveryRelativePose";

/**
 * Jointly refine calibrated cameras and registered landmarks in one gauge.
 * The first pose must be identity at the origin and stays fixed; the seed
 * translation remains on its unit sphere,
 * and all later translations have three unrestricted coordinates. Fixed landmark
 * observations retain the same robust objective throughout every trial.
 * Internal feasible options select the separately bounded hard-pixel method;
 * ordinary calls retain this unconstrained local optimizer.
 *
 * @evidence contracts/common.md#principled-implementation Analytic pinhole derivatives, complete-vector soft-L1 weights and original-design point-local QR solve C=6N-7 gauge-fixed camera coordinates. Independent point/reduced-camera ranks precede damping, and actual same-population descent accepts an SO3/sphere/Euclidean retraction.
 * @evidence contracts/common.md#clear-and-simple-design This nonlinear owner keeps fixed population, gauge, damping and local termination together; projection and block-linear algebra have separate numerical owners, and final map qualification belongs to the coordinator.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No first/second full-pose double anchoring, independent normalization of third translation, covariance claim, dropped measurement or damping-derived rank supplies a map. Nonpositive trial depths reject the step, and iteration exhaustion remains nonconverged.
 * @evidence contracts/common.md#meaningful-documentation States seven removed gauge freedoms, fixed known calibration, robust vector weighting, common population, 1e-8 local stops and separation of robust versus unweighted squared cost.
 * @evidence contracts/performance.md#efficient-algorithms Ordinary E-observation, L-landmark, C=6N-7 camera refinement costs O(I*(E*C^2+S*C^3)). Internal feasible selection additionally charges row whitening, full point qualification sum(k_point^2) per trial and at most J sparse direction passes of O(E*C+L) per model. Both methods admit O(E*C+L*C+C^2) simultaneous factors/rows/scratch before allocation; no dense all-point Jacobian is formed.
 * @evidence contracts/performance.md#reuse-equivalent-work Each current projection supplies residual, robust weight and both point/camera derivatives. Fixed features, intrinsics and measurements are reused across iterations; only changed numerical poses/points are reevaluated.
 * @evidence contracts/performance.md#bound-retention-and-release-resources New pose/landmark arrays and scalar report transfer to the caller. Call-local block scratch, callbacks and rejected trials expire without input mutation, image retention or external resources.
 */
export function refineRecoveryCameraMap(
  initialPoses: readonly IAutoMovieRecoveryMapPose[],
  initialLandmarks: readonly IAutoMovieRecoveryMapLandmark[],
  intrinsics: readonly (readonly number[])[],
  policy: IAutoMovieRecoveryCameraMapPolicy,
  budget: IAutoMovieRecoveryCameraMapBudget,
  checkpoint: () => void,
  charge: (work: number) => void = (): void => {},
  feasible?: IAutoMovieRecoveryFeasibleJointOptions,
): IAutoMovieRecoveryMapJointResult {
  if (feasible !== undefined)
    return refineRecoveryCameraMapFeasible(
      initialPoses,
      initialLandmarks,
      intrinsics,
      policy,
      budget,
      feasible,
      checkpoint,
      charge,
    );
  if (
    initialPoses.length < 2 ||
    intrinsics.length !== initialPoses.length ||
    initialLandmarks.length < 6 ||
    initialLandmarks.length > budget.maxTracks
  )
    throw new Error(
      "camera-map: at least two cameras and bounded landmarks required",
    );
  if (
    initialPoses[0]!.rotation.length !== 9 ||
    initialPoses[0]!.rotation.some(
      (value: number, at: number): boolean =>
        value !== (at === 0 || at === 4 || at === 8 ? 1 : 0),
    ) ||
    initialPoses[0]!.translation.some((value: number): boolean => value !== 0)
  )
    throw new Error("camera-map: identity first-camera gauge required");
  let poses: IAutoMovieRecoveryMapPose[] = initialPoses.map(
    (pose: IAutoMovieRecoveryMapPose): IAutoMovieRecoveryMapPose => ({
      rotation: pose.rotation.slice(),
      translation: [...pose.translation],
    }),
  );
  let landmarks: IAutoMovieRecoveryMapLandmark[] = initialLandmarks.map(
    (
      landmark: IAutoMovieRecoveryMapLandmark,
    ): IAutoMovieRecoveryMapLandmark => ({
      id: landmark.id,
      point: [...landmark.point],
      observations: landmark.observations.map(
        (
          observation: (typeof landmark.observations)[number],
        ): typeof observation => ({
          ...observation,
          pixel: [...observation.pixel],
        }),
      ),
    }),
  );
  const observationCount: number = landmarks.reduce(
    (sum: number, landmark: IAutoMovieRecoveryMapLandmark): number =>
      sum + landmark.observations.length,
    0,
  );
  const cameraWidth: number = 6 * poses.length - 7;
  const localEntries: number =
    Math.max(2 * observationCount, 2 * poses.length + 3) * (cameraWidth + 4);
  const reducedEntries: number =
    (2 * observationCount + 2 * cameraWidth) * cameraWidth;
  const sweepWork: number =
    4 * (2 * observationCount + landmarks.length) * cameraWidth * cameraWidth +
    4 * budget.maxSingularSweeps * cameraWidth * cameraWidth * cameraWidth +
    54 * budget.maxSingularSweeps * (observationCount + landmarks.length);
  if (
    observationCount > budget.maxObservations ||
    !Number.isSafeInteger(localEntries) ||
    !Number.isSafeInteger(reducedEntries) ||
    !Number.isSafeInteger(sweepWork) ||
    localEntries > budget.maxLinearEntries ||
    reducedEntries > budget.maxLinearEntries
  )
    throw new Error("camera-map: joint observation budget exceeded");
  for (const landmark of landmarks) {
    const views: number[] = landmark.observations.map(
      (observation: (typeof landmark.observations)[number]): number =>
        observation.viewIndex,
    );
    if (
      views.length < 2 ||
      views.length > poses.length ||
      new Set(views).size !== views.length ||
      views.some(
        (view: number): boolean =>
          view < 0 || view >= poses.length || !Number.isSafeInteger(view),
      )
    )
      throw new Error(
        "camera-map: distinct registered observations required per landmark",
      );
  }
  const evaluate: (
    cameras: readonly IAutoMovieRecoveryMapPose[],
    points: readonly IAutoMovieRecoveryMapLandmark[],
  ) => IAutoMovieRecoveryMapEvaluation | null = (
    cameras: readonly IAutoMovieRecoveryMapPose[],
    points: readonly IAutoMovieRecoveryMapLandmark[],
  ): IAutoMovieRecoveryMapEvaluation | null => {
    const tangent: [number, number, number][] = createRecoveryMapTangent(
      cameras[1]!.translation,
    );
    const blocks: IAutoMovieRecoveryMapJointBlock[] = [];
    let cost: number = 0,
      squared: number = 0;
    for (const landmark of points) {
      const block: (typeof blocks)[number] = {
        pointRows: [],
        cameraRows: [],
        right: [],
      };
      for (const observation of landmark.observations) {
        const view: number = observation.viewIndex;
        const projected: ReturnType<typeof projectRecoveryMapPoint> =
          projectRecoveryMapPoint(
            cameras[view]!,
            landmark.point,
            intrinsics[view]!,
          );
        if (projected === null) return null;
        const residual: number[] = projected.pixel.map(
          (value: number, axis: number): number =>
            value - observation.pixel[axis]!,
        );
        const norm: number = Math.hypot(...residual),
          hypotenuse: number = Math.hypot(1, norm / policy.lossScalePx),
          weight: number = 1 / Math.sqrt(hypotenuse);
        cost += norm * (norm / (hypotenuse + 1));
        squared += norm * norm;
        for (let axis: number = 0; axis < 2; axis++) {
          const row: number[] = new Array<number>(cameraWidth).fill(0),
            local: number[] = projected.cameraJacobian[axis]!;
          if (view === 1) {
            for (let column: number = 0; column < 3; column++)
              row[column] = local[column]!;
            for (let column: number = 0; column < 2; column++)
              row[3 + column] = tangent[column]!.reduce(
                (sum: number, value: number, at: number): number =>
                  sum + value * local[3 + at]!,
                0,
              );
          } else if (view >= 2)
            for (let column: number = 0; column < 6; column++)
              row[5 + 6 * (view - 2) + column] = local[column]!;
          block.cameraRows.push(
            row.map((value: number): number => value * weight),
          );
          block.pointRows.push(
            projected.pointJacobian[axis]!.map(
              (value: number): number => value * weight,
            ),
          );
          block.right.push(-residual[axis]! * weight);
        }
      }
      blocks.push(block);
    }
    if (![cost, squared].every(Number.isFinite))
      throw new Error("camera-map: nonrepresentable joint objective");
    return { cost, squared, blocks };
  };
  charge(2 * observationCount * (cameraWidth + 4));
  let current: ReturnType<typeof evaluate> = evaluate(poses, landmarks);
  if (current === null)
    throw new Error("camera-map: nonpositive initial landmark depth");
  const initialCost: number = current.cost,
    initialSquaredError: number = current.squared;
  let damping: number = 1e-3,
    iterations: number = 0,
    acceptedSteps: number = 0,
    minimumCameraDesignRatio: number = Infinity,
    minimumPointDesignRatio: number = Infinity;
  let termination: IAutoMovieRecoveryMapJointResult["report"]["termination"] =
    "iteration-budget";
  for (; iterations < budget.maxRefinementIterations; iterations++) {
    checkpoint();
    charge(sweepWork);
    const solution: ReturnType<typeof solveRecoveryMapJointStep> =
      solveRecoveryMapJointStep(
        current.blocks,
        policy.minimumDesignSingularRatio,
        damping,
        budget,
      );
    minimumCameraDesignRatio = Math.min(
      minimumCameraDesignRatio,
      solution.cameraDesignRatio,
    );
    minimumPointDesignRatio = Math.min(
      minimumPointDesignRatio,
      solution.minimumPointDesignRatio,
    );
    if (solution.gradient <= 1e-8) {
      termination = "gradient";
      break;
    }
    const trialPoses: IAutoMovieRecoveryMapPose[] = [
      poses[0]!,
      stepRecoveryRelativePose(
        poses[1]!,
        createRecoveryMapTangent(poses[1]!.translation),
        solution.cameraStep.slice(0, 5),
      ),
      ...poses
        .slice(2)
        .map(
          (
            pose: IAutoMovieRecoveryMapPose,
            at: number,
          ): IAutoMovieRecoveryMapPose =>
            stepRecoveryMapPose(
              pose,
              solution.cameraStep.slice(5 + 6 * at, 11 + 6 * at),
            ),
        ),
    ];
    const trialPoints: IAutoMovieRecoveryMapLandmark[] = landmarks.map(
      (
        landmark: IAutoMovieRecoveryMapLandmark,
        at: number,
      ): IAutoMovieRecoveryMapLandmark => ({
        ...landmark,
        point: landmark.point.map(
          (value: number, axis: number): number =>
            value + solution.pointSteps[at]![axis]!,
        ) as [number, number, number],
      }),
    );
    const trial: ReturnType<typeof evaluate> = evaluate(
      trialPoses,
      trialPoints,
    );
    if (trial !== null && trial.cost < current.cost) {
      const decrease: number = current.cost - trial.cost;
      poses = trialPoses;
      landmarks = trialPoints;
      current = trial;
      acceptedSteps++;
      damping /= 3;
      const maximumStep: number = solution.pointSteps.reduce(
        (maximum: number, point: [number, number, number]): number =>
          Math.max(maximum, Math.hypot(...point)),
        solution.cameraStep.reduce(
          (norm: number, value: number): number => Math.hypot(norm, value),
          0,
        ),
      );
      if (maximumStep <= 1e-8) {
        termination = "step";
        iterations++;
        break;
      }
      if (decrease <= 1e-8 * Math.max(1, current.cost)) {
        termination = "cost";
        iterations++;
        break;
      }
    } else damping *= 10;
    if (!(damping > 0) || !Number.isFinite(damping))
      throw new Error("camera-map: exhausted joint damping");
  }
  return {
    poses,
    landmarks,
    report: {
      converged: termination !== "iteration-budget",
      termination,
      iterations,
      acceptedSteps,
      observationCount,
      initialCost,
      finalCost: current.cost,
      initialSquaredError,
      finalSquaredError: current.squared,
      minimumCameraDesignRatio,
      minimumPointDesignRatio,
    },
  };
}
