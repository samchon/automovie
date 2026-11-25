import type { IAutoMovieModel } from "../model/IAutoMovieModel";
import type { IAutoMovieHumanParameters } from "./IAutoMovieHumanParameters";

/**
 * Envelope for a complete generated Human model and its resolved parameters.
 * The current package exports component/body builders; it does not yet produce
 * this whole-model envelope.
 */
export interface IAutoMovieHumanGenerated {
  /** Actual parameters used to generate this model. */
  parameters: IAutoMovieHumanParameters;

  /** Generated geometry, materials and rig in the engine's model format. */
  model: IAutoMovieModel;
}
