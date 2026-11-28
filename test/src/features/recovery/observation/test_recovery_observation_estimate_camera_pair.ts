import type { IAutoMovieRecoveryCameraPairInput } from "@automovie/interface";
import { AutoMovieRecoveryObservation } from "@automovie/recovery";
import { TestValidator } from "@nestia/e2e";
import { runInNewContext } from "node:vm";

/**
 * Public resident camera operations separate measured refusal from failed work.
 *
 * Scenarios:
 *
 * 1. Two valid singleton images complete observation with no appearance
 *    correspondences, retaining owned JSON evidence and no pose.
 * 2. Metadata/policy snapshots remain unchanged when the caller changes its
 *    original records from a progress callback and after return.
 * 3. Pre-abort, checkpoint abort and a callback exception return distinct no-value
 *    terminal outcomes.
 * 4. An admitted candidate-work overflow fails without partial publication.
 * 5. Invalid pair identity, raster, controls and pixel population refuse before
 *    observing either view. Exact low positive caps admit byte arrays borrowed
 *    from different JavaScript realms.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Distinguishes malformed input, post-admission work failure, and a completed observation whose geometry refused.
 * @evidence contracts/development/testing.md#behavioral-verification Exercises callback mutation and failure, cancellation, feature-work exhaustion, and malformed pair identity, raster, policy and limits through the public estimator.
 * @evidence contracts/development/testing.md#independent-expectations Two singleton images consume two pixels and supply zero corners, independently of the sampling seed. The separate textured fixture exceeds one descriptor-valid candidate after admission.
 */
export function test_recovery_observation_estimate_camera_pair(): void {
  const makeInput: () => IAutoMovieRecoveryCameraPairInput =
    (): IAutoMovieRecoveryCameraPairInput => ({
      schema: "automovie-recovery-camera-pair-v1",
      objectId: "analytic-singletons",
      rigidity: "asserted-fixed-scene",
      cohort: "analytic",
      views: ["first", "second"].map(
        (id: string): IAutoMovieRecoveryCameraPairInput["views"][number] => ({
          id,
          sourceSha256: "0".repeat(64),
          pixelProvenance: "constant analytic singleton",
          width: 1,
          height: 1,
          rgb8: new Uint8Array(3),
          camera: {
            type: "pinhole",
            calibration: "supplied-intrinsics",
            distortion: "caller-corrected",
            focalPx: [300, 310],
            skewPx: 0,
            principalPointPx: [0, 0],
            uncertaintyPx: null,
          },
        }),
      ),
      policy: {
        family: "harris-gradient-calibrated-eight-point",
        minimumCornerResponse: 10,
        suppressionRobustness: 0.9,
        descriptorDistanceRatio: 0.7,
        maximumSampsonErrorPx: 2,
        samplingConfidence: 0.999,
        samplingSeed: 17,
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
      },
      budget: {
        maxPixels: 2,
        maxCandidates: 5000,
        maxFeatures: 64,
        maxPyramidLevels: 1,
        maxDescriptorPairs: 4096,
        maxRansacTrials: 128,
        minimumRansacTrials: 32,
        maxLocalRefinements: 4,
        maxRefinementIterations: 100,
        maxSingularSweeps: 64,
      },
    });
  const input: IAutoMovieRecoveryCameraPairInput = makeInput();
  const phases: string[] = [];
  const result: ReturnType<
    typeof AutoMovieRecoveryObservation.estimateCameraPair
  > = AutoMovieRecoveryObservation.estimateCameraPair(input, {
    onProgress: (phase: string, _completed: number, _total: number): void => {
      phases.push(phase);
      input.objectId = "caller-changed";
      input.policy.minimumCornerResponse = 99;
      input.views[0]!.camera.focalPx[0] = 123;
      input.budget.maxPixels = 100;
    },
  });
  TestValidator.predicate(
    "completed empty observations retain explicit camera refusal without inventing a pose",
    result.status === "partial" &&
      result.value.status === "refused" &&
      result.value.pose === null &&
      result.value.consensus === null &&
      result.value.matches.length === 0 &&
      result.value.features.every(
        (feature: (typeof result.value.features)[number]): boolean =>
          feature.observedDescriptors === 0,
      ) &&
      result.value.refusalReasons.includes("insufficient-appearance-matches") &&
      phases.includes("observations-ready"),
  );
  if (result.status !== "complete" && result.status !== "partial")
    throw new Error("A completed observation must return its evidence");
  input.views[0]!.id = "later-change";
  TestValidator.predicate(
    "admitted snapshots and transferred evidence have independent metadata lifetime",
    result.value.objectId === "analytic-singletons" &&
      result.value.policy.minimumCornerResponse === 10 &&
      result.value.budget.maxPixels === 2 &&
      result.value.sources[0]!.camera.focalPx[0] === 300 &&
      result.value.sources[0]!.id === "first",
  );
  const aborted: AbortController = new AbortController();
  aborted.abort();
  const before: ReturnType<
    typeof AutoMovieRecoveryObservation.estimateCameraPair
  > = AutoMovieRecoveryObservation.estimateCameraPair(makeInput(), {
    cancelled: (): boolean => aborted.signal.aborted,
  });
  const during: AbortController = new AbortController();
  const cancelled: ReturnType<
    typeof AutoMovieRecoveryObservation.estimateCameraPair
  > = AutoMovieRecoveryObservation.estimateCameraPair(makeInput(), {
    cancelled: (): boolean => during.signal.aborted,
    onProgress: (_phase: string, _completed: number, _total: number): void => {
      during.abort();
    },
  });
  const failed: ReturnType<
    typeof AutoMovieRecoveryObservation.estimateCameraPair
  > = AutoMovieRecoveryObservation.estimateCameraPair(makeInput(), {
    onProgress: (_phase: string, _completed: number, _total: number): void => {
      throw new Error("Owned observer failure");
    },
  });
  TestValidator.predicate(
    "cooperative cancellation and observer failure publish no evidence",
    before.status === "cancelled" &&
      cancelled.status === "cancelled" &&
      failed.status === "failed" &&
      failed.diagnostics.includes("Owned observer failure"),
  );
  const limited: IAutoMovieRecoveryCameraPairInput = makeInput();
  limited.budget.maxPixels = 160 * 144 * 2;
  limited.budget.maxCandidates = 1;
  limited.budget.maxFeatures = 1;
  for (const view of limited.views) {
    view.width = 160;
    view.height = 144;
    view.rgb8 = new Uint8Array(160 * 144 * 3);
    for (let y: number = 0; y < view.height; y++)
      for (let x: number = 0; x < view.width; x++) {
        const value: number =
          20 +
          (((Math.imul(Math.floor(x / 8), 73856093) ^
            Math.imul(Math.floor(y / 8), 19349663)) >>>
            0) %
            200);
        for (let channel: number = 0; channel < 3; channel++)
          view.rgb8[(y * view.width + x) * 3 + channel] = value;
      }
  }
  const exhausted: ReturnType<
    typeof AutoMovieRecoveryObservation.estimateCameraPair
  > = AutoMovieRecoveryObservation.estimateCameraPair(limited);
  TestValidator.predicate(
    "an admitted candidate-work overflow fails without publishing an incomplete feature prefix",
    exhausted.status === "failed" &&
      exhausted.diagnostics.some((message: string): boolean =>
        message.includes("candidate budget exhausted"),
      ),
  );
  const malformed: [
    label: string,
    mutate: (value: IAutoMovieRecoveryCameraPairInput) => void,
  ][] = [
    ["unknown schema", (value) => Object.assign(value, { schema: "other" })],
    ["blank scene identity", (value) => (value.objectId = " ")],
    ["a single view", (value) => value.views.pop()],
    [
      "an extra view",
      (value) => value.views.push({ ...value.views[1]!, id: "extra" }),
    ],
    ["duplicate view ID", (value) => (value.views[1]!.id = value.views[0]!.id)],
    ["invalid provenance", (value) => (value.views[1]!.pixelProvenance = "")],
    ["short raster", (value) => (value.views[1]!.rgb8 = new Uint8Array(2))],
    [
      "signed-byte raster",
      (value) => Object.assign(value.views[1]!, { rgb8: new Int8Array(3) }),
    ],
    [
      "nonfinite calibration",
      (value) => (value.views[1]!.camera.skewPx = Infinity),
    ],
    ["too few offered pixels", (value) => (value.budget.maxPixels = 1)],
    ["NaN pixel limit", (value) => (value.budget.maxPixels = NaN)],
    ["NaN trial limit", (value) => (value.budget.maxRansacTrials = NaN)],
    [
      "reversed trial limits",
      (value) =>
        (value.budget.minimumRansacTrials = value.budget.maxRansacTrials + 1),
    ],
    [
      "nonfinite Sampson threshold",
      (value) => (value.policy.maximumSampsonErrorPx = Infinity),
    ],
  ];
  for (const [label, mutate] of malformed) {
    const candidate: IAutoMovieRecoveryCameraPairInput = makeInput();
    mutate(candidate);
    let observed: boolean = false;
    const refused = AutoMovieRecoveryObservation.estimateCameraPair(candidate, {
      onProgress: (): void => {
        observed = true;
      },
    });
    TestValidator.predicate(
      `${label} refuses before pair observation`,
      refused.status === "refused" && !("value" in refused) && !observed,
    );
  }
  const tiny: IAutoMovieRecoveryCameraPairInput = makeInput();
  Object.assign(tiny.budget, {
    maxCandidates: 1,
    maxFeatures: 1,
    maxDescriptorPairs: 1,
    maxRansacTrials: 1,
    minimumRansacTrials: 1,
    maxLocalRefinements: 1,
    maxRefinementIterations: 1,
    maxSingularSweeps: 1,
  });
  tiny.policy.samplingSeed = 0xffffffff;
  tiny.views[1]!.rgb8 = runInNewContext("new Uint8Array(3)") as Uint8Array;
  const sparse = AutoMovieRecoveryObservation.estimateCameraPair(tiny);
  TestValidator.predicate(
    "positive low pair caps complete sparse evidence in source order",
    sparse.status === "partial" &&
      sparse.value.status === "refused" &&
      sparse.value.sources.map((source) => source.id).join(",") ===
        "first,second" &&
      sparse.value.features.length === 2,
  );
}
