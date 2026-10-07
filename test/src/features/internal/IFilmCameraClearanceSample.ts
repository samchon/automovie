import type { IAutoMovieTransform } from "@automovie/interface";

import type { IFilmCameraClearanceObstacle } from "./IFilmCameraClearanceObstacle";

/** Original camera and obstacle reading at one authored clock instant. */
export interface IFilmCameraClearanceSample {
  /** Authored seconds. */
  time: number;

  /** World camera transform. */
  camera: IAutoMovieTransform;

  /** Same-clock obstacle population. */
  obstacles: IFilmCameraClearanceObstacle[];
}
