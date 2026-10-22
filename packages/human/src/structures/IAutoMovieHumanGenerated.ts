import type { IAutoMovieModel } from "@automovie/interface";

import type { IAutoMovieHumanParameters } from "./IAutoMovieHumanParameters";

/** Human generation output. Generation is not implemented. */
export interface IAutoMovieHumanGenerated {
  /** Actual parameters used to generate this model. */
  parameters: IAutoMovieHumanParameters;

  /** Generated geometry, materials and rig in the engine's model format. */
  model: IAutoMovieModel;
}
