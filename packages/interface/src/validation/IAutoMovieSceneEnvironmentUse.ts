import type { IAutoMovieSceneEnvironment } from "../scene/IAutoMovieSceneEnvironment";

/** One shot identity paired with its optional compiled scene environment. */
export interface IAutoMovieSceneEnvironmentUse {
  /** Exact shot id. */
  shot: string;

  /** The scene's declared environment, or null/undefined when it declares none. */
  environment?: IAutoMovieSceneEnvironment | null;
}
