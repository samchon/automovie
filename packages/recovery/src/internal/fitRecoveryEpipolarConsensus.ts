import type { IAutoMovieRecoveryCameraPairInput } from "@automovie/interface/recovery";

import { calibrateRecoveryEpipolarMatrix } from "./calibrateRecoveryEpipolarMatrix";
import type { createRecoveryCameraChart } from "./createRecoveryCameraChart";
import { fitRecoveryEpipolarMatrix } from "./fitRecoveryEpipolarMatrix";
import { isRecoveryCameraNumericalRefusal } from "./isRecoveryCameraNumericalRefusal";
import { measureRecoveryEpipolarErrors } from "./measureRecoveryEpipolarErrors";
import { refineRecoveryEpipolarModel } from "./refineRecoveryEpipolarModel";
import { requiredRecoveryCameraTrials } from "./requiredRecoveryCameraTrials";
import { sampleRecoveryCameraIndices } from "./sampleRecoveryCameraIndices";
import { scoreRecoveryCameraResiduals } from "./scoreRecoveryCameraResiduals";

/**
 * Estimate a calibrated pixel epipolar consensus with bounded local refinement.
 * Every proposal is projected to the supplied-calibration essential manifold
 * before scoring. The first bounded proposals with at least eight calibrated
 * inliers receive local refinement before comparison with the current winner;
 * a raw score cannot bound the result of local optimization. Final re-estimation
 * invalidates an older sampling target;
 * any larger target resumes proposals within the same total trial budget.
 *
 * @evidence contracts/common.md#principled-implementation Original-design normalized eight-point proposals, equal-singular essential projection and signed pixel Sampson support define one calibrated objective. Up to the caller's L eligible proposals receive five-coordinate local optimization before winner comparison, because raw support is not an upper bound on refined support. A still-changing subset may supply a provisional hypothesis only when every continuous fit converged; independent final refits must stabilize before qualification. Neither fit residual nor ideal sampling target proves material correspondence or camera truth.
 * @evidence contracts/common.md#clear-and-simple-design This owner coordinates reproducible proposal identity, full-population scores and local-subset convergence; final physical pose selection, planar ambiguity and source publication remain separate responsibilities.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No raw winner suppresses an eligible local attempt within the explicit budget. No uncalibrated-F residual qualifies a pose, no older inlier fraction supplies final confidence, and no truth camera, normal equations, exhausted optimizer or ignored unexpected error becomes a winning local refinement. A provisional changing subset does not inherit final convergence.
 * @evidence contracts/common.md#meaningful-documentation States calibrated scoring order, domain-separated seed, minimum/maximum trials, local proposal budget, final-target continuation, numerical refusal counts and conditional sampling limitations.
 * @evidence contracts/performance.md#efficient-algorithms T proposals over M matches require bounded nine-column SVD plus O(M log M) scoring per proposal. At most the declared L proposals with eight calibrated inliers receive three bounded local fits in draw order, independent of winner score; final target readjustments strictly advance trial work, so at most T final re-estimations occur. O(M) current/best scratch and only the last refit's diagnostics are retained. Exhausting the local budget can miss a better basin and the ideal sampling target does not bound that risk.
 * @evidence contracts/performance.md#reuse-equivalent-work Each calibrated proposal scores all tentative matches once. Successful local work replaces a proposal only on a better complete score, and unchanged final support terminates immediately; changed support updates the conditional target before any further draw.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The synchronous owner returns one best matrix, O(M) indices, the last at-most-three fit summaries and scalar counters; replaced proposals and local arrays expire without images, handles, callbacks or global state.
 */
export function fitRecoveryEpipolarConsensus(
  firstPoints: readonly (readonly [number, number])[],
  secondPoints: readonly (readonly [number, number])[],
  first: ReturnType<typeof createRecoveryCameraChart>,
  second: ReturnType<typeof createRecoveryCameraChart>,
  policy: IAutoMovieRecoveryCameraPairInput["policy"],
  budget: IAutoMovieRecoveryCameraPairInput["budget"],
  checkpoint: (completed: number, total: number) => void,
): {
  matrix: number[] | null;
  score: ReturnType<typeof scoreRecoveryCameraResiduals>;
  trials: number;
  requiredTrialsAtFinalSupport: number | null;
  conditionalTrialTargetMet: boolean;
  numericalRefusals: number;
  localRefinements: number;
  localRefinementRefusals: number;
  finalReestimations: number;
  finalRefinement: ReturnType<typeof refineRecoveryEpipolarModel> | null;
} {
  if (firstPoints.length !== secondPoints.length || firstPoints.length < 8)
    throw new Error("camera-design: at least eight tentative pairs required");
  let matrix: number[] | null = null;
  let score: ReturnType<typeof scoreRecoveryCameraResiduals> = { indices: [], medianPx: null, p90Px: null };
  let trials: number = 0, numericalRefusals: number = 0, localRefinements: number = 0;
  let localRefinementRefusals: number = 0, finalReestimations: number = 0;
  let required: number = Infinity;
  let finalRefinement: ReturnType<typeof refineRecoveryEpipolarModel> | null = null;
  while (trials < budget.maxRansacTrials) {
    while (trials < budget.maxRansacTrials && (trials < budget.minimumRansacTrials || trials < required)) {
      checkpoint(trials, budget.maxRansacTrials);
      // ASCII FUND gives this model a reproducible domain distinct from HOMO.
      const sample: number[] = sampleRecoveryCameraIndices(firstPoints.length, 8, policy.samplingSeed, 0x46554e44, trials);
      trials++;
      let candidate: number[];
      let candidateScore: typeof score;
      try {
        const original: ReturnType<typeof fitRecoveryEpipolarMatrix> = fitRecoveryEpipolarMatrix(
          sample.map((at: number): readonly [number, number] => firstPoints[at]!),
          sample.map((at: number): readonly [number, number] => secondPoints[at]!),
          policy.minimumDesignSingularRatio, budget.maxSingularSweeps);
        candidate = calibrateRecoveryEpipolarMatrix(original.matrix, first, second, budget.maxSingularSweeps).fundamental;
        const errors: ReturnType<typeof measureRecoveryEpipolarErrors> = measureRecoveryEpipolarErrors(candidate, firstPoints, secondPoints);
        candidateScore = scoreRecoveryCameraResiduals(errors.map((error: typeof errors[number]): number | null =>
          error?.signedSampsonPx ?? null), policy.maximumSampsonErrorPx);
      } catch (error: unknown) {
        if (!isRecoveryCameraNumericalRefusal(error)) throw error;
        numericalRefusals++; continue;
      }
      if (candidateScore.indices.length >= 8 && localRefinements < budget.maxLocalRefinements) {
        localRefinements++;
        try {
          const refined: ReturnType<typeof refineRecoveryEpipolarModel> = refineRecoveryEpipolarModel(
            candidate, candidateScore, firstPoints, secondPoints, first, second, policy, budget);
          // Subset stability belongs to final qualification, not hypothesis
          // discovery. A spent continuous optimizer still cannot compete.
          const provisional: boolean = refined.converged ||
            (refined.refusal === "inlier-refit-budget" && refined.fits.length > 0 &&
              refined.fits.every((fit: typeof refined.fits[number]): boolean => fit.converged));
          if (provisional && (refined.score.indices.length > candidateScore.indices.length ||
            (refined.score.indices.length === candidateScore.indices.length &&
              (refined.score.medianPx ?? Infinity) < (candidateScore.medianPx ?? Infinity)))) {
            candidate = refined.matrix; candidateScore = refined.score;
          }
          if (!refined.converged) localRefinementRefusals++;
        } catch (error: unknown) {
          if (!isRecoveryCameraNumericalRefusal(error)) throw error;
          localRefinementRefusals++;
        }
      }
      if (candidateScore.indices.length < score.indices.length ||
        (candidateScore.indices.length === score.indices.length &&
          (candidateScore.medianPx ?? Infinity) >= (score.medianPx ?? Infinity))) continue;
      matrix = candidate; score = candidateScore;
      required = requiredRecoveryCameraTrials(firstPoints.length, score.indices.length, 8, policy.samplingConfidence);
    }
    if (matrix === null || score.indices.length < 8) break;
    checkpoint(trials, budget.maxRansacTrials);
    finalReestimations++;
    try {
      finalRefinement = refineRecoveryEpipolarModel(matrix, score, firstPoints, secondPoints, first, second, policy, budget);
    } catch (error: unknown) {
      if (!isRecoveryCameraNumericalRefusal(error)) throw error;
      localRefinementRefusals++; finalRefinement = null; break;
    }
    matrix = finalRefinement.matrix; score = finalRefinement.score;
    required = requiredRecoveryCameraTrials(firstPoints.length, score.indices.length, 8, policy.samplingConfidence);
    if (!finalRefinement.converged || trials >= Math.max(budget.minimumRansacTrials, required)) break;
  }
  checkpoint(trials, budget.maxRansacTrials);
  return { matrix, score, trials, requiredTrialsAtFinalSupport: Number.isFinite(required) ? required : null,
    conditionalTrialTargetMet: trials >= required && trials >= budget.minimumRansacTrials,
    numericalRefusals, localRefinements, localRefinementRefusals, finalReestimations, finalRefinement };
}
