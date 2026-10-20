import type { IAutoMovieRecoveryCameraPairInput } from "@automovie/interface/recovery";

import type { createRecoveryCameraChart } from "./createRecoveryCameraChart";
import { measureRecoveryEpipolarErrors } from "./measureRecoveryEpipolarErrors";
import { refineRecoveryCameraPose } from "./refineRecoveryCameraPose";
import { scoreRecoveryCameraResiduals } from "./scoreRecoveryCameraResiduals";
import { selectRecoveryCameraPose } from "./selectRecoveryCameraPose";

/**
 * Refine a calibrated consensus candidate with at most three inlier refits.
 * Each fixed-subset optimizer must terminate, and the final inlier population
 * must stabilize within this declared refit budget. A changed subset never
 * inherits a previous local convergence claim.
 *
 * @evidence contracts/common.md#principled-implementation Four-branch cheirality supplies a local pose initializer. Five-coordinate calibrated optimization minimizes its fixed subset, then the complete tentative population is rescored in original pixels. Repeating only on changed inlier identities gives bounded local re-estimation without dropping new contradictions.
 * @evidence contracts/common.md#clear-and-simple-design This owner coordinates subset identity and optimizer termination; the pose optimizer owns continuous fitting, and the later final qualification owns physical visibility, homography competition and sampling-budget diagnostics.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An exhausted optimizer or still-changing third refit remains nonconverged. No success flag from an older subset, final-only point deletion or expected pose upgrades the candidate.
 * @evidence contracts/common.md#meaningful-documentation States the fixed three-refit bound, whole-population scoring, changed-subset invalidation and local-only convergence meaning.
 * @evidence contracts/performance.md#efficient-algorithms At most three bounded N-inlier pose fits and complete M-match rescoring passes use O(M) scratch plus bounded optimizer work; identity comparison is linear in the inlier population.
 * @evidence contracts/performance.md#reuse-equivalent-work Each completed fit supplies the next pose initializer and pixel matrix. An unchanged ordered subset terminates immediately; a changed subset rebuilds its own local design.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Up to three fixed-size pose/counter summaries and one O(M) score return; local subset arrays expire, and no image, handle or global cache survives.
 */
export function refineRecoveryEpipolarModel(
  matrix: readonly number[],
  initialScore: ReturnType<typeof scoreRecoveryCameraResiduals>,
  firstPoints: readonly (readonly [number, number])[],
  secondPoints: readonly (readonly [number, number])[],
  first: ReturnType<typeof createRecoveryCameraChart>,
  second: ReturnType<typeof createRecoveryCameraChart>,
  policy: IAutoMovieRecoveryCameraPairInput["policy"],
  budget: IAutoMovieRecoveryCameraPairInput["budget"],
): {
  matrix: number[];
  score: ReturnType<typeof scoreRecoveryCameraResiduals>;
  fits: ReturnType<typeof refineRecoveryCameraPose>[];
  converged: boolean;
  refusal: "optimizer-termination" | "inlier-refit-budget" | "insufficient-refined-support" | null;
} {
  let score: ReturnType<typeof scoreRecoveryCameraResiduals> = initialScore;
  let fittedMatrix: number[] = matrix.slice();
  const initial: ReturnType<typeof selectRecoveryCameraPose> = selectRecoveryCameraPose(matrix,
    score.indices.map((at: number): readonly [number, number] => firstPoints[at]!),
    score.indices.map((at: number): readonly [number, number] => secondPoints[at]!),
    first, second, policy.minimumDesignSingularRatio, budget.maxSingularSweeps);
  let pose: { rotation: number[]; translation: [number, number, number] } = {
    rotation: initial.rotation, translation: initial.translation,
  };
  const fits: ReturnType<typeof refineRecoveryCameraPose>[] = [];
  for (let refit: number = 0; refit < 3; refit++) {
    if (score.indices.length < 8)
      return { matrix: fittedMatrix, score, fits, converged: false, refusal: "insufficient-refined-support" };
    const fit: ReturnType<typeof refineRecoveryCameraPose> = refineRecoveryCameraPose(pose,
      score.indices.map((at: number): readonly [number, number] => firstPoints[at]!),
      score.indices.map((at: number): readonly [number, number] => secondPoints[at]!), first, second, {
        lossScalePx: policy.refinementLossScalePx, minimumDesignRatio: policy.minimumDesignSingularRatio,
        maxIterations: budget.maxRefinementIterations, maxSweeps: budget.maxSingularSweeps,
      });
    fits.push(fit); fittedMatrix = fit.fundamental;
    const errors: ReturnType<typeof measureRecoveryEpipolarErrors> = measureRecoveryEpipolarErrors(fittedMatrix, firstPoints, secondPoints);
    const next: ReturnType<typeof scoreRecoveryCameraResiduals> = scoreRecoveryCameraResiduals(errors.map(
      (error: typeof errors[number]): number | null => error?.signedSampsonPx ?? null,
    ), policy.maximumSampsonErrorPx);
    const unchanged: boolean = next.indices.length === score.indices.length &&
      next.indices.every((value: number, at: number): boolean => value === score.indices[at]);
    score = next;
    if (!fit.converged) return { matrix: fittedMatrix, score, fits, converged: false, refusal: "optimizer-termination" };
    if (score.indices.length < 8)
      return { matrix: fittedMatrix, score, fits, converged: false, refusal: "insufficient-refined-support" };
    if (unchanged) return { matrix: fittedMatrix, score, fits, converged: true, refusal: null };
    pose = { rotation: fit.rotation, translation: fit.translation };
  }
  return { matrix: fittedMatrix, score, fits, converged: false, refusal: "inlier-refit-budget" };
}
