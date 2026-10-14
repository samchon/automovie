import {
  IAutoMovieBuiltEnvironment,
  IAutoMovieModel,
  IAutoMovieSubjectBox,
} from "@automovie/interface";

import { builtEnvironmentWorldMatrices } from "./builtEnvironmentWorldMatrices";
import { builtPlacedPartBoxes } from "./builtPlacedPartBoxes";

/**
 * Every drawn element's part boxes, resolved in one pass over the record.
 *
 * {@link builtEnvironmentElementPartBounds} stages the whole tree per element query. This batch stages once and indexes models once, then measures each element with the same shared part fold. Answers agree with the single-element query for validated unique element/model ids; forged duplicate model ids differ because the batch map selects the last model while find selects the first.
 *
 * Transform-only elements are absent, matching the single-element query's null answer; body resolution consequently reports them unresolved. A model-bearing element with no available vertices instead receives the shared world-origin point fallback.
 *
 * Keys follow element declaration order. World boxes use current operating states, and the returned map is a snapshot that does not follow later edits.
 *
 * @evidence contracts/common.md#principled-implementation Stages every world matrix once through the shared current-state staging and measures each drawn element with the same `builtPlacedPartBoxes` the single-element query uses, so both answers agree by construction.
 * @evidence contracts/common.md#clear-and-simple-design A batch form of the single-element part query that owns only the iteration and the model index; staging and measuring live in the shared helpers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Names no element or model; a transform-only element is left out by the same rule the single-element query states, not filtered for a particular sweep.
 * @evidence contracts/common.md#meaningful-documentation States why the batch form exists, that entries equal the single-element answers, why transform-only elements are absent, the key order, the world frame, the operating state used, and that the map is a snapshot.
 * @evidence contracts/performance.md#efficient-algorithms O(W + M + E + P + V), where W is world staging, M models, E elements, P drawn parts and V their vertices, plus procedural tessellation cost. Each drawn instance is measured separately; the model index and staging are built once.
 * @evidence contracts/performance.md#reuse-equivalent-work Shares one world-matrix staging across every element and one model index across every lookup within the call; nothing is reused across calls because the record is the caller's and may have changed.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Staged matrices and the model index are dropped on return; the caller owns the map, bounded by the drawn element count times each model's part count.
 * @author Samchon
 */
export const builtEnvironmentPartBoxes: (environment: IAutoMovieBuiltEnvironment) => Map<string, IAutoMovieSubjectBox[]> = (
  environment: IAutoMovieBuiltEnvironment,
): Map<string, IAutoMovieSubjectBox[]> => {
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
};
