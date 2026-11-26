import type {
  IAutoMovieRecoveryCameraPoseRefinementOperation,
  IAutoMovieRecoveryCameraPoseSelectionOperation,
  IAutoMovieRecoveryCameraResidualsScoreOperation,
  IAutoMovieRecoveryEpipolarErrorsMeasurementOperation,
  IAutoMovieRecoveryEpipolarModelRefinementOperation,
} from "@automovie/interface";

import { measureRecoveryEpipolarErrors } from "./measureRecoveryEpipolarErrors";
import { refineRecoveryCameraPose } from "./refineRecoveryCameraPose";
import { scoreRecoveryCameraResiduals } from "./scoreRecoveryCameraResiduals";
import { selectRecoveryCameraPose } from "./selectRecoveryCameraPose";

/**
 * Refine a calibrated consensus candidate with at most three inlier refits.
 * Each fixed-subset optimizer must terminate, and the final inlier population
 * must stabilize within this declared refit budget. A changed subset never
 * inherits a previous local convergence claim.
 */
export function refineRecoveryEpipolarModel(
  matrix: Parameters<IAutoMovieRecoveryEpipolarModelRefinementOperation.Operation>[0],
  initialScore: Parameters<IAutoMovieRecoveryEpipolarModelRefinementOperation.Operation>[1],
  firstPoints: Parameters<IAutoMovieRecoveryEpipolarModelRefinementOperation.Operation>[2],
  secondPoints: Parameters<IAutoMovieRecoveryEpipolarModelRefinementOperation.Operation>[3],
  first: Parameters<IAutoMovieRecoveryEpipolarModelRefinementOperation.Operation>[4],
  second: Parameters<IAutoMovieRecoveryEpipolarModelRefinementOperation.Operation>[5],
  policy: Parameters<IAutoMovieRecoveryEpipolarModelRefinementOperation.Operation>[6],
  budget: Parameters<IAutoMovieRecoveryEpipolarModelRefinementOperation.Operation>[7],
): ReturnType<IAutoMovieRecoveryEpipolarModelRefinementOperation.Operation> {
  let score: ReturnType<IAutoMovieRecoveryCameraResidualsScoreOperation.Operation> =
    initialScore;
  let fittedMatrix: number[] = matrix.slice();
  const initial: ReturnType<IAutoMovieRecoveryCameraPoseSelectionOperation.Operation> =
    selectRecoveryCameraPose(
      matrix,
      score.indices.map(
        (at: number): readonly [number, number] => firstPoints[at]!,
      ),
      score.indices.map(
        (at: number): readonly [number, number] => secondPoints[at]!,
      ),
      first,
      second,
      policy.minimumDesignSingularRatio,
      budget.maxSingularSweeps,
    );
  let pose: { rotation: number[]; translation: [number, number, number] } = {
    rotation: initial.rotation,
    translation: initial.translation,
  };
  const fits: ReturnType<IAutoMovieRecoveryCameraPoseRefinementOperation.Operation>[] =
    [];
  for (let refit: number = 0; refit < 3; refit++) {
    if (score.indices.length < 8)
      return {
        matrix: fittedMatrix,
        score,
        fits,
        converged: false,
        refusal: "insufficient-refined-support",
      };
    const fit: ReturnType<IAutoMovieRecoveryCameraPoseRefinementOperation.Operation> =
      refineRecoveryCameraPose(
        pose,
        score.indices.map(
          (at: number): readonly [number, number] => firstPoints[at]!,
        ),
        score.indices.map(
          (at: number): readonly [number, number] => secondPoints[at]!,
        ),
        first,
        second,
        {
          lossScalePx: policy.refinementLossScalePx,
          minimumDesignRatio: policy.minimumDesignSingularRatio,
          maxIterations: budget.maxRefinementIterations,
          maxSweeps: budget.maxSingularSweeps,
        },
      );
    fits.push(fit);
    fittedMatrix = fit.fundamental;
    const errors: ReturnType<IAutoMovieRecoveryEpipolarErrorsMeasurementOperation.Operation> =
      measureRecoveryEpipolarErrors(fittedMatrix, firstPoints, secondPoints);
    const next: ReturnType<IAutoMovieRecoveryCameraResidualsScoreOperation.Operation> =
      scoreRecoveryCameraResiduals(
        errors.map(
          (error: (typeof errors)[number]): number | null =>
            error?.signedSampsonPx ?? null,
        ),
        policy.maximumSampsonErrorPx,
      );
    const unchanged: boolean =
      next.indices.length === score.indices.length &&
      next.indices.every(
        (value: number, at: number): boolean => value === score.indices[at],
      );
    score = next;
    if (!fit.converged)
      return {
        matrix: fittedMatrix,
        score,
        fits,
        converged: false,
        refusal: "optimizer-termination",
      };
    if (score.indices.length < 8)
      return {
        matrix: fittedMatrix,
        score,
        fits,
        converged: false,
        refusal: "insufficient-refined-support",
      };
    if (unchanged)
      return {
        matrix: fittedMatrix,
        score,
        fits,
        converged: true,
        refusal: null,
      };
    pose = { rotation: fit.rotation, translation: fit.translation };
  }
  return {
    matrix: fittedMatrix,
    score,
    fits,
    converged: false,
    refusal: "inlier-refit-budget",
  };
}
