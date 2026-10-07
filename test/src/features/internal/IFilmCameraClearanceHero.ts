import type { IAutoMovieCamera, IAutoMovieShot } from "@automovie/interface";

/** Original delivery camera paired with its authored motion. */
export interface IFilmCameraClearanceHero {
  /** The same resolved camera. */
  camera: IAutoMovieCamera;

  /** Its original camera-motion field. */
  motion: IAutoMovieShot["cameraMotion"];
}
