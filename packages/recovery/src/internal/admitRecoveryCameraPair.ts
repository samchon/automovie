import type {
  IAutoMovieRecoveryCameraChartCreationOperation,
  IAutoMovieRecoveryCameraPairAdmissionOperation,
  IAutoMovieRecoveryCameraPairInput,
} from "@automovie/interface";

import { createRecoveryCameraChart } from "./createRecoveryCameraChart";

/**
 * Admit the complete closed resident pair before any image-sized allocation.
 * Calibration, provenance and rigidity remain caller assertions. All numeric
 * operating points and loop limits must be finite and explicit; representable
 * supplied pixel charts are constructed once for the later numerical phases.
 */
export function admitRecoveryCameraPair(
  input: Parameters<IAutoMovieRecoveryCameraPairAdmissionOperation.Operation>[0],
): ReturnType<IAutoMovieRecoveryCameraPairAdmissionOperation.Operation> {
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
  const charts: ReturnType<IAutoMovieRecoveryCameraChartCreationOperation.Operation>[] =
    [];
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
