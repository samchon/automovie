import type { IAutoMovieHumanMouthExpression } from "@automovie/interface";

import type { IAutoMovieHumanLipExpressionSchema } from "./IAutoMovieHumanLipExpressionSchema";
import type { IAutoMovieHumanTongueExpressionSchema } from "./IAutoMovieHumanTongueExpressionSchema";
import type { IAutoMovieHumanVisemeWeightsSchema } from "./IAutoMovieHumanVisemeWeightsSchema";

/**
 * Optional named lip actions, tongue controls and viseme weights for a typia
 * validator or schema. The clinical jaw channels belong to the pose. Select
 * the mouth fields supported by the receiving operation.
 */
export type IAutoMovieHumanMouthExpressionSchema =
  IAutoMovieHumanMouthExpression & {
    /** Lip action units. */
    lips?: IAutoMovieHumanLipExpressionSchema;

    /** Tongue position. */
    tongue?: IAutoMovieHumanTongueExpressionSchema;

    /** Weights by viseme for consumers that accept them. */
    visemes?: IAutoMovieHumanVisemeWeightsSchema;
  };
