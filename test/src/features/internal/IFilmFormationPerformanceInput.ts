import type {
  IAutoMovieActionCall,
  IAutoMovieFormationMotion,
  IAutoMovieModel,
} from "@automovie/interface";

import type { materializeCompiledFormation } from "@automovie/engine";

/**
 * Inputs to the formation-framing unit's real performShot call. The owning entry varies authored group action, compact formations, member geometry and motion cues to compare explicit extent arithmetic; this record adds no admission, rendering observation or independently discovered assertion.
 *
 * @author Samchon
 */
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
