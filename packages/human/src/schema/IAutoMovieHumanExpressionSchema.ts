import type { IAutoMovieHumanExpression } from "@automovie/interface";

import type { IAutoMovieHumanActionUnitActivationSchema } from "./IAutoMovieHumanActionUnitActivationSchema";
import type { IAutoMovieHumanMouthExpressionSchema } from "./IAutoMovieHumanMouthExpressionSchema";

/**
 * One instant of facial action for a typia validator or schema. List action
 * units with their side and intensity, and optionally supply mouth controls.
 * Consumers check action overlap and determine which channels they render.
 */
export type IAutoMovieHumanExpressionSchema = IAutoMovieHumanExpression & {
  /** Acting units with their intensity and side. */
  units: IAutoMovieHumanActionUnitActivationSchema[];

  /** Optional mouth controls. Use either the action list or a named lip field for the same action and side. */
  mouth?: IAutoMovieHumanMouthExpressionSchema;
};
