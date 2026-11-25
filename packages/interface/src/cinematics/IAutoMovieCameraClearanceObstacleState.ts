import type { IAutoMovieEvaluateCameraClearanceBox } from "../production/IAutoMovieEvaluateCameraClearanceBox";

/** One current world-space obstacle bound at one fixed-clock instant. */
export interface IAutoMovieCameraClearanceObstacleState {
  /** Stable resolved scene-node identity. */
  node: string;

  /** Inclusive world-space box holding the obstacle at this instant. */
  bounds: IAutoMovieEvaluateCameraClearanceBox;
}
