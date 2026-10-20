import type {
  IAutoMovieRecoveryCameraMapInput,
  IAutoMovieRecoveryCameraPairInput,
} from "@automovie/interface/recovery";

import { admitRecoveryCameraPair } from "./admitRecoveryCameraPair";
import type { createRecoveryCameraChart } from "./createRecoveryCameraChart";

/**
 * Admit the closed three-view map and supplied charts before image allocation.
 * Pair admission retains unchanged seed semantics; third-view admission uses
 * the explicitly declared aggregate map pixel ceiling, without fitting a pair.
 *
 * @evidence contracts/common.md#principled-implementation Closed records, exact three unique view identities, explicit finite thresholds, safe work ceilings and delegated existing pixel/calibration admission establish the supported calibrated triad. Conservative linear-entry capacity covers all retained point blocks before numerical design allocation.
 * @evidence contracts/common.md#clear-and-simple-design One map-specific admission owner checks new populations while the existing pair owner retains feature, seed and camera chart semantics.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No missing member, hidden default, raised admitted work limit, inferred calibration or fourth view is silently accepted.
 * @evidence contracts/common.md#meaningful-documentation States three-view support, separate seed-pair versus map pixels, preallocation entry bounds and caller-asserted calibration/rigidity.
 * @evidence contracts/performance.md#efficient-algorithms Fixed-size records and three chart checks require constant work without scanning or copying RGB pixels; bounded feature populations precede image allocation.
 * @evidence contracts/performance.md#reuse-equivalent-work The existing seed admission supplies its two charts, and third-view admission contributes only its new chart to the map owner.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Three owned fixed-size charts transfer to the caller; borrowed input pixels are neither copied nor retained globally and no external resource is acquired.
 */
export function admitRecoveryCameraMap(
  input: IAutoMovieRecoveryCameraMapInput,
): ReturnType<typeof createRecoveryCameraChart>[] {
  const closed: (value: object, keys: readonly string[]) => void = (
    value: object,
    keys: readonly string[],
  ): void => {
    if (
      !value ||
      typeof value !== "object" ||
      Array.isArray(value) ||
      Reflect.ownKeys(value).length !== keys.length ||
      Reflect.ownKeys(value).some(
        (key: string | symbol): boolean =>
          typeof key !== "string" || !keys.includes(key),
      )
    )
      throw new Error("invalid-camera-map: complete closed records required");
  };
  closed(input, [
    "schema",
    "objectId",
    "rigidity",
    "cohort",
    "views",
    "seedPolicy",
    "seedBudget",
    "policy",
    "budget",
  ]);
  if (
    input.schema !== "automovie-recovery-camera-map-input-v1" ||
    !Array.isArray(input.views) ||
    input.views.length !== 3
  )
    throw new Error(
      "invalid-camera-map: exactly three calibrated views required",
    );
  const policy: IAutoMovieRecoveryCameraMapInput["policy"] = input.policy,
    budget: IAutoMovieRecoveryCameraMapInput["budget"] = input.budget;
  closed(policy, [
    "maximumReprojectionErrorPx",
    "minimumPointParallaxDegrees",
    "minimumResectionInliers",
    "minimumResectionInlierFraction",
    "samplingConfidence",
    "samplingSeed",
    "minimumDesignSingularRatio",
    "maximumDltNullRatio",
    "maximumRotationProjectionError",
    "lossScalePx",
  ]);
  closed(budget, [
    "maxPixels",
    "maxDescriptorPairs",
    "maxTracks",
    "maxObservations",
    "maxResectionTrials",
    "minimumResectionTrials",
    "maxLocalRefinements",
    "maxRefinementIterations",
    "maxLinearEntries",
    "maxSingularSweeps",
  ]);
  if (
    !Object.values(policy).every(Number.isFinite) ||
    !Object.values(budget).every(
      (value: number): boolean => Number.isSafeInteger(value) && value > 0,
    ) ||
    !(policy.maximumReprojectionErrorPx > 0) ||
    !(
      policy.minimumPointParallaxDegrees > 0 &&
      policy.minimumPointParallaxDegrees < 90
    ) ||
    !Number.isSafeInteger(policy.minimumResectionInliers) ||
    policy.minimumResectionInliers < 6 ||
    !(
      policy.minimumResectionInlierFraction > 0 &&
      policy.minimumResectionInlierFraction <= 1
    ) ||
    !(policy.samplingConfidence > 0 && policy.samplingConfidence < 1) ||
    !Number.isSafeInteger(policy.samplingSeed) ||
    policy.samplingSeed < 0 ||
    policy.samplingSeed > 0xffffffff ||
    !(
      policy.minimumDesignSingularRatio > 0 &&
      policy.minimumDesignSingularRatio < 1
    ) ||
    !(policy.maximumDltNullRatio >= 0 && policy.maximumDltNullRatio < 1) ||
    !(
      policy.maximumRotationProjectionError > 0 &&
      policy.maximumRotationProjectionError < 1
    ) ||
    !(policy.lossScalePx > 0) ||
    budget.minimumResectionTrials > budget.maxResectionTrials ||
    budget.maxLinearEntries < 144 ||
    budget.maxTracks < policy.minimumResectionInliers ||
    budget.maxObservations < 2 * policy.minimumResectionInliers ||
    !Number.isSafeInteger(budget.maxObservations * 30 + 242) ||
    budget.maxObservations * 30 + 242 > budget.maxLinearEntries
  )
    throw new Error(
      "invalid-camera-map: explicit finite thresholds and compatible work limits required",
    );
  const seed: IAutoMovieRecoveryCameraPairInput = {
    schema: "automovie-recovery-camera-pair-v1",
    objectId: input.objectId,
    rigidity: input.rigidity,
    cohort: input.cohort,
    views: input.views.slice(0, 2),
    policy: input.seedPolicy,
    budget: input.seedBudget,
  };
  const first: ReturnType<typeof admitRecoveryCameraPair> =
    admitRecoveryCameraPair(seed);
  const third: ReturnType<typeof admitRecoveryCameraPair> =
    admitRecoveryCameraPair({
      ...seed,
      views: [input.views[0]!, input.views[2]!],
      budget: { ...input.seedBudget, maxPixels: budget.maxPixels },
    });
  const pixels: number = input.views.reduce(
    (sum: number, view: (typeof input.views)[number]): number =>
      sum + view.width * view.height,
    0,
  );
  if (
    new Set(
      input.views.map((view: (typeof input.views)[number]): string => view.id),
    ).size !== 3 ||
    !Number.isSafeInteger(pixels) ||
    pixels > budget.maxPixels ||
    !Number.isSafeInteger(3 * input.seedBudget.maxFeatures)
  )
    throw new Error(
      "invalid-camera-map: unique views and aggregate pixels required",
    );
  return [...first.charts, third.charts[1]];
}
