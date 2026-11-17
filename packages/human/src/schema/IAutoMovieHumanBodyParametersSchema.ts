import type { IAutoMovieHumanBodyParameters } from "@automovie/interface";

import type { IAutoMovieHumanBodyAnatomySchema } from "./IAutoMovieHumanBodyAnatomySchema";

/** Typia admission/schema metadata for IAutoMovieHumanBodyParameters. The canonical shape belongs to interface; this refinement adds its existing ranges and nested schema metadata. Import this schema type when generating validators or schemas: the plain canonical type intentionally carries no typia dependency. */
export type IAutoMovieHumanBodyParametersSchema =
  IAutoMovieHumanBodyParameters & {
    /** Stature, tapes, segment lengths, skeletal breadths, landmark heights and fat percentage; each omitted measure takes its survey default. */
    anatomy: IAutoMovieHumanBodyAnatomySchema;
  };
