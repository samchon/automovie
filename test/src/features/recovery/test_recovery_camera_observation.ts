import type { IAutoMovieRecoveryCameraPairInput } from "@automovie/interface/recovery";
import { TestValidator } from "@nestia/e2e";

import { admitRecoveryCameraPair } from "../../../../packages/recovery/src/internal/admitRecoveryCameraPair";
import { extractRecoveryImageFeatures } from "../../../../packages/recovery/src/internal/extractRecoveryImageFeatures";
import { filterRecoveryImageGaussian } from "../../../../packages/recovery/src/internal/filterRecoveryImageGaussian";
import { matchRecoveryImageFeatures } from "../../../../packages/recovery/src/internal/matchRecoveryImageFeatures";
import { nclose } from "../internal/nclose";

/**
 * Automatic RGB observations preserve translated/rotated texture and reject ties.
 *
 * Scenarios:
 * 1. A constant chart remains constant under reflected Gaussian filtering and has zero derivative; a horizontal ramp has the independently derived positive interior derivative.
 * 2. A deterministic synthetic texture, its integer translation and an independently permuted quarter turn produce automatic matches in their known pixel charts, while borrowed RGB remains unchanged.
 * 3. Distinct descriptors match uniquely, repeated descriptors refuse material identity and pair-work exhaustion throws before comparison.
 * 4. Complete one-pixel resident charts admit, while duplicate identities, unknown keys, wrong RGB lengths, weak dimensions and incompatible budgets refuse.
 *
 * @evidence contracts/testing.md#behavioral-verification Runs actual Gaussian sampling, RGB feature extraction, exhaustive matching and complete pair admission. It asserts analytic filter response, automatically observed displacement, borrowed-byte lifetime, ambiguity refusal and preallocation failure rather than repository structure.
 * @evidence contracts/testing.md#independent-expectations A constant and a linear ramp have analytic Gaussian responses; the discrete truncated derivative's ramp gain is the independently summed Gaussian second moment. Integer shifting one mathematical texture gives the known displacement of three columns and two rows; permuting source pixel (x,y) to (143-y,x) gives a quarter turn with exchanged dimensions and no interpolation. Orthogonal unit descriptors have exact independent distances; no camera, feature position or output snapshot is supplied to extraction.
 * @evidence contracts/testing.md#distinguishing-cases Covers flat and changing grayscale fields, reflected boundaries, real automatic nonzero feature output, quarter-turn orientation and dimension covariance, source immutability, repeated-feature ambiguity, empty second-neighbour support, exact pair-budget overflow, singleton pixels, duplicate provenance identities, unknown members and invalid policy/work limits. Arbitrary scale/viewpoint repeatability, perspective pose and photographic accuracy remain separate tests or fixed experiments.
 * @evidence contracts/testing.md#execution-ownership The portable test_recovery_camera_observation entry owns small synthetic pixel/descriptor arrays and synchronous assertions only. It installs nothing, starts no process or GPU, accesses no photographed dataset and replaces no foreign implementation.
 */
export function test_recovery_camera_observation(): void {
  const constant: Float64Array = new Float64Array(99).fill(37);
  const smoothed: Float64Array = filterRecoveryImageGaussian(
    constant,
    11,
    9,
    1,
  );
  const derivative: Float64Array = filterRecoveryImageGaussian(
    constant,
    11,
    9,
    1,
    "x",
  );
  TestValidator.predicate(
    "reflection preserves constants and zero derivatives at every boundary",
    smoothed.every((value: number): boolean => nclose(value, 37, 1e-12)) &&
      derivative.every((value: number): boolean => nclose(value, 0, 1e-12)),
  );
  const ramp: Float64Array = Float64Array.from(
    { length: 99 },
    (_: unknown, at: number): number => at % 11,
  );
  let normalizer: number = 0,
    moment: number = 0;
  for (let offset: number = -4; offset <= 4; offset++) {
    const weight: number = Math.exp((-offset * offset) / 2);
    normalizer += weight;
    moment += offset * offset * weight;
  }
  TestValidator.predicate(
    "increasing x has the analytic positive truncated-Gaussian derivative",
    nclose(
      filterRecoveryImageGaussian(ramp, 11, 9, 1, "x")[4 * 11 + 5]!,
      moment / normalizer,
      1e-12,
    ),
  );
  const policy: IAutoMovieRecoveryCameraPairInput["policy"] = {
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
  };
  const budget: IAutoMovieRecoveryCameraPairInput["budget"] = {
    maxPixels: 160 * 144 * 2,
    maxCandidates: 5000,
    maxFeatures: 64,
    maxPyramidLevels: 1,
    maxDescriptorPairs: 4096,
    maxRansacTrials: 128,
    minimumRansacTrials: 32,
    maxLocalRefinements: 4,
    maxRefinementIterations: 100,
    maxSingularSweeps: 64,
  };
  const makeView: (
    id: string,
    dx: number,
    dy: number,
  ) => IAutoMovieRecoveryCameraPairInput["views"][number] = (
    id: string,
    dx: number,
    dy: number,
  ): IAutoMovieRecoveryCameraPairInput["views"][number] => {
    const rgb8: Uint8Array = new Uint8Array(160 * 144 * 3);
    for (let y: number = 0; y < 144; y++)
      for (let x: number = 0; x < 160; x++) {
        const cellX: number = Math.floor((x - dx) / 8),
          cellY: number = Math.floor((y - dy) / 8);
        const value: number =
          20 +
          (((Math.imul(cellX, 73856093) ^ Math.imul(cellY, 19349663)) >>> 0) %
            200);
        for (let channel: number = 0; channel < 3; channel++)
          rgb8[(y * 160 + x) * 3 + channel] = value;
      }
    return {
      id,
      sourceSha256: "0".repeat(64),
      pixelProvenance: "analytic integer-translated texture",
      width: 160,
      height: 144,
      rgb8,
      camera: {
        type: "pinhole",
        calibration: "supplied-intrinsics",
        distortion: "caller-corrected",
        focalPx: [300, 310],
        skewPx: 0,
        principalPointPx: [80, 72],
        uncertaintyPx: null,
      },
    };
  };
  const first: ReturnType<typeof makeView> = makeView("first", 0, 0),
    second: ReturnType<typeof makeView> = makeView("second", 3, 2);
  const original: Uint8Array = first.rgb8.slice();
  const input: IAutoMovieRecoveryCameraPairInput = {
    schema: "automovie-recovery-camera-pair-v1",
    objectId: "analytic-texture",
    rigidity: "asserted-fixed-scene",
    cohort: "analytic",
    views: [first, second],
    policy,
    budget,
  };
  const admitted: ReturnType<typeof admitRecoveryCameraPair> =
    admitRecoveryCameraPair(input);
  const a: ReturnType<typeof extractRecoveryImageFeatures> =
    extractRecoveryImageFeatures(first, policy, budget);
  const b: ReturnType<typeof extractRecoveryImageFeatures> =
    extractRecoveryImageFeatures(second, policy, budget);
  const matches: ReturnType<typeof matchRecoveryImageFeatures> =
    matchRecoveryImageFeatures(
      a.points,
      b.points,
      0.7,
      budget.maxDescriptorPairs,
    );
  const correct: number = matches.filter(
    (match: (typeof matches)[number]): boolean =>
      Math.hypot(
        match.second[0] - match.first[0] - 3,
        match.second[1] - match.first[1] - 2,
      ) < 0.2,
  ).length;
  TestValidator.predicate(
    "automatic observations recover actual translated texture with unchanged source bytes",
    admitted.pixels === 160 * 144 * 2 &&
      a.points.length > 0 &&
      b.points.length > 0 &&
      matches.length >= 8 &&
      correct / matches.length >= 0.9 &&
      first.rgb8.every(
        (value: number, at: number): boolean => value === original[at],
      ),
  );
  const turnedPixels: Uint8Array = new Uint8Array(first.rgb8.length);
  for (let y: number = 0; y < 144; y++)
    for (let x: number = 0; x < 160; x++)
      for (let channel: number = 0; channel < 3; channel++)
        turnedPixels[(x * 144 + 143 - y) * 3 + channel] =
          original[(y * 160 + x) * 3 + channel]!;
  const turned: ReturnType<typeof extractRecoveryImageFeatures> =
    extractRecoveryImageFeatures(
      {
        ...first,
        id: "quarter-turn",
        width: 144,
        height: 160,
        rgb8: turnedPixels,
      },
      policy,
      budget,
    );
  const rotatedMatches: ReturnType<typeof matchRecoveryImageFeatures> =
    matchRecoveryImageFeatures(
      a.points,
      turned.points,
      0.7,
      budget.maxDescriptorPairs,
    );
  TestValidator.predicate(
    "automatic orientation follows an independently permuted quarter turn",
    rotatedMatches.length >= 8 &&
      rotatedMatches.filter(
        (match: (typeof rotatedMatches)[number]): boolean =>
          Math.hypot(
            match.second[0] - (143 - match.first[1]),
            match.second[1] - match.first[0],
          ) < 0.2,
      ).length /
        rotatedMatches.length >=
        0.9,
  );
  const feature: (axis: number) => (typeof a.points)[number] = (
    axis: number,
  ): (typeof a.points)[number] => {
    const descriptor: Float64Array = new Float64Array(128);
    descriptor[axis] = 1;
    return {
      point: [axis + 10, 20],
      scale: 1,
      orientationRadians: 0,
      response: 10,
      descriptor,
    };
  };
  TestValidator.predicate(
    "distinct unit descriptors match while repeated descriptors do not invent identity",
    matchRecoveryImageFeatures(
      [feature(0), feature(1)],
      [feature(0), feature(1)],
      0.7,
      4,
    ).length === 2 &&
      matchRecoveryImageFeatures(
        [feature(0), feature(1)],
        [feature(0), feature(0), feature(1)],
        0.7,
        6,
      ).length === 1 &&
      matchRecoveryImageFeatures([feature(0)], [feature(0)], 0.7, 1).length ===
        0,
  );
  const tinyViews: typeof input.views = input.views.map(
    (view: typeof first): typeof first => ({
      ...view,
      width: 1,
      height: 1,
      rgb8: new Uint8Array(3),
    }),
  );
  TestValidator.predicate(
    "complete one-pixel charts admit without a fabricated feature population",
    admitRecoveryCameraPair({
      ...input,
      views: tinyViews,
      budget: { ...budget, maxPixels: 2 },
    }).pixels === 2,
  );
  const invalid: (() => unknown)[] = [
    (): unknown =>
      matchRecoveryImageFeatures(
        [feature(0), feature(1)],
        [feature(0), feature(1)],
        0.7,
        3,
      ),
    (): unknown => admitRecoveryCameraPair({ ...input, views: [first, first] }),
    (): unknown =>
      admitRecoveryCameraPair(Object.assign({}, input, { unknown: true })),
    (): unknown =>
      admitRecoveryCameraPair({
        ...input,
        views: [{ ...first, rgb8: new Uint8Array(1) }, second],
      }),
    (): unknown =>
      admitRecoveryCameraPair({
        ...input,
        views: [{ ...first, width: 0 }, second],
      }),
    (): unknown =>
      admitRecoveryCameraPair({
        ...input,
        budget: { ...budget, maxFeatures: budget.maxCandidates + 1 },
      }),
    (): unknown =>
      admitRecoveryCameraPair({
        ...input,
        policy: { ...policy, samplingSeed: -1 },
      }),
  ];
  for (const action of invalid) {
    let refused: boolean = false;
    try {
      action();
    } catch (error: unknown) {
      refused = error instanceof Error;
    }
    TestValidator.predicate(
      "malformed acquisition or exhausted comparison work refuses",
      refused,
    );
  }
}
