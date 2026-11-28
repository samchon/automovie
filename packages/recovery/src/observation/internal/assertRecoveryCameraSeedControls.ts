import type {
  IAutoMovieRecoveryCameraBudget,
  IAutoMovieRecoveryCameraPolicy,
} from "@automovie/interface";

import { isRecoveryPositiveFinite } from "../../internal/isRecoveryPositiveFinite";
import { isRecoveryPositiveSafeInteger } from "../../internal/isRecoveryPositiveSafeInteger";
import { isRecoveryUnitInterval } from "../../internal/isRecoveryUnitInterval";

/*
 * Admit the shared two-view feature, matching and qualification controls
 * before building a camera chart or observing borrowed pixels.
 */
export function assertRecoveryCameraSeedControls(
  policy: IAutoMovieRecoveryCameraPolicy,
  budget: IAutoMovieRecoveryCameraBudget,
): void {
  if (
    !policy ||
    policy.family !== "harris-gradient-calibrated-eight-point" ||
    !isRecoveryPositiveFinite(policy.minimumCornerResponse) ||
    !isRecoveryUnitInterval(policy.suppressionRobustness) ||
    !isRecoveryUnitInterval(policy.descriptorDistanceRatio) ||
    !isRecoveryPositiveFinite(policy.maximumSampsonErrorPx) ||
    !isRecoveryUnitInterval(policy.samplingConfidence) ||
    !Number.isInteger(policy.samplingSeed) ||
    policy.samplingSeed < 0 ||
    policy.samplingSeed > 0xffffffff ||
    !isRecoveryPositiveSafeInteger(policy.minimumInliers) ||
    policy.minimumInliers < 8 ||
    !positiveFraction(policy.minimumInlierFraction) ||
    !isRecoveryPositiveFinite(policy.maximumMedianErrorPx) ||
    !isRecoveryPositiveFinite(policy.maximumP90ErrorPx) ||
    !positiveFraction(policy.minimumPositiveDepthFraction) ||
    !isRecoveryPositiveFinite(policy.minimumParallaxRadians) ||
    !positiveFraction(policy.maximumHomographyOverlapFraction) ||
    !isRecoveryPositiveFinite(policy.maximumHomographyTransferPx) ||
    !isRecoveryPositiveFinite(policy.minimumDesignSingularRatio) ||
    !isRecoveryPositiveFinite(policy.refinementLossScalePx)
  )
    throw new Error("camera-admission: invalid seed policy");
  if (
    !budget ||
    ![
      budget.maxPixels,
      budget.maxCandidates,
      budget.maxFeatures,
      budget.maxPyramidLevels,
      budget.maxDescriptorPairs,
      budget.maxRansacTrials,
      budget.minimumRansacTrials,
      budget.maxLocalRefinements,
      budget.maxRefinementIterations,
      budget.maxSingularSweeps,
    ].every(isRecoveryPositiveSafeInteger) ||
    budget.maxFeatures > budget.maxCandidates ||
    budget.minimumRansacTrials > budget.maxRansacTrials
  )
    throw new Error("camera-admission: invalid seed budget");
}

function positiveFraction(value: number): boolean {
  return isRecoveryPositiveFinite(value) && value <= 1;
}
