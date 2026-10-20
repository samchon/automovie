import type { IAutoMovieRecoveryCameraPairInput } from "@automovie/interface/recovery";
import { TestValidator } from "@nestia/e2e";

import { createRecoveryCameraChart } from "../../../../packages/recovery/src/internal/createRecoveryCameraChart";
import { fitRecoveryEpipolarConsensus } from "../../../../packages/recovery/src/internal/fitRecoveryEpipolarConsensus";
import { selectRecoveryCameraPose } from "../../../../packages/recovery/src/internal/selectRecoveryCameraPose";
import { nclose } from "../internal/nclose";

/**
 * Local hypothesis discovery precedes winner comparison for an orbit camera.
 *
 * Scenarios:
 * 1. Independently projected shallow nonplanar points with pixel noise and eight mismatches recover the prescribed orbit rather than an early low-parallax consensus.
 * 2. The bounded discovery result still requires stable final support and a recomputed conditional sampling target.
 * 3. A spent one-step optimizer does not inherit convergence from hypothesis discovery.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls the actual calibrated consensus and four-pose selection on noisy independent projections, observes physical rotation and signed translation, final optimizer convergence, inlier identities, sampling work and the caller's local-work limit. A separate exhausted-optimizer call must remain unqualified.
 * @evidence contracts/testing.md#independent-expectations Scalar pinhole projection uses a prescribed Y-axis orbit about the point at depth six, with translation target minus rotated target. Forty distinct three-dimensional points span depth 5.9 through 6.1; deterministic subpixel perturbations and eight unrelated image points are authored before fitting. Neither expected pose nor inlier identities come from estimator output or photographs.
 * @evidence contracts/testing.md#distinguishing-cases Shallow depth variation exposes weak calibrated minimal initializers whose raw support cannot bound refined support. The regression compares the recovered camera to independent geometry and preserves final subset convergence and optimizer-budget refusal. It does not claim a shallow scene passes the separate homography ambiguity gate or establishes photographic accuracy.
 * @evidence contracts/testing.md#execution-ownership The portable test_recovery_camera_local_discovery entry owns small synchronous arrays and calls maintained numerical owners. It installs nothing, starts no process or viewer, opens no image or ground truth file and replaces no method or global.
 */
export function test_recovery_camera_local_discovery(): void {
  const policy: IAutoMovieRecoveryCameraPairInput["policy"] = {
    family: "harris-gradient-calibrated-eight-point", minimumCornerResponse: 10,
    suppressionRobustness: 0.9, descriptorDistanceRatio: 0.7, maximumSampsonErrorPx: 2,
    samplingConfidence: 0.999, samplingSeed: 17, minimumInliers: 16, minimumInlierFraction: 0.35,
    maximumMedianErrorPx: 1.5, maximumP90ErrorPx: 3, minimumPositiveDepthFraction: 0.9,
    minimumParallaxRadians: Math.PI / 180, maximumHomographyOverlapFraction: 0.9,
    maximumHomographyTransferPx: 2, minimumDesignSingularRatio: 1e-8, refinementLossScalePx: 1,
  };
  const budget: IAutoMovieRecoveryCameraPairInput["budget"] = {
    maxPixels: 614400, maxCandidates: 5000, maxFeatures: 500, maxPyramidLevels: 6,
    maxDescriptorPairs: 250000, maxRansacTrials: 1024, minimumRansacTrials: 128,
    maxLocalRefinements: 32, maxRefinementIterations: 100, maxSingularSweeps: 64,
  };
  const view: IAutoMovieRecoveryCameraPairInput["views"][number] = {
    id: "analytic-orbit", sourceSha256: "0".repeat(64), pixelProvenance: "independent integer-centre projection",
    width: 640, height: 480, rgb8: new Uint8Array(0), camera: { type: "pinhole",
      calibration: "supplied-intrinsics", distortion: "caller-corrected", focalPx: [700, 750],
      skewPx: 5, principalPointPx: [320, 240], uncertaintyPx: null },
  };
  const chart: ReturnType<typeof createRecoveryCameraChart> = createRecoveryCameraChart(view);
  const angle: number = 0.4;
  const cosine: number = Math.cos(angle), sine: number = Math.sin(angle);
  const rotation: number[] = [cosine, 0, sine, 0, 1, 0, -sine, 0, cosine];
  const translation: number[] = [-6 * sine, 0, 6 * (1 - cosine)];
  const length: number = Math.hypot(...translation);
  const project: (x: number, y: number, z: number) => [number, number] = (
    x: number, y: number, z: number,
  ): [number, number] => [(700 * x + 5 * y) / z + 320, 750 * y / z + 240];
  const first: [number, number][] = [], second: [number, number][] = [];
  for (let at: number = 0; at < 48; at++) {
    const x: number = ((at * 7) % 23 - 11) / 11;
    const y: number = ((at * 11) % 29 - 14) / 14;
    const z: number = 6 + 0.2 * (((at * 13) % 31) / 30 - 0.5);
    const pixel: [number, number] = project(x, y, z);
    first.push([pixel[0] + 0.4 * Math.cos(at * 1.3), pixel[1] + 0.4 * Math.sin(at * 1.9)]);
    if (at < 40) {
      const moved: [number, number] = project(cosine * x + sine * z + translation[0]!, y,
        -sine * x + cosine * z + translation[2]!);
      second.push([moved[0] + 0.4 * Math.sin(at * 2.1), moved[1] + 0.4 * Math.cos(at * 1.7)]);
    } else second.push([50 + (at * 97) % 550, 25 + (at * 131) % 420]);
  }
  const result: ReturnType<typeof fitRecoveryEpipolarConsensus> = fitRecoveryEpipolarConsensus(
    first, second, chart, chart, policy, budget, (_completed: number, _total: number): void => {},
  );
  TestValidator.predicate("discovery keeps final stability, sampling work and the caller's local budget",
    result.matrix !== null && result.finalRefinement?.converged === true && result.conditionalTrialTargetMet &&
    result.localRefinements <= budget.maxLocalRefinements && result.requiredTrialsAtFinalSupport !== null &&
    result.trials >= result.requiredTrialsAtFinalSupport &&
    result.score.indices.filter((at: number): boolean => at < 40).length >= 39);
  if (result.matrix === null) throw new Error("Expected an orbit hypothesis");
  const pose: ReturnType<typeof selectRecoveryCameraPose> = selectRecoveryCameraPose(result.matrix,
    result.score.indices.map((at: number): [number, number] => first[at]!),
    result.score.indices.map((at: number): [number, number] => second[at]!),
    chart, chart, policy.minimumDesignSingularRatio, budget.maxSingularSweeps);
  TestValidator.predicate("weak raw initializers cannot suppress discovery of the independently prescribed orbit",
    pose.uniqueWinner && pose.positiveDepthFraction >= 0.95 && pose.medianParallaxRadians !== null &&
    pose.medianParallaxRadians > 0.3 &&
    pose.rotation.every((value: number, at: number): boolean => nclose(value, rotation[at]!, 0.02)) &&
    pose.translation.every((value: number, at: number): boolean => nclose(value, translation[at]! / length, 0.05)));
  const unfinished: ReturnType<typeof fitRecoveryEpipolarConsensus> = fitRecoveryEpipolarConsensus(
    first, second, chart, chart, policy,
    { ...budget, maxRansacTrials: 128, maxLocalRefinements: 1, maxRefinementIterations: 1 },
    (_completed: number, _total: number): void => {},
  );
  TestValidator.predicate("a spent continuous optimizer remains unqualified even after provisional discovery",
    unfinished.finalRefinement !== null && !unfinished.finalRefinement.converged &&
    unfinished.finalRefinement.refusal === "optimizer-termination");
}
