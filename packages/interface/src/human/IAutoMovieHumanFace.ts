import type { IAutoMovieHumanPair } from "./IAutoMovieHumanPair";
import type { IAutoMovieHumanEye } from "./IAutoMovieHumanEye";
import type { IAutoMovieHumanMouth } from "./IAutoMovieHumanMouth";
import type { IAutoMovieHumanNose } from "./IAutoMovieHumanNose";

/** Resting eye, nose and mouth measurements between the Farkas landmarks. */
export interface IAutoMovieHumanFace {
  /** Eye openings; equal values retain a shared bilateral measurement. */
  eyePair: IAutoMovieHumanPair<IAutoMovieHumanEye>;

  /**
   * Euclidean three-dimensional distance between the two endocanthia,
   * millimetres. Schema constraints: Minimum: 10; Maximum: 60; retained by
   * Human's schema refinement.
   */
  intercanthalWidth: number;

  /** Nose dimensions. */
  nose: IAutoMovieHumanNose;

  /** Closed-mouth dimensions. */
  mouth: IAutoMovieHumanMouth;
}
