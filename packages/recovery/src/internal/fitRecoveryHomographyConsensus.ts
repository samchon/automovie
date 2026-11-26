import type {
  IAutoMovieRecoveryCameraResidualsScoreOperation,
  IAutoMovieRecoveryHomographyConsensusFittingOperation,
  IAutoMovieRecoveryHomographyFittingOperation,
} from "@automovie/interface";

import { fitRecoveryHomography } from "../geometry/internal/fitRecoveryHomography";
import { isRecoveryCameraNumericalRefusal } from "./isRecoveryCameraNumericalRefusal";
import { measureRecoveryHomographyErrors } from "../geometry/internal/measureRecoveryHomographyErrors";
import { requiredRecoveryCameraTrials } from "./requiredRecoveryCameraTrials";
import { sampleRecoveryCameraIndices } from "./sampleRecoveryCameraIndices";
import { scoreRecoveryCameraResiduals } from "../geometry/internal/scoreRecoveryCameraResiduals";

/**
 * Search a planar explanation of the final fixed epipolar-inlier population.
 * Four-point homographies compete with symmetric pixel transfer. Absence of a
 * dominant model requires the conditional trial target for the forbidden
 * overlap fraction, not the much weaker best homography's own support ratio. A
 * found forbidden overlap is sufficient refusal evidence and ends the search.
 */
export function fitRecoveryHomographyConsensus(
  first: Parameters<IAutoMovieRecoveryHomographyConsensusFittingOperation.Operation>[0],
  second: Parameters<IAutoMovieRecoveryHomographyConsensusFittingOperation.Operation>[1],
  policy: Parameters<IAutoMovieRecoveryHomographyConsensusFittingOperation.Operation>[2],
  budget: Parameters<IAutoMovieRecoveryHomographyConsensusFittingOperation.Operation>[3],
  checkpoint: Parameters<IAutoMovieRecoveryHomographyConsensusFittingOperation.Operation>[4],
): ReturnType<IAutoMovieRecoveryHomographyConsensusFittingOperation.Operation> {
  if (first.length !== second.length || first.length < 4)
    throw new Error(
      "camera-homography: four or more final epipolar inliers required",
    );
  const forbiddenSupport: number = Math.ceil(
    policy.maximumHomographyOverlapFraction * first.length,
  );
  const required: number = requiredRecoveryCameraTrials(
    first.length,
    forbiddenSupport,
    4,
    policy.samplingConfidence,
  );
  let trials: number = 0,
    numericalRefusals: number = 0,
    refitRefusals: number = 0;
  let model: ReturnType<IAutoMovieRecoveryHomographyFittingOperation.Operation> | null =
    null;
  let score: ReturnType<IAutoMovieRecoveryCameraResidualsScoreOperation.Operation> =
    {
      indices: [],
      medianPx: null,
      p90Px: null,
    };
  while (
    trials < budget.maxRansacTrials &&
    (trials < budget.minimumRansacTrials || trials < required) &&
    score.indices.length < forbiddenSupport
  ) {
    checkpoint(trials, budget.maxRansacTrials);
    // ASCII HOMO separates the planar stream from the epipolar proposal domain.
    const sample: number[] = sampleRecoveryCameraIndices(
      first.length,
      4,
      policy.samplingSeed,
      0x484f4d4f,
      trials,
    );
    trials++;
    let candidate: ReturnType<IAutoMovieRecoveryHomographyFittingOperation.Operation>;
    let candidateScore: ReturnType<IAutoMovieRecoveryCameraResidualsScoreOperation.Operation>;
    try {
      candidate = fitRecoveryHomography(
        sample.map((at: number): readonly [number, number] => first[at]!),
        sample.map((at: number): readonly [number, number] => second[at]!),
        policy.minimumDesignSingularRatio,
        budget.maxSingularSweeps,
      );
      candidateScore = scoreRecoveryCameraResiduals(
        measureRecoveryHomographyErrors(candidate, first, second),
        policy.maximumHomographyTransferPx,
      );
    } catch (error: unknown) {
      if (!isRecoveryCameraNumericalRefusal(error)) throw error;
      numericalRefusals++;
      continue;
    }
    if (
      candidateScore.indices.length < score.indices.length ||
      (candidateScore.indices.length === score.indices.length &&
        (candidateScore.medianPx ?? Infinity) >= (score.medianPx ?? Infinity))
    )
      continue;
    for (
      let refit: number = 0;
      refit < 3 && candidateScore.indices.length >= 4;
      refit++
    ) {
      try {
        const refined: typeof candidate = fitRecoveryHomography(
          candidateScore.indices.map(
            (at: number): readonly [number, number] => first[at]!,
          ),
          candidateScore.indices.map(
            (at: number): readonly [number, number] => second[at]!,
          ),
          policy.minimumDesignSingularRatio,
          budget.maxSingularSweeps,
        );
        const next: typeof candidateScore = scoreRecoveryCameraResiduals(
          measureRecoveryHomographyErrors(refined, first, second),
          policy.maximumHomographyTransferPx,
        );
        const unchanged: boolean =
          next.indices.length === candidateScore.indices.length &&
          next.indices.every(
            (value: number, at: number): boolean =>
              value === candidateScore.indices[at],
          );
        if (
          next.indices.length < candidateScore.indices.length ||
          (next.indices.length === candidateScore.indices.length &&
            (next.medianPx ?? Infinity) >=
              (candidateScore.medianPx ?? Infinity))
        )
          break;
        candidate = refined;
        candidateScore = next;
        if (unchanged) break;
      } catch (error: unknown) {
        if (!isRecoveryCameraNumericalRefusal(error)) throw error;
        refitRefusals++;
        break;
      }
    }
    model = candidate;
    score = candidateScore;
  }
  checkpoint(trials, budget.maxRansacTrials);
  return {
    model,
    score,
    population: first.length,
    forbiddenSupport,
    trials,
    requiredTrialsAtForbiddenSupport: required !== Infinity ? required : null,
    conditionalTrialTargetMet:
      trials >= required && trials >= budget.minimumRansacTrials,
    forbiddenOverlapFound: score.indices.length >= forbiddenSupport,
    numericalRefusals,
    refitRefusals,
  };
}
