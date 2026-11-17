import type { IAutoMovieHumanMouthExpression } from "@automovie/interface";

import type { IAutoMovieHumanLipExpressionSchema } from "./IAutoMovieHumanLipExpressionSchema";
import type { IAutoMovieHumanTongueExpressionSchema } from "./IAutoMovieHumanTongueExpressionSchema";
import type { IAutoMovieHumanVisemeWeightsSchema } from "./IAutoMovieHumanVisemeWeightsSchema";

/** Typia admission/schema metadata for IAutoMovieHumanMouthExpression. The canonical shape belongs to interface; this refinement adds its existing ranges and nested schema metadata. Import this schema type when generating validators or schemas: the plain canonical type intentionally carries no typia dependency. */
export type IAutoMovieHumanMouthExpressionSchema =
  IAutoMovieHumanMouthExpression & {
    /** Lip action units. */
    lips?: IAutoMovieHumanLipExpressionSchema;

    /** Tongue position. */
    tongue?: IAutoMovieHumanTongueExpressionSchema;

    /** Viseme blend weights, an alternative speech description. */
    visemes?: IAutoMovieHumanVisemeWeightsSchema;
  };
