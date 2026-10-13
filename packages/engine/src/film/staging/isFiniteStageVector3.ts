import { IAutoMovieVector3 } from "@automovie/interface";

/**
 * Checks world-space vector components without repairing them. Positions use
 * metres; light directions are unitless and retain their authored magnitude.
 */
export const isFiniteStageVector3 = (vector: IAutoMovieVector3): boolean =>
  [vector.x, vector.y, vector.z].every((coordinate) =>
    Number.isFinite(coordinate),
  );
