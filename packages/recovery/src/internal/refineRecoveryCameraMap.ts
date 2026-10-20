import type {
  IAutoMovieRecoveryCameraMapBudget,
  IAutoMovieRecoveryCameraMapPolicy,
} from "@automovie/interface/recovery";

import type { IAutoMovieRecoveryMapJointFit } from "../structures/image/IAutoMovieRecoveryMapJointFit";
import type { IAutoMovieRecoveryMapLandmark } from "../structures/image/IAutoMovieRecoveryMapLandmark";
import type { IAutoMovieRecoveryMapPose } from "../structures/image/IAutoMovieRecoveryMapPose";
import { createRecoveryMapTangent } from "./createRecoveryMapTangent";
import { projectRecoveryMapPoint } from "./projectRecoveryMapPoint";
import { solveRecoveryMapJointStep } from "./solveRecoveryMapJointStep";
import { stepRecoveryMapPose } from "./stepRecoveryMapPose";
import { stepRecoveryRelativePose } from "./stepRecoveryRelativePose";

/**
 * Jointly refine three calibrated cameras and seed landmarks in one gauge.
 * The first pose must be identity at the origin and stays fixed; the seed
 * translation remains on its unit sphere,
 * and the third translation has three unrestricted coordinates. Fixed landmark
 * observations retain the same robust objective throughout every trial.
 *
 * @evidence contracts/common.md#principled-implementation Analytic pinhole derivatives, complete-vector soft-L1 weights and original-design point-local QR solve a gauge-fixed eleven-camera-coordinate bundle step. Independent point/reduced-camera ranks precede damping, and actual same-population descent accepts an SO3/sphere/Euclidean retraction.
 * @evidence contracts/common.md#clear-and-simple-design This nonlinear owner keeps fixed population, gauge, damping and local termination together; projection and block-linear algebra have separate numerical owners, and final map qualification belongs to the coordinator.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No first/second full-pose double anchoring, independent normalization of third translation, covariance claim, dropped measurement or damping-derived rank supplies a map. Nonpositive trial depths reject the step, and iteration exhaustion remains nonconverged.
 * @evidence contracts/common.md#meaningful-documentation States seven removed gauge freedoms, fixed known calibration, robust vector weighting, common population, 1e-8 local stops and separation of robust versus unweighted squared cost.
 * @evidence contracts/performance.md#efficient-algorithms N landmarks and I bounded accepted/rejected iterations use O(I*S*N*11^2) reduced-camera work and O(N) point-block work/storage; no dense all-landmark Jacobian is materialized.
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
): {
  poses: IAutoMovieRecoveryMapPose[];
  landmarks: IAutoMovieRecoveryMapLandmark[];
  report: IAutoMovieRecoveryMapJointFit;
} {
  if (
    initialPoses.length !== 3 ||
    intrinsics.length !== 3 ||
    initialLandmarks.length < 6 ||
    initialLandmarks.length > budget.maxTracks
  )
    throw new Error(
      "camera-map: three cameras and bounded seed landmarks required",
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
  if (observationCount > budget.maxObservations)
    throw new Error("camera-map: joint observation budget exceeded");
  for (const landmark of landmarks) {
    const views: number[] = landmark.observations.map(
      (observation: (typeof landmark.observations)[number]): number =>
        observation.viewIndex,
    );
    if (
      views.length < 2 ||
      views.length > 3 ||
      !views.includes(0) ||
      !views.includes(1) ||
      new Set(views).size !== views.length ||
      views.some(
        (view: number): boolean =>
          view < 0 || view > 2 || !Number.isSafeInteger(view),
      )
    )
      throw new Error(
        "camera-map: distinct seed observations required per landmark",
      );
  }
  const evaluate: (
    cameras: readonly IAutoMovieRecoveryMapPose[],
    points: readonly IAutoMovieRecoveryMapLandmark[],
  ) => {
    cost: number;
    squared: number;
    blocks: Parameters<typeof solveRecoveryMapJointStep>[0];
  } | null = (
    cameras: readonly IAutoMovieRecoveryMapPose[],
    points: readonly IAutoMovieRecoveryMapLandmark[],
  ): {
    cost: number;
    squared: number;
    blocks: Parameters<typeof solveRecoveryMapJointStep>[0];
  } | null => {
    const tangent: [number, number, number][] = createRecoveryMapTangent(
      cameras[1]!.translation,
    );
    const blocks: {
      pointRows: number[][];
      cameraRows: number[][];
      right: number[];
    }[] = [];
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
          const row: number[] = new Array<number>(11).fill(0),
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
          } else if (view === 2)
            for (let column: number = 0; column < 6; column++)
              row[5 + column] = local[column]!;
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
  let termination: IAutoMovieRecoveryMapJointFit["termination"] =
    "iteration-budget";
  for (; iterations < budget.maxRefinementIterations; iterations++) {
    checkpoint();
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
      stepRecoveryMapPose(poses[2]!, solution.cameraStep.slice(5)),
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
      const maximumStep: number = Math.max(
        Math.hypot(...solution.cameraStep),
        ...solution.pointSteps.map((point: [number, number, number]): number =>
          Math.hypot(...point),
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
