import {
  IAutoMovieBuiltEnvironment,
  IAutoMovieModel,
  IAutoMovieSubjectBox,
} from "@automovie/interface";

import { builtEnvironmentWorldMatrices } from "./builtEnvironmentWorldMatrices";
import { builtPlacedPartBoxes } from "./builtPlacedPartBoxes";

/*
 * Every drawn element's part boxes, resolved in one pass over the record.
 *
 * builtEnvironmentElementPartBounds stages the whole tree per element
 * query. This batch stages once and indexes models once, then measures each
 * element with the same shared part fold. Answers agree with the single-element
 * query for validated unique element/model ids; forged duplicate model ids
 * differ because the batch map selects the last model while find selects the
 * first.
 *
 * Transform-only elements are absent, matching the single-element query's null
 * answer; body resolution consequently reports them unresolved. A model-bearing
 * element with no available vertices instead receives the shared world-origin
 * point fallback.
 *
 * Keys follow element declaration order. World boxes use current operating
 * states, and the returned map is a snapshot that does not follow later edits.
 */
export function builtEnvironmentPartBoxes(
  environment: IAutoMovieBuiltEnvironment,
): Map<string, IAutoMovieSubjectBox[]> {
  const matrices: Map<string, number[]> =
    builtEnvironmentWorldMatrices(environment);
  const models: Map<string, IAutoMovieModel> = new Map(
    environment.models.map(
      (model: IAutoMovieModel): [string, IAutoMovieModel] => [model.id, model],
    ),
  );
  const boxes: Map<string, IAutoMovieSubjectBox[]> = new Map();
  for (const element of environment.elements)
    if (element.model !== null)
      boxes.set(
        element.id,
        builtPlacedPartBoxes(
          models.get(element.model),
          matrices.get(element.id)!,
        ),
      );
  return boxes;
}
