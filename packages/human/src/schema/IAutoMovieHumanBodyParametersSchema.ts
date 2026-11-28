import type { IAutoMovieHumanBodyParameters } from "@automovie/interface";

import type { IAutoMovieHumanBodyAnatomySchema } from "./IAutoMovieHumanBodyAnatomySchema";

/**
 * Body measurements for Human input validated with typia. Supply the anatomy
 * record and leave individual measurements absent when the body resolver
 * should fill them.
 */
export type IAutoMovieHumanBodyParametersSchema =
  IAutoMovieHumanBodyParameters & {
    /** Required measurement record. The body resolver fills omitted fields from the available measurements and reference data. */
    anatomy: IAutoMovieHumanBodyAnatomySchema;
  };
