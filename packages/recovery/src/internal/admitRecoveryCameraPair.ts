import type { IAutoMovieRecoveryCameraPairInput } from "@automovie/interface/recovery";

import { createRecoveryCameraChart } from "./createRecoveryCameraChart";

/**
 * Admit the complete closed resident pair before any image-sized allocation.
 * Calibration, provenance and rigidity remain caller assertions. All numeric
 * operating points and loop limits must be finite and explicit; representable
 * supplied pixel charts are constructed once for the later numerical phases.
 *
 * @evidence contracts/common.md#principled-implementation Closed keys, literals, safe-integer populations, threshold intervals, unique view identities and exact RGB lengths establish the declared classical pair problem. Aggregate pixels and descriptor populations are checked before allocation, and analytic chart round trips test finite calibration representation rather than physical accuracy.
 * @evidence contracts/common.md#clear-and-simple-design One recovery admission owner checks image-pair policy and budgets, delegating pinhole algebra to the chart owner; it neither detects features nor infers rigidity from bytes.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No default camera, repaired image size, ignored unknown member, inferred lens, accepted prefix or expected view identity rescues malformed input. Unknown uncertainty stays null and budgets are not silently increased.
 * @evidence contracts/common.md#meaningful-documentation States preallocation admission, closed records, borrowed RGB immutability, asserted calibration/provenance and arithmetic versus physical validity.
 * @evidence contracts/performance.md#efficient-algorithms Two views and fixed-size policy/budget records require constant work; RGB lengths are inspected without scanning or copying pixels. Image and feature budgets precede downstream traversal.
 * @evidence contracts/performance.md#reuse-equivalent-work The admitted charts transfer once to feature consensus, optimization and triangulation; no later phase needs to invert the supplied calibrations again.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The function returns two owned fixed-size charts and a pixel count, retaining no RGB array, callback, handle or global cache on success or refusal.
 */
export function admitRecoveryCameraPair(
  input: IAutoMovieRecoveryCameraPairInput,
): {
  charts: [
    ReturnType<typeof createRecoveryCameraChart>,
    ReturnType<typeof createRecoveryCameraChart>,
  ];
  pixels: number;
} {
  const keys: (
    value: object,
    expected: readonly string[],
    label: string,
  ) => void = (
    value: object,
    expected: readonly string[],
    label: string,
  ): void => {
    if (
      !value ||
      typeof value !== "object" ||
      Array.isArray(value) ||
      Reflect.ownKeys(value).length !== expected.length ||
      Reflect.ownKeys(value).some(
        (key: string | symbol): boolean =>
          typeof key !== "string" || !expected.includes(key),
      )
    )
      throw new Error(
        `invalid-camera-input: complete closed ${label} required`,
      );
  };
  keys(
    input,
    ["schema", "objectId", "rigidity", "cohort", "views", "policy", "budget"],
    "pair",
  );
  if (
    input.schema !== "automovie-recovery-camera-pair-v1" ||
    typeof input.objectId !== "string" ||
    !input.objectId.trim() ||
    input.rigidity !== "asserted-fixed-scene" ||
    !["analytic", "photograph", "inconsistent-stress"].includes(input.cohort) ||
    !Array.isArray(input.views) ||
    input.views.length !== 2
  )
    throw new Error(
      "invalid-camera-input: two fixed-scene views and explicit cohort required",
    );
  const p: IAutoMovieRecoveryCameraPairInput["policy"] = input.policy;
  keys(
    p,
    [
      "family",
      "minimumCornerResponse",
      "suppressionRobustness",
      "descriptorDistanceRatio",
      "maximumSampsonErrorPx",
      "samplingConfidence",
      "samplingSeed",
      "minimumInliers",
      "minimumInlierFraction",
      "maximumMedianErrorPx",
      "maximumP90ErrorPx",
      "minimumPositiveDepthFraction",
      "minimumParallaxRadians",
      "maximumHomographyOverlapFraction",
      "maximumHomographyTransferPx",
      "minimumDesignSingularRatio",
      "refinementLossScalePx",
    ],
    "policy",
  );
  const openFractions: number[] = [
    p.suppressionRobustness,
    p.descriptorDistanceRatio,
    p.samplingConfidence,
    p.minimumDesignSingularRatio,
  ];
  const closedFractions: number[] = [
    p.minimumInlierFraction,
    p.minimumPositiveDepthFraction,
    p.maximumHomographyOverlapFraction,
  ];
  const positive: number[] = [
    p.minimumCornerResponse,
    p.maximumSampsonErrorPx,
    p.maximumMedianErrorPx,
    p.maximumP90ErrorPx,
    p.minimumParallaxRadians,
    p.refinementLossScalePx,
    p.maximumHomographyTransferPx,
  ];
  if (
    p.family !== "harris-gradient-calibrated-eight-point" ||
    !openFractions.every(
      (value: number): boolean =>
        Number.isFinite(value) && value > 0 && value < 1,
    ) ||
    !closedFractions.every(
      (value: number): boolean =>
        Number.isFinite(value) && value > 0 && value <= 1,
    ) ||
    !positive.every(
      (value: number): boolean => Number.isFinite(value) && value > 0,
    ) ||
    p.minimumParallaxRadians >= Math.PI ||
    !Number.isSafeInteger(p.minimumInliers) ||
    p.minimumInliers < 8 ||
    !Number.isSafeInteger(p.samplingSeed) ||
    p.samplingSeed < 0 ||
    p.samplingSeed > 0xffffffff
  )
    throw new Error(
      "invalid-camera-input: finite operating thresholds and unsigned sampling seed required",
    );
  const b: IAutoMovieRecoveryCameraPairInput["budget"] = input.budget;
  keys(
    b,
    [
      "maxPixels",
      "maxCandidates",
      "maxFeatures",
      "maxPyramidLevels",
      "maxDescriptorPairs",
      "maxRansacTrials",
      "minimumRansacTrials",
      "maxLocalRefinements",
      "maxRefinementIterations",
      "maxSingularSweeps",
    ],
    "budget",
  );
  if (
    !Object.values(b).every(
      (value: number): boolean => Number.isSafeInteger(value) && value > 0,
    ) ||
    b.maxFeatures > b.maxCandidates ||
    b.maxFeatures > 0x7fffffff ||
    !Number.isSafeInteger(b.maxCandidates * b.maxCandidates) ||
    b.minimumRansacTrials > b.maxRansacTrials ||
    b.maxLocalRefinements > b.maxRansacTrials
  )
    throw new Error(
      "invalid-camera-input: finite compatible work budgets required",
    );
  let pixels: number = 0;
  const identities: Set<string> = new Set<string>();
  const charts: ReturnType<typeof createRecoveryCameraChart>[] = [];
  for (const view of input.views) {
    keys(
      view,
      [
        "id",
        "sourceSha256",
        "pixelProvenance",
        "width",
        "height",
        "rgb8",
        "camera",
      ],
      "view",
    );
    if (
      typeof view.id !== "string" ||
      !view.id.trim() ||
      identities.has(view.id) ||
      typeof view.sourceSha256 !== "string" ||
      !/^[0-9a-f]{64}$/.test(view.sourceSha256) ||
      typeof view.pixelProvenance !== "string" ||
      !view.pixelProvenance.trim() ||
      !Number.isSafeInteger(view.width) ||
      view.width < 1 ||
      !Number.isSafeInteger(view.height) ||
      view.height < 1 ||
      !(view.rgb8 instanceof Uint8Array)
    )
      throw new Error(
        "invalid-camera-input: unique provenance-bound resident view required",
      );
    const count: number = view.width * view.height;
    pixels += count;
    if (
      !Number.isSafeInteger(count * 3) ||
      !Number.isSafeInteger(pixels) ||
      pixels > b.maxPixels ||
      view.rgb8.length !== 3 * count
    )
      throw new Error(
        "invalid-camera-input: exact RGB population exceeds dimensions or pixel budget",
      );
    const camera: typeof view.camera = view.camera;
    keys(
      camera,
      [
        "type",
        "calibration",
        "distortion",
        "focalPx",
        "skewPx",
        "principalPointPx",
        "uncertaintyPx",
      ],
      "calibration",
    );
    if (
      camera.type !== "pinhole" ||
      camera.calibration !== "supplied-intrinsics" ||
      camera.distortion !== "caller-corrected" ||
      !Array.isArray(camera.focalPx) ||
      camera.focalPx.length !== 2 ||
      !camera.focalPx.every(
        (value: number): boolean => Number.isFinite(value) && value > 0,
      ) ||
      !Array.isArray(camera.principalPointPx) ||
      camera.principalPointPx.length !== 2 ||
      !camera.principalPointPx.every(Number.isFinite) ||
      !Number.isFinite(camera.skewPx) ||
      (camera.uncertaintyPx !== null &&
        !(Number.isFinite(camera.uncertaintyPx) && camera.uncertaintyPx >= 0))
    )
      throw new Error(
        "invalid-camera-input: independently supplied corrected pinhole chart required",
      );
    identities.add(view.id);
    charts.push(createRecoveryCameraChart(view));
  }
  return { charts: [charts[0]!, charts[1]!], pixels };
}
