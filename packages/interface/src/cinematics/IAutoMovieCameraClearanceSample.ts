import type { IAutoMovieTransform } from "../geometry/IAutoMovieTransform";
import type { IAutoMovieCameraClearanceObstacleState } from "./IAutoMovieCameraClearanceObstacleState";

/** Camera and obstacle state read at one fixed-clock instant. */
export interface IAutoMovieCameraClearanceSample {
  /** Shot-local sample time in seconds. */
  time: number;

  /** Resolved camera transform at this exact instant. */
  camera: IAutoMovieTransform;

  /** Every current resolved obstacle at this exact instant. */
  obstacles: IAutoMovieCameraClearanceObstacleState[];
}
