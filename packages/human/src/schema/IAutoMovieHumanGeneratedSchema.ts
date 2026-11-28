import type { IAutoMovieHumanGenerated } from "@automovie/interface";

import type { IAutoMovieHumanParametersSchema } from "./IAutoMovieHumanParametersSchema";

/**
 * Validation schema for a complete Human model envelope supplied with its
 * parameters. It carries the engine model and adds Human input constraints to
 * the associated parameters. Current Human builders return body or component
 * records.
 */
export type IAutoMovieHumanGeneratedSchema = IAutoMovieHumanGenerated & {
  /** Parameters associated with the model supplied in the envelope. */
  parameters: IAutoMovieHumanParametersSchema;
};
