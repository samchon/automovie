import type { IAutoMovieHumanExpression } from "@automovie/interface";

import type { IAutoMovieHumanActionUnitActivationSchema } from "./IAutoMovieHumanActionUnitActivationSchema";
import type { IAutoMovieHumanMouthExpressionSchema } from "./IAutoMovieHumanMouthExpressionSchema";

/** Typia admission/schema metadata for IAutoMovieHumanExpression. The canonical shape belongs to interface; this refinement adds its existing ranges and nested schema metadata. Import this schema type when generating validators or schemas: the plain canonical type intentionally carries no typia dependency. */
export type IAutoMovieHumanExpressionSchema = IAutoMovieHumanExpression & {
  /** Acting units with their intensity and side. */
  units: IAutoMovieHumanActionUnitActivationSchema[];

  /** Lips, tongue and visemes as named fields for speech. Mouth units in `units` and here are resolved together; units of the brows and eyes are not consumed yet. */
  mouth?: IAutoMovieHumanMouthExpressionSchema;
};
