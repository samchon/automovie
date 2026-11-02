import type { IAutoMovieModel } from "@automovie/interface";

import type { AutoMovieHumanMouthState } from "../instance/AutoMovieHumanMouthState";
import type { IAutoMovieHumanParameters } from "./IAutoMovieHumanParameters";

/** Neutral Human model and its bind-space articulation data. */
export interface IAutoMovieHumanGenerated {
  /** Actual parameters used to generate this model. */
  parameters: IAutoMovieHumanParameters;

  /** Generated geometry, materials and rig in the engine's model format. */
  model: IAutoMovieModel;

  /** Mouth data from the same calibration that generated the bind geometry. */
  mouth?: AutoMovieHumanMouthState.IPrepared;
}
