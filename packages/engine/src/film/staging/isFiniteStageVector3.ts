import { IAutoMovieVector3 } from "@automovie/interface";

/**
 * Checks world-space vector components without repairing them. Positions use
 * metres; light directions are unitless and retain their authored magnitude.
 *
 * @evidence requirements/staging/budgets-safety-and-validation.md#staging-spatial-validation Keeps non-finite world-space placement coordinates outside the resolved stage.
 * @evidence specifications/performance-motion-and-staging/staging-events-coverage-and-validation.md#performance-staging-deterministic-replay-failure-result Keeps non-finite world-space placement coordinates outside the resolved stage.
 */
export const isFiniteStageVector3 = (vector: IAutoMovieVector3): boolean =>
  [vector.x, vector.y, vector.z].every((coordinate) =>
    Number.isFinite(coordinate),
  );
