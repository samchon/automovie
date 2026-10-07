import type { IAutoMovieCameraClearanceRuntime } from "@automovie/engine";
import type {
  IAutoMovieClip,
  IAutoMovieModel,
  IAutoMovieMotion,
  IAutoMovieScene,
  IAutoMovieShotCoverage,
} from "@automovie/interface";

import type { IFilmCameraClearanceHero } from "./IFilmCameraClearanceHero";

/** Original optional adapter override fields used by the existing scenario. */
export interface IFilmCameraClearanceAdapterOverrides {
  /** Alternate original scene. */
  scene?: IAutoMovieScene;

  /** Alternate original delivery camera and motion. */
  hero?: IFilmCameraClearanceHero;

  /** Alternate same-clock coverage list. */
  coverage?: IAutoMovieShotCoverage[];

  /** Alternate shot duration in seconds. */
  duration?: number;

  /** Alternate original actor motions. */
  motions?: Record<string, IAutoMovieMotion>;

  /** Alternate original object motions. */
  objectMotions?: IAutoMovieClip[];

  /** Alternate original model registry. */
  models?: IAutoMovieModel[];

  /** Alternate original revision and clock authority. */
  runtime?: IAutoMovieCameraClearanceRuntime;
}
