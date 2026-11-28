import type {
  IAutoMovieRecoveryCameraMapBudget,
  IAutoMovieRecoveryCameraMapPolicy,
} from "@automovie/interface";

import { isRecoveryPositiveFinite } from "../../internal/isRecoveryPositiveFinite";
import { isRecoveryPositiveSafeInteger } from "../../internal/isRecoveryPositiveSafeInteger";
import { isRecoveryUnitInterval } from "../../internal/isRecoveryUnitInterval";

/*
 * Admit point, resection and joint-fit controls shared by the fixed triad and
 * incremental camera scene. A valid small cap can still exhaust a later phase.
 */
export function assertRecoveryCameraMapControls(
  policy: IAutoMovieRecoveryCameraMapPolicy,
  budget: IAutoMovieRecoveryCameraMapBudget,
): void {
  if (
    !policy ||
    !isRecoveryPositiveFinite(policy.maximumReprojectionErrorPx) ||
    !isRecoveryPositiveFinite(policy.minimumPointParallaxDegrees) ||
    policy.minimumPointParallaxDegrees >= 90 ||
    !isRecoveryPositiveSafeInteger(policy.minimumResectionInliers) ||
    policy.minimumResectionInliers < 6 ||
    !isRecoveryPositiveFinite(policy.minimumResectionInlierFraction) ||
    policy.minimumResectionInlierFraction > 1 ||
    !isRecoveryUnitInterval(policy.samplingConfidence) ||
    !Number.isInteger(policy.samplingSeed) ||
    policy.samplingSeed < 0 ||
    policy.samplingSeed > 0xffffffff ||
    !isRecoveryUnitInterval(policy.minimumDesignSingularRatio) ||
    !Number.isFinite(policy.maximumDltNullRatio) ||
    policy.maximumDltNullRatio < 0 ||
    policy.maximumDltNullRatio >= 1 ||
    !isRecoveryUnitInterval(policy.maximumRotationProjectionError) ||
    !isRecoveryPositiveFinite(policy.lossScalePx)
  )
    throw new Error("camera-admission: invalid map policy");
  if (
    !budget ||
    ![
      budget.maxPixels,
      budget.maxDescriptorPairs,
      budget.maxTracks,
      budget.maxObservations,
      budget.maxResectionTrials,
      budget.minimumResectionTrials,
      budget.maxLocalRefinements,
      budget.maxRefinementIterations,
      budget.maxLinearEntries,
      budget.maxSingularSweeps,
    ].every(isRecoveryPositiveSafeInteger) ||
    budget.minimumResectionTrials > budget.maxResectionTrials
  )
    throw new Error("camera-admission: invalid map budget");
}
