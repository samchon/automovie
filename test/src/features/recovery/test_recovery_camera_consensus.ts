import type { IAutoMovieRecoveryCameraPairInput } from "@automovie/interface/recovery";
import { TestValidator } from "@nestia/e2e";

import { createRecoveryCameraChart } from "../../../../packages/recovery/src/internal/createRecoveryCameraChart";
import { fitRecoveryEpipolarConsensus } from "../../../../packages/recovery/src/internal/fitRecoveryEpipolarConsensus";
import { fitRecoveryHomographyConsensus } from "../../../../packages/recovery/src/internal/fitRecoveryHomographyConsensus";
import { selectRecoveryCameraPose } from "../../../../packages/recovery/src/internal/selectRecoveryCameraPose";
import { nclose } from "../internal/nclose";

/**
 * Calibrated consensus distinguishes nonplanar motion from a planar explanation.
 *
 * Scenarios:
 * 1. Independent nonplanar pinhole projections with small noise and 20 percent mismatches retain the true material correspondences and prescribed relative camera.
 * 2. The same final inliers do not admit a dominant homography after the declared forbidden-overlap trial target.
 * 3. An independently authored projective 2D map supplies an immediate ambiguous planar explanation; a one-proposal absence search remains unfinished.
 * 4. Caller checkpoint exceptions propagate unchanged even when their message resembles a numerical refusal.
 *
 * @evidence contracts/testing.md#behavioral-verification Runs actual deterministic calibrated proposals, local refits, final sampling-target checks, four-pose selection and competing planar search. It observes correspondence identities, independent physical pose, numerical stopping diagnostics and unchanged callback-failure identity.
 * @evidence contracts/testing.md#independent-expectations Direct scalar projection of independently authored 3D coordinates, a known Y rotation and unit translation generates 32 valid observations; eight mismatches are separate fixed image coordinates. A rational 2D homography generates planar truth. Physical expectations do not come from the fitted model, another estimator or saved output.
 * @evidence contracts/testing.md#distinguishing-cases Covers noisy nonplanar support with outliers, calibrated rather than algebraic scoring, distinct homography absence/found states, insufficient sampling work, final local convergence and callback failure outside proposal catches. RGB observation, malformed public input and photographic camera accuracy remain separate tests or experiments.
 * @evidence contracts/testing.md#execution-ownership The portable test_recovery_camera_consensus entry owns only small synchronous numerical populations; it starts no installation, subprocess, native artifact, browser or GPU and replaces no foreign method.
 */
export function test_recovery_camera_consensus(): void {
  const policy: IAutoMovieRecoveryCameraPairInput["policy"] = {
    family: "harris-gradient-calibrated-eight-point",
    minimumCornerResponse: 10,
    suppressionRobustness: 0.9,
    descriptorDistanceRatio: 0.7,
    maximumSampsonErrorPx: 2,
    samplingConfidence: 0.999,
    samplingSeed: 12345,
    minimumInliers: 16,
    minimumInlierFraction: 0.35,
    maximumMedianErrorPx: 1.5,
    maximumP90ErrorPx: 3,
    minimumPositiveDepthFraction: 0.9,
    minimumParallaxRadians: Math.PI / 180,
    maximumHomographyOverlapFraction: 0.9,
    maximumHomographyTransferPx: 2,
    minimumDesignSingularRatio: 1e-8,
    refinementLossScalePx: 1,
  };
  const budget: IAutoMovieRecoveryCameraPairInput["budget"] = {
    maxPixels: 614400,
    maxCandidates: 2000,
    maxFeatures: 500,
    maxPyramidLevels: 4,
    maxDescriptorPairs: 250000,
    maxRansacTrials: 1024,
    minimumRansacTrials: 32,
    maxLocalRefinements: 4,
    maxRefinementIterations: 100,
    maxSingularSweeps: 64,
  };
  const view: IAutoMovieRecoveryCameraPairInput["views"][number] = {
    id: "analytic",
    sourceSha256: "0".repeat(64),
    pixelProvenance: "analytic integer-centre chart",
    width: 640,
    height: 480,
    rgb8: new Uint8Array(0),
    camera: {
      type: "pinhole",
      calibration: "supplied-intrinsics",
      distortion: "caller-corrected",
      focalPx: [700, 750],
      skewPx: 5,
      principalPointPx: [320, 240],
      uncertaintyPx: null,
    },
  };
  const chart: ReturnType<typeof createRecoveryCameraChart> =
    createRecoveryCameraChart(view);
  const translationLength: number = Math.hypot(0.8, 0.2, 0.1);
  const translation: number[] = [
    0.8 / translationLength,
    0.2 / translationLength,
    0.1 / translationLength,
  ];
  const angle: number = 0.19;
  const rotation: number[] = [
    Math.cos(angle),
    0,
    Math.sin(angle),
    0,
    1,
    0,
    -Math.sin(angle),
    0,
    Math.cos(angle),
  ];
  const project: (x: number, y: number, z: number) => [number, number] = (
    x: number,
    y: number,
    z: number,
  ): [number, number] => [(700 * x + 5 * y) / z + 320, (750 * y) / z + 240];
  const first: [number, number][] = [],
    second: [number, number][] = [];
  for (let at: number = 0; at < 40; at++) {
    const x: number = (((at * 7) % 17) - 8) / 5;
    const y: number = (((at * 11) % 19) - 9) / 7;
    const z: number = 4 + ((at * 13) % 23) / 5;
    first.push(project(x, y, z));
    if (at < 32) {
      const pixel: [number, number] = project(
        Math.cos(angle) * x + Math.sin(angle) * z + translation[0]!,
        y + translation[1]!,
        -Math.sin(angle) * x + Math.cos(angle) * z + translation[2]!,
      );
      second.push([
        pixel[0] + 0.03 * Math.sin(at * 2.1),
        pixel[1] + 0.03 * Math.cos(at * 1.7),
      ]);
    } else second.push([50 + ((at * 97) % 550), 25 + ((at * 131) % 420)]);
  }
  const checkpoints: number[] = [];
  const result: ReturnType<typeof fitRecoveryEpipolarConsensus> =
    fitRecoveryEpipolarConsensus(
      first,
      second,
      chart,
      chart,
      policy,
      budget,
      (completed: number, _total: number): void => {
        checkpoints.push(completed);
      },
    );
  TestValidator.predicate(
    "true independent correspondences survive calibrated consensus and converged final fitting",
    result.matrix !== null &&
      result.finalRefinement?.converged === true &&
      result.conditionalTrialTargetMet &&
      result.score.indices.filter((at: number): boolean => at < 32).length >=
        31 &&
      result.score.indices.filter((at: number): boolean => at >= 32).length <=
        1 &&
      result.requiredTrialsAtFinalSupport !== null &&
      result.trials >= result.requiredTrialsAtFinalSupport &&
      checkpoints.length > 0 &&
      checkpoints[checkpoints.length - 1] === result.trials,
  );
  if (result.matrix === null)
    throw new Error("Expected an independently prescribed nonplanar camera");
  const inlierFirst: [number, number][] = result.score.indices.map(
    (at: number): [number, number] => first[at]!,
  );
  const inlierSecond: [number, number][] = result.score.indices.map(
    (at: number): [number, number] => second[at]!,
  );
  const pose: ReturnType<typeof selectRecoveryCameraPose> =
    selectRecoveryCameraPose(
      result.matrix,
      inlierFirst,
      inlierSecond,
      chart,
      chart,
      policy.minimumDesignSingularRatio,
      budget.maxSingularSweeps,
    );
  TestValidator.predicate(
    "independent relative camera rather than pixel fit alone qualifies the synthetic positive",
    pose.uniqueWinner &&
      pose.positiveDepthFraction >= 0.95 &&
      pose.rotation.every((value: number, at: number): boolean =>
        nclose(value, rotation[at]!, 0.003),
      ) &&
      pose.translation.every((value: number, at: number): boolean =>
        nclose(value, translation[at]!, 0.015),
      ),
  );
  const planar: ReturnType<typeof fitRecoveryHomographyConsensus> =
    fitRecoveryHomographyConsensus(
      inlierFirst,
      inlierSecond,
      policy,
      budget,
      (_completed: number, _total: number): void => {},
    );
  TestValidator.predicate(
    "nonplanar correspondences finish the forbidden-overlap search without inventing a plane",
    !planar.forbiddenOverlapFound &&
      planar.conditionalTrialTargetMet &&
      planar.score.indices.length < planar.forbiddenSupport &&
      planar.population === result.score.indices.length,
  );
  const source: [number, number][] = [
    [20, 30],
    [240, 50],
    [60, 230],
    [310, 190],
    [130, 80],
    [90, 290],
    [390, 310],
    [280, 360],
  ];
  const target: [number, number][] = source.map(
    (point: [number, number]): [number, number] => {
      const divisor: number = 1 + 0.0002 * point[0] - 0.0001 * point[1];
      return [
        (1.1 * point[0] + 0.08 * point[1] + 12) / divisor,
        (-0.03 * point[0] + 0.9 * point[1] - 7) / divisor,
      ];
    },
  );
  const ambiguity: ReturnType<typeof fitRecoveryHomographyConsensus> =
    fitRecoveryHomographyConsensus(
      source,
      target,
      policy,
      budget,
      (_completed: number, _total: number): void => {},
    );
  TestValidator.predicate(
    "a found planar explanation is direct ambiguity evidence regardless of an absence-search target",
    ambiguity.forbiddenOverlapFound &&
      ambiguity.score.indices.length === source.length,
  );
  const unfinished: ReturnType<typeof fitRecoveryHomographyConsensus> =
    fitRecoveryHomographyConsensus(
      inlierFirst,
      inlierSecond,
      policy,
      { ...budget, maxRansacTrials: 1, minimumRansacTrials: 1 },
      (_completed: number, _total: number): void => {},
    );
  TestValidator.predicate(
    "an unfinished absence search is separate from a demonstrated ambiguous plane",
    !unfinished.forbiddenOverlapFound &&
      !unfinished.conditionalTrialTargetMet &&
      unfinished.trials === 1,
  );
  const callbackError: Error = new Error(
    "camera-design: caller checkpoint failure",
  );
  let received: unknown = null;
  try {
    fitRecoveryEpipolarConsensus(
      first,
      second,
      chart,
      chart,
      policy,
      budget,
      (_completed: number, _total: number): void => {
        throw callbackError;
      },
    );
  } catch (error: unknown) {
    received = error;
  }
  TestValidator.predicate(
    "a caller error cannot be recategorized as a rejected numerical proposal",
    received === callbackError,
  );
}
