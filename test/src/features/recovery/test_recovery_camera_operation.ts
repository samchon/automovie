import type { IAutoMovieRecoveryCameraPairInput } from "@automovie/interface/recovery";
import { estimateAutoMovieRecoveryCameraPair } from "@automovie/recovery";
import { TestValidator } from "@nestia/e2e";

/**
 * Public resident camera operations separate measured refusal from failed work.
 *
 * Scenarios:
 * 1. Two valid singleton images complete observation with no appearance correspondences, retaining owned JSON evidence and no pose.
 * 2. Metadata/policy snapshots remain unchanged when the caller changes its original records from a progress callback and after return.
 * 3. Pre-abort, checkpoint abort and a callback exception return distinct no-value terminal outcomes.
 * 4. Malformed source/raster admission, unknown option keys and invalid abort state refuse before observer invocation, while an admitted candidate-work overflow fails without partial publication.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls the exported memory API and observes its terminal envelopes, actual empty-image evidence, explicit pose absence, original metadata independence, cancellation, callback failure and preallocation admission. It does not infer behavior from exports, filenames or source text.
 * @evidence contracts/testing.md#independent-expectations Singleton constant images cannot supply a Harris window or any two-neighbour appearance correspondence, so the mathematically required outcome is zero features/matches and camera refusal. The operation contract requires no artifact on admission failure, cancellation or execution failure. Caller-owned changed scalars are independently known and must not alter the already admitted snapshot.
 * @evidence contracts/testing.md#distinguishing-cases Covers a valid minimal image, empty observed population, missing RGB bytes, enumerable/nonenumerable/symbol unknown option keys, malformed abort state, pre-start and checkpoint cancellation, callback-thrown failure, snapshot lifetime and a real admitted candidate budget violation. Positive camera accuracy and nonplanar/planar numerical distinctions belong to independent geometry/consensus tests and image experiments.
 * @evidence contracts/testing.md#execution-ownership The portable test_recovery_camera_operation entry creates only resident byte arrays, caller records and AbortControllers. It reaches the public synchronous API without files, installed consumers, subprocesses, native builds, browsers or GPU and replaces no foreign method.
 */
export function test_recovery_camera_operation(): void {
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
  const result: ReturnType<typeof estimateAutoMovieRecoveryCameraPair> =
    estimateAutoMovieRecoveryCameraPair(input, {
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
      "value" in result &&
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
  if (!("value" in result))
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
  const before: ReturnType<typeof estimateAutoMovieRecoveryCameraPair> =
    estimateAutoMovieRecoveryCameraPair(makeInput(), {
      signal: aborted.signal,
    });
  const during: AbortController = new AbortController();
  const cancelled: ReturnType<typeof estimateAutoMovieRecoveryCameraPair> =
    estimateAutoMovieRecoveryCameraPair(makeInput(), {
      signal: during.signal,
      onProgress: (
        _phase: string,
        _completed: number,
        _total: number,
      ): void => {
        during.abort();
      },
    });
  const failed: ReturnType<typeof estimateAutoMovieRecoveryCameraPair> =
    estimateAutoMovieRecoveryCameraPair(makeInput(), {
      onProgress: (
        _phase: string,
        _completed: number,
        _total: number,
      ): void => {
        throw new Error("Owned observer failure");
      },
    });
  TestValidator.predicate(
    "cooperative cancellation and observer failure publish no evidence",
    before.status === "cancelled" &&
      !("value" in before) &&
      cancelled.status === "cancelled" &&
      !("value" in cancelled) &&
      failed.status === "failed" &&
      !("value" in failed) &&
      failed.diagnostics.includes("Owned observer failure"),
  );
  const malformed: IAutoMovieRecoveryCameraPairInput = makeInput();
  malformed.views[0]!.rgb8 = new Uint8Array(0);
  let observed: boolean = false;
  const refused: ReturnType<typeof estimateAutoMovieRecoveryCameraPair> =
    estimateAutoMovieRecoveryCameraPair(malformed, {
      onProgress: (
        _phase: string,
        _completed: number,
        _total: number,
      ): void => {
        observed = true;
      },
    });
  const unsupported: ReturnType<typeof estimateAutoMovieRecoveryCameraPair> =
    estimateAutoMovieRecoveryCameraPair(
      makeInput(),
      Object.assign(
        {
          onProgress: (
            _phase: string,
            _completed: number,
            _total: number,
          ): void => {},
        },
        { unknown: true },
      ),
    );
  TestValidator.predicate(
    "invalid raster and unsupported options refuse without admitting observation work",
    refused.status === "refused" &&
      !("value" in refused) &&
      !observed &&
      unsupported.status === "refused" &&
      !("value" in unsupported),
  );
  const invalidOptions: Parameters<
    typeof estimateAutoMovieRecoveryCameraPair
  >[1][] = [
    JSON.parse('{"signal":"invalid"}'),
    JSON.parse('{"signal":{}}'),
    JSON.parse('{"signal":{"aborted":1}}'),
    JSON.parse('{"signal":null}'),
    JSON.parse("[]"),
    Object.assign(
      {
        onProgress: (
          _phase: string,
          _completed: number,
          _total: number,
        ): void => {
          observed = true;
        },
      },
      { [Symbol("unknown")]: true },
    ),
    Object.defineProperty(
      {
        onProgress: (
          _phase: string,
          _completed: number,
          _total: number,
        ): void => {
          observed = true;
        },
      },
      "unknown",
      { value: true },
    ),
  ];
  for (const options of invalidOptions) {
    const rejected: ReturnType<typeof estimateAutoMovieRecoveryCameraPair> =
      estimateAutoMovieRecoveryCameraPair(makeInput(), options);
    TestValidator.predicate(
      "closed options and observable boolean abort state are admitted before progress",
      rejected.status === "refused" && !("value" in rejected) && !observed,
    );
  }
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
  const exhausted: ReturnType<typeof estimateAutoMovieRecoveryCameraPair> =
    estimateAutoMovieRecoveryCameraPair(limited);
  TestValidator.predicate(
    "an admitted candidate-work overflow fails without publishing an incomplete feature prefix",
    exhausted.status === "failed" &&
      !("value" in exhausted) &&
      exhausted.diagnostics.some((message: string): boolean =>
        message.includes("candidate budget exhausted"),
      ),
  );
}
