import type { IAutoMovieRecoveryCameraMapInput } from "@automovie/interface";
import { AutoMovieRecoveryObservation } from "@automovie/recovery";
import { TestValidator } from "@nestia/e2e";

import { createRecoveryMapNumericalFixture } from "../../internal/createRecoveryMapNumericalFixture";

/**
 * Public triad outcomes keep observation completion distinct from map
 * acceptance.
 *
 * Scenarios:
 *
 * 1. Three valid constant singleton images complete with zero features and
 *    explicit seed refusal, without inventing any pose or point.
 * 2. Snapshot metadata survives caller mutation, while pre-abort, checkpoint abort
 *    and observer exceptions return distinct no-value outcomes.
 * 3. Invalid triad identity, raster/calibration, work limits and operating
 *    thresholds refuse before observation.
 * 4. Exact pixel bounds, unsigned sampling endpoints and closed policy thresholds
 *    retain a completed sparse-scene refusal.
 * 5. Actual directed comparison work follows the eligible searches, including
 *    pairs with only one or no descriptor on a side.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States completed sparse refusal, eligible boundary controls, metadata ownership and malformed admission cases.
 * @evidence contracts/development/testing.md#behavioral-verification Runs singleton views through public estimate, mutates metadata, aborts, submits malformed input, and observes textured views with zero, one or two features under exact and exhausted comparison caps.
 * @evidence contracts/development/testing.md#independent-expectations Singleton views provide no corners. One target cannot supply a comparison's runner-up, so one descriptor against two needs two comparisons in that direction alone. Two descriptors on both sides need four comparisons per direction.
 */
export function test_recovery_observation_estimate_camera_map(): void {
  const make: () => IAutoMovieRecoveryCameraMapInput =
    (): IAutoMovieRecoveryCameraMapInput => {
      const input: IAutoMovieRecoveryCameraMapInput =
        createRecoveryMapNumericalFixture().input;
      input.views = input.views.map(
        (view: (typeof input.views)[number]): typeof view => ({
          ...view,
          width: 1,
          height: 1,
          rgb8: new Uint8Array(3),
        }),
      );
      return input;
    };
  const input: IAutoMovieRecoveryCameraMapInput = make();
  const result: ReturnType<
    typeof AutoMovieRecoveryObservation.estimateCameraMap
  > = AutoMovieRecoveryObservation.estimateCameraMap(input, {
    onProgress: (): void => {
      input.objectId = "changed";
      input.policy.maximumReprojectionErrorPx = 99;
      input.views[2]!.camera.focalPx[0] = 123;
    },
  });
  TestValidator.predicate(
    "completed empty triad retains measured seed refusal and detached metadata",
    result.status === "partial" &&
      result.value.status === "refused" &&
      result.value.poses.length === 3 &&
      result.value.poses.every(
        (pose: (typeof result.value.poses)[number]): boolean => pose === null,
      ) &&
      result.value.landmarks.length === 0 &&
      result.value.featureCounts.every(
        (count: number): boolean => count === 0,
      ) &&
      result.value.sources.length === 3 &&
      result.value.sources[2]!.camera.focalPx[0] === 760 &&
      result.value.objectId === "independent-analytic-triad" &&
      result.value.policy.maximumReprojectionErrorPx === 2,
  );
  const before: AbortController = new AbortController();
  before.abort();
  const during: AbortController = new AbortController();
  const cancelledBefore: ReturnType<
    typeof AutoMovieRecoveryObservation.estimateCameraMap
  > = AutoMovieRecoveryObservation.estimateCameraMap(make(), {
    cancelled: (): boolean => before.signal.aborted,
  });
  const cancelledDuring: ReturnType<
    typeof AutoMovieRecoveryObservation.estimateCameraMap
  > = AutoMovieRecoveryObservation.estimateCameraMap(make(), {
    cancelled: (): boolean => during.signal.aborted,
    onProgress: (): void => during.abort(),
  });
  const failed: ReturnType<
    typeof AutoMovieRecoveryObservation.estimateCameraMap
  > = AutoMovieRecoveryObservation.estimateCameraMap(make(), {
    onProgress: (): void => {
      throw new Error("owned observer failure");
    },
  });
  TestValidator.predicate(
    "cancellation and callback failure transfer no value",
    cancelledBefore.status === "cancelled" &&
      cancelledDuring.status === "cancelled" &&
      failed.status === "failed",
  );
  const malformed: [
    label: string,
    mutate: (value: IAutoMovieRecoveryCameraMapInput) => void,
  ][] = [
    ["unknown schema", (value) => Object.assign(value, { schema: "other" })],
    ["blank scene identity", (value) => (value.objectId = " ")],
    ["missing rigidity", (value) => Object.assign(value, { rigidity: null })],
    ["unknown cohort", (value) => Object.assign(value, { cohort: "unknown" })],
    ["missing third view", (value) => value.views.pop()],
    [
      "fourth view",
      (value) => value.views.push({ ...value.views[2]!, id: "fourth" }),
    ],
    [
      "duplicate view identity",
      (value) => (value.views[2]!.id = value.views[1]!.id),
    ],
    ["invalid source hash", (value) => (value.views[2]!.sourceSha256 = "bad")],
    ["empty provenance", (value) => (value.views[2]!.pixelProvenance = "")],
    ["fractional width", (value) => (value.views[2]!.width = 0.5)],
    ["truncated RGB", (value) => (value.views[2]!.rgb8 = new Uint8Array(2))],
    [
      "invalid focal length",
      (value) => (value.views[2]!.camera.focalPx[1] = 0),
    ],
    [
      "negative uncertainty",
      (value) => (value.views[2]!.camera.uncertaintyPx = -1),
    ],
    ["over aggregate pixels", (value) => (value.budget.maxPixels = 2)],
    ["over seed pixels", (value) => (value.seedBudget.maxPixels = 1)],
    ["infinite work", (value) => (value.budget.maxPixels = Infinity)],
    ["unsafe work", (value) => (value.budget.maxLinearEntries = 2 ** 53)],
    ["fractional work", (value) => (value.budget.maxSingularSweeps = 1.5)],
    ["zero work", (value) => (value.budget.maxRefinementIterations = 0)],
    [
      "reversed map trial limits",
      (value) =>
        (value.budget.minimumResectionTrials =
          value.budget.maxResectionTrials + 1),
    ],
    [
      "reversed seed trial limits",
      (value) =>
        (value.seedBudget.minimumRansacTrials =
          value.seedBudget.maxRansacTrials + 1),
    ],
    [
      "more retained features than candidates",
      (value) =>
        (value.seedBudget.maxFeatures = value.seedBudget.maxCandidates + 1),
    ],
    [
      "zero inlier fraction",
      (value) => (value.policy.minimumResectionInlierFraction = 0),
    ],
    ["low inlier count", (value) => (value.policy.minimumResectionInliers = 5)],
    [
      "right-angle parallax minimum",
      (value) => (value.policy.minimumPointParallaxDegrees = 90),
    ],
    [
      "unit stopping confidence",
      (value) => (value.policy.samplingConfidence = 1),
    ],
    ["negative seed", (value) => (value.policy.samplingSeed = -1)],
    [
      "seed above 32 bits",
      (value) => (value.seedPolicy.samplingSeed = 2 ** 32),
    ],
    [
      "closed rank endpoint",
      (value) => (value.policy.minimumDesignSingularRatio = 1),
    ],
    ["negative DLT ratio", (value) => (value.policy.maximumDltNullRatio = -1)],
    [
      "invalid seed descriptor ratio",
      (value) => (value.seedPolicy.descriptorDistanceRatio = 1),
    ],
  ];
  for (const inputKey of [
    "budget",
    "seedBudget",
    "policy",
    "seedPolicy",
  ] as const)
    for (const [key, field] of Object.entries(make()[inputKey]))
      if (typeof field === "number")
        malformed.push([
          `${inputKey}.${key} with NaN`,
          (value) => Object.assign(value[inputKey], { [key]: NaN }),
        ]);

  for (const [label, mutate] of malformed) {
    const value: IAutoMovieRecoveryCameraMapInput = make();
    mutate(value);
    let called: boolean = false;
    const refused: ReturnType<
      typeof AutoMovieRecoveryObservation.estimateCameraMap
    > = AutoMovieRecoveryObservation.estimateCameraMap(value, {
      onProgress: (): void => {
        called = true;
      },
    });
    TestValidator.predicate(
      `${label} refuses before observation`,
      refused.status === "refused" && !("value" in refused) && !called,
    );
  }
  for (const seed of [0, 0xffffffff]) {
    const value: IAutoMovieRecoveryCameraMapInput = make();
    Object.assign(value.budget, {
      maxPixels: 3,
      maxDescriptorPairs: 1,
      maxTracks: 1,
      maxObservations: 1,
      maxResectionTrials: 1,
      minimumResectionTrials: 1,
      maxLocalRefinements: 1,
      maxRefinementIterations: 1,
      maxLinearEntries: 1,
      maxSingularSweeps: 1,
    });
    Object.assign(value.policy, {
      minimumResectionInliers: 6,
      minimumResectionInlierFraction: 1,
      maximumDltNullRatio: 0,
      samplingSeed: seed,
    });
    value.seedBudget.maxPixels = 2;
    value.seedPolicy.samplingSeed = seed;
    const boundary = AutoMovieRecoveryObservation.estimateCameraMap(value);
    TestValidator.predicate(
      `small admitted budgets and unsigned seed ${seed} preserve sparse evidence`,
      boundary.status === "partial" &&
        boundary.value.status === "refused" &&
        boundary.value.refusalReasons[0] === "seed-refused" &&
        boundary.value.sources.length === 3 &&
        boundary.value.featureCounts.length === 3 &&
        boundary.value.featureCounts.every(
          (count: number): boolean => count === 0,
        ),
    );
  }
  const set: IAutoMovieRecoveryCameraMapInput = make();
  const viewAt = (
    index: number,
    size: number,
  ): IAutoMovieRecoveryCameraMapInput["views"][number] => {
    const rgb8 = new Uint8Array(3 * size * size);
    for (let y = 0; y < size; y++)
      for (let x = 0; x < size; x++) {
        const level =
          20 +
          (((Math.imul(Math.floor(x / 8), 73856093) ^
            Math.imul(Math.floor(y / 8), 19349663)) >>>
            0) %
            200);
        const pixel = 3 * (y * size + x);
        rgb8.fill(level, pixel, pixel + 3);
      }
    return { ...set.views[index]!, width: size, height: size, rgb8 };
  };
  const oneFirst = viewAt(0, 55);
  const oneSecond = viewAt(1, 55);
  const twoFirst = viewAt(0, 56);
  const twoSecond = viewAt(1, 56);
  const blank = set.views[0]!;
  const seedBudget = { ...set.seedBudget, maxFeatures: 2 };
  for (const [first, second, counts, expected] of [
    [oneFirst, oneSecond, [1, 1], 0],
    [oneFirst, twoSecond, [1, 2], 2],
    [twoFirst, oneSecond, [2, 1], 2],
    [twoFirst, twoSecond, [2, 2], 8],
    [blank, twoSecond, [0, 2], 0],
  ] as const) {
    const result = AutoMovieRecoveryObservation.observeCameraSet(
      [first, second],
      set.seedPolicy,
      seedBudget,
      Math.max(1, expected),
      () => {},
    );
    TestValidator.equals(
      `exact comparison work for ${counts.join("/")} features`,
      [
        result.features.map((feature) => feature.points.length),
        result.descriptorComparisons,
        result.pairs.map((pair) => [pair.first, pair.second]),
      ],
      [counts, expected, [[0, 1]]],
    );
    if (expected > 0)
      TestValidator.error(
        `one fewer comparison than required for ${counts.join("/")}`,
        () =>
          AutoMovieRecoveryObservation.observeCameraSet(
            [first, second],
            set.seedPolicy,
            seedBudget,
            expected - 1,
            () => {},
          ),
      );
  }
}
