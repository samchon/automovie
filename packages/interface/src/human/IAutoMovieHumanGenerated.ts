import type { IAutoMovieModel } from "../model/IAutoMovieModel";
import type { IAutoMovieHumanParameters } from "./IAutoMovieHumanParameters";

/** Envelope for a complete generated Human model and its resolved parameters. The current package exports component/body builders; it does not yet produce this whole-model envelope.
 *
 *
 * @evidence contracts/development/common.md#meaningful-documentation Envelope for a complete generated Human model and its resolved parameters.
 * @evidence contracts/development/design.md#principled-representation `parameters`: Actual parameters used to generate this model. `model`: Generated geometry, materials and rig in the engine's model format.
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanGenerated is the canonical exchange used by IAutoMovieHumanGeneratedSchema.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `parameters`, `model`; callers supply the complete record.
 */
export interface IAutoMovieHumanGenerated {
  /** Actual parameters used to generate this model. */
  parameters: IAutoMovieHumanParameters;

  /** Generated geometry, materials and rig in the engine's model format. */
  model: IAutoMovieModel;
}
