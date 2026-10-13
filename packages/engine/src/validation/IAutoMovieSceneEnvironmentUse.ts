import { IAutoMovieSceneEnvironment } from "@automovie/interface";

/**
 * One compiled shot's scene environment, addressed by the shot that owns it.
 */
export interface IAutoMovieSceneEnvironmentUse {
  /** Exact shot id. */
  shot: string;
  /**
   * The scene's declared environment, or null/undefined when it declares none.
   */
  environment?: IAutoMovieSceneEnvironment | null;
}
