import type { IAutoMovieHumanGenerated } from "@automovie/interface";

import type { IAutoMovieHumanParametersSchema } from "./IAutoMovieHumanParametersSchema";

/** Typia admission/schema metadata for IAutoMovieHumanGenerated. The canonical shape belongs to interface; this refinement adds its existing ranges and nested schema metadata. Import this schema type when generating validators or schemas: the plain canonical type intentionally carries no typia dependency. */
export type IAutoMovieHumanGeneratedSchema = IAutoMovieHumanGenerated & {
  /** Actual parameters used to generate this model. */
  parameters: IAutoMovieHumanParametersSchema;
};
