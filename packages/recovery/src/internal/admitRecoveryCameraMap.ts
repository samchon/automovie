import type {
  IAutoMovieRecoveryCameraMapAdmissionOperation,
  IAutoMovieRecoveryCameraMapInput,
  IAutoMovieRecoveryCameraPairAdmissionOperation,
  IAutoMovieRecoveryCameraPairInput,
} from "@automovie/interface";

import { admitRecoveryCameraPair } from "./admitRecoveryCameraPair";

/**
 * Admit the closed three-view map and supplied charts before image allocation.
 * Pair admission retains unchanged seed semantics; third-view admission uses
 * the explicitly declared aggregate map pixel ceiling, without fitting a pair.
 */
export function admitRecoveryCameraMap(
  input: Parameters<IAutoMovieRecoveryCameraMapAdmissionOperation.Operation>[0],
): ReturnType<IAutoMovieRecoveryCameraMapAdmissionOperation.Operation> {
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
  const first: ReturnType<IAutoMovieRecoveryCameraPairAdmissionOperation.Operation> =
    admitRecoveryCameraPair(seed);
  const third: ReturnType<IAutoMovieRecoveryCameraPairAdmissionOperation.Operation> =
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
