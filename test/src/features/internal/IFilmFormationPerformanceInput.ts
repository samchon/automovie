import type { materializeCompiledFormation } from "@automovie/engine";
import type { IAutoMovieActionCall, IAutoMovieModel, IAutoMovieFormationMotion } from "@automovie/interface";

/** Original framing action and optional formation runtime registries. */
export interface IFilmFormationPerformanceInput {
  /** The original authored camera action. */
  action: IAutoMovieActionCall;

  /** Original materialized formations. */
  formations?: readonly ReturnType<typeof materializeCompiledFormation>[];

  /** Original model registry. */
  models?: readonly IAutoMovieModel[];

  /** Original carried formation motions. */
  formationMotions?: readonly IAutoMovieFormationMotion[];
}
