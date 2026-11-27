import type {
  IAutoMovieRecoveryCameraResidualsScoreOperation,
  IAutoMovieRecoveryEpipolarConsensusFittingOperation,
  IAutoMovieRecoveryEpipolarErrorsMeasurementOperation,
  IAutoMovieRecoveryEpipolarMatrixFittingOperation,
  IAutoMovieRecoveryEpipolarModelRefinementOperation,
} from "@automovie/interface";

import { calibrateRecoveryEpipolarMatrix } from "./calibrateRecoveryEpipolarMatrix";
import { fitRecoveryEpipolarMatrix } from "./fitRecoveryEpipolarMatrix";
import { isRecoveryCameraNumericalRefusal } from "../../observation/internal/isRecoveryCameraNumericalRefusal";
import { measureRecoveryEpipolarErrors } from "./measureRecoveryEpipolarErrors";
import { refineRecoveryEpipolarModel } from "./refineRecoveryEpipolarModel";
import { requiredRecoveryCameraTrials } from "./requiredRecoveryCameraTrials";
import { sampleRecoveryCameraIndices } from "./sampleRecoveryCameraIndices";
import { scoreRecoveryCameraResiduals } from "./scoreRecoveryCameraResiduals";

/**
 * Estimate a calibrated pixel epipolar consensus with bounded local refinement.
 * Every proposal is projected to the supplied-calibration essential manifold
 * before scoring. The first bounded proposals with at least eight calibrated
 * inliers receive local refinement before comparison with the current winner; a
 * raw score cannot bound the result of local optimization. Final re-estimation
 * invalidates an older sampling target; any larger target resumes proposals
 * within the same total trial budget.
 */
export function fitRecoveryEpipolarConsensus(
  firstPoints: Parameters<IAutoMovieRecoveryEpipolarConsensusFittingOperation.Operation>[0],
  secondPoints: Parameters<IAutoMovieRecoveryEpipolarConsensusFittingOperation.Operation>[1],
  first: Parameters<IAutoMovieRecoveryEpipolarConsensusFittingOperation.Operation>[2],
  second: Parameters<IAutoMovieRecoveryEpipolarConsensusFittingOperation.Operation>[3],
  policy: Parameters<IAutoMovieRecoveryEpipolarConsensusFittingOperation.Operation>[4],
  budget: Parameters<IAutoMovieRecoveryEpipolarConsensusFittingOperation.Operation>[5],
  checkpoint: Parameters<IAutoMovieRecoveryEpipolarConsensusFittingOperation.Operation>[6],
): ReturnType<IAutoMovieRecoveryEpipolarConsensusFittingOperation.Operation> {
  if (firstPoints.length !== secondPoints.length || firstPoints.length < 8)
    throw new Error("camera-design: at least eight tentative pairs required");
  let matrix: number[] | null = null;
  let score: ReturnType<IAutoMovieRecoveryCameraResidualsScoreOperation.Operation> =
    {
      indices: [],
      medianPx: null,
      p90Px: null,
    };
  let trials: number = 0,
    numericalRefusals: number = 0,
    localRefinements: number = 0;
  let localRefinementRefusals: number = 0,
    finalReestimations: number = 0;
  let required: number = Infinity;
  let finalRefinement: ReturnType<IAutoMovieRecoveryEpipolarModelRefinementOperation.Operation> | null =
    null;
  while (trials < budget.maxRansacTrials) {
    while (
      trials < budget.maxRansacTrials &&
      (trials < budget.minimumRansacTrials || trials < required)
    ) {
      checkpoint(trials, budget.maxRansacTrials);
      // ASCII FUND gives this model a reproducible domain distinct from HOMO.
      const sample: number[] = sampleRecoveryCameraIndices(
        firstPoints.length,
        8,
        policy.samplingSeed,
        0x46554e44,
        trials,
      );
      trials++;
      let candidate: number[];
      let candidateScore: typeof score;
      try {
        const original: ReturnType<IAutoMovieRecoveryEpipolarMatrixFittingOperation.Operation> =
          fitRecoveryEpipolarMatrix(
            sample.map(
              (at: number): readonly [number, number] => firstPoints[at]!,
            ),
            sample.map(
              (at: number): readonly [number, number] => secondPoints[at]!,
            ),
            policy.minimumDesignSingularRatio,
            budget.maxSingularSweeps,
          );
        candidate = calibrateRecoveryEpipolarMatrix(
          original.matrix,
          first,
          second,
          budget.maxSingularSweeps,
        ).fundamental;
        const errors: ReturnType<IAutoMovieRecoveryEpipolarErrorsMeasurementOperation.Operation> =
          measureRecoveryEpipolarErrors(candidate, firstPoints, secondPoints);
        candidateScore = scoreRecoveryCameraResiduals(
          errors.map(
            (error: (typeof errors)[number]): number | null =>
              error?.signedSampsonPx ?? null,
          ),
          policy.maximumSampsonErrorPx,
        );
      } catch (error: unknown) {
        if (!isRecoveryCameraNumericalRefusal(error)) throw error;
        numericalRefusals++;
        continue;
      }
      if (
        candidateScore.indices.length >= 8 &&
        localRefinements < budget.maxLocalRefinements
      ) {
        localRefinements++;
        try {
          const refined: ReturnType<IAutoMovieRecoveryEpipolarModelRefinementOperation.Operation> =
            refineRecoveryEpipolarModel(
              candidate,
              candidateScore,
              firstPoints,
              secondPoints,
              first,
              second,
              policy,
              budget,
            );
          // Subset stability belongs to final qualification, not hypothesis
          // discovery. A spent continuous optimizer still cannot compete.
          const provisional: boolean =
            refined.converged ||
            (refined.refusal === "inlier-refit-budget" &&
              refined.fits.length > 0 &&
              refined.fits.every(
                (fit: (typeof refined.fits)[number]): boolean => fit.converged,
              ));
          if (
            provisional &&
            (refined.score.indices.length > candidateScore.indices.length ||
              (refined.score.indices.length === candidateScore.indices.length &&
                (refined.score.medianPx ?? Infinity) <
                  (candidateScore.medianPx ?? Infinity)))
          ) {
            candidate = refined.matrix;
            candidateScore = refined.score;
          }
          if (!refined.converged) localRefinementRefusals++;
        } catch (error: unknown) {
          if (!isRecoveryCameraNumericalRefusal(error)) throw error;
          localRefinementRefusals++;
        }
      }
      if (
        candidateScore.indices.length < score.indices.length ||
        (candidateScore.indices.length === score.indices.length &&
          (candidateScore.medianPx ?? Infinity) >= (score.medianPx ?? Infinity))
      )
        continue;
      matrix = candidate;
      score = candidateScore;
      required = requiredRecoveryCameraTrials(
        firstPoints.length,
        score.indices.length,
        8,
        policy.samplingConfidence,
      );
    }
    if (matrix === null || score.indices.length < 8) break;
    checkpoint(trials, budget.maxRansacTrials);
    finalReestimations++;
    try {
      finalRefinement = refineRecoveryEpipolarModel(
        matrix,
        score,
        firstPoints,
        secondPoints,
        first,
        second,
        policy,
        budget,
      );
    } catch (error: unknown) {
      if (!isRecoveryCameraNumericalRefusal(error)) throw error;
      localRefinementRefusals++;
      finalRefinement = null;
      break;
    }
    matrix = finalRefinement.matrix;
    score = finalRefinement.score;
    required = requiredRecoveryCameraTrials(
      firstPoints.length,
      score.indices.length,
      8,
      policy.samplingConfidence,
    );
    if (
      !finalRefinement.converged ||
      trials >= Math.max(budget.minimumRansacTrials, required)
    )
      break;
  }
  checkpoint(trials, budget.maxRansacTrials);
  return {
    matrix,
    score,
    trials,
    requiredTrialsAtFinalSupport: required !== Infinity ? required : null,
    conditionalTrialTargetMet:
      trials >= required && trials >= budget.minimumRansacTrials,
    numericalRefusals,
    localRefinements,
    localRefinementRefusals,
    finalReestimations,
    finalRefinement,
  };
}
