import type { IAutoMovieRecoveryCameraPairInput } from "@automovie/interface/recovery";

import { fitRecoveryHomography } from "./fitRecoveryHomography";
import { isRecoveryCameraNumericalRefusal } from "./isRecoveryCameraNumericalRefusal";
import { measureRecoveryHomographyErrors } from "./measureRecoveryHomographyErrors";
import { requiredRecoveryCameraTrials } from "./requiredRecoveryCameraTrials";
import { sampleRecoveryCameraIndices } from "./sampleRecoveryCameraIndices";
import { scoreRecoveryCameraResiduals } from "./scoreRecoveryCameraResiduals";

/**
 * Search a planar explanation of the final fixed epipolar-inlier population.
 * Four-point homographies compete with symmetric pixel transfer. Absence of a
 * dominant model requires the conditional trial target for the forbidden
 * overlap fraction, not the much weaker best homography's own support ratio.
 * A found forbidden overlap is sufficient refusal evidence and ends the search.
 *
 * @evidence contracts/common.md#principled-implementation Normalized original-design DLT and deterministic unique-index RANSAC test planar/pure-rotation ambiguity on the exact final epipolar subset. Finite-population conditional trial counts target the declared forbidden overlap. The ideal all-inlier sampling model assumes identifiable samples and does not prove a plane absent or a returned camera physically correct.
 * @evidence contracts/common.md#clear-and-simple-design This competitor never changes the epipolar population or pose. It reports local subset indices, actual trial work, numerical failures and a conditional target so final qualification can distinguish found ambiguity from unfinished search.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No global-match denominator dilutes overlap, no weak best-H confidence claims absence, and no skipped numerical proposal or budget increase supplies a plane. Unexpected exceptions and checkpoint failures propagate.
 * @evidence contracts/common.md#meaningful-documentation States frozen epipolar population, local index meaning, symmetric pixel threshold, forbidden-support target, three-refit bound and conditional rather than physical confidence.
 * @evidence contracts/performance.md#efficient-algorithms For N fixed inliers and T proposals, each bounded nine-column SVD and full score costs O(S*N*9^2+N log N); improving proposals have at most three refits. O(N) scratch and fixed current/best matrices avoid retaining every proposal.
 * @evidence contracts/performance.md#reuse-equivalent-work Each candidate's map/inverse scores the entire fixed population, and a refit only replaces a model when its complete score improves. Unchanged support stops that refit's loop.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only the current best matrix, inverse, O(N) indices and scalar counters escape. Proposal/subset arrays expire synchronously and no image, callback, process or global cache is retained.
 */
export function fitRecoveryHomographyConsensus(
  first: readonly (readonly [number, number])[],
  second: readonly (readonly [number, number])[],
  policy: IAutoMovieRecoveryCameraPairInput["policy"],
  budget: IAutoMovieRecoveryCameraPairInput["budget"],
  checkpoint: (completed: number, total: number) => void,
): {
  model: ReturnType<typeof fitRecoveryHomography> | null;
  score: ReturnType<typeof scoreRecoveryCameraResiduals>;
  population: number;
  forbiddenSupport: number;
  trials: number;
  requiredTrialsAtForbiddenSupport: number | null;
  conditionalTrialTargetMet: boolean;
  forbiddenOverlapFound: boolean;
  numericalRefusals: number;
  refitRefusals: number;
} {
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
  let model: ReturnType<typeof fitRecoveryHomography> | null = null;
  let score: ReturnType<typeof scoreRecoveryCameraResiduals> = {
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
    let candidate: ReturnType<typeof fitRecoveryHomography>;
    let candidateScore: ReturnType<typeof scoreRecoveryCameraResiduals>;
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
    requiredTrialsAtForbiddenSupport: Number.isFinite(required)
      ? required
      : null,
    conditionalTrialTargetMet:
      trials >= required && trials >= budget.minimumRansacTrials,
    forbiddenOverlapFound: score.indices.length >= forbiddenSupport,
    numericalRefusals,
    refitRefusals,
  };
}
