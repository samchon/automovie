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
 * {@link builtEnvironmentElementPartBounds} answers for one element and stages
 * the whole element tree to do it, which is the right cost for one question
 * and the wrong one for a sweep: a building with three thousand placed bodies
 * would pay that staging three thousand times. This stages the world matrices
 * once and reads every element through them, so a whole-building pass is one
 * walk, and each entry equals what the single-element query answers.
 *
 * A transform-only element is absent rather than present and empty, matching
 * the single-element answer's `null`, because a grouping node draws nothing and
 * a caller that finds no entry should fall back to the box the record reports
 * for it rather than treat it as a body with no volume.
 *
 * Keys are element ids in declaration order. Boxes are world-space and
 * measured where the environment's current operating state puts each element.
 * The map is a snapshot: it does not follow later edits to the record.
 *
 * @evidence contracts/common.md#principled-implementation Stages every world matrix once through the shared current-state staging and measures each drawn element with the same `builtPlacedPartBoxes` the single-element query uses, so both answers agree by construction.
 * @evidence contracts/common.md#clear-and-simple-design A batch form of the single-element part query that owns only the iteration and the model index; staging and measuring live in the shared helpers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Names no element or model; a transform-only element is left out by the same rule the single-element query states, not filtered for a particular sweep.
 * @evidence contracts/common.md#meaningful-documentation States why the batch form exists, that entries equal the single-element answers, why transform-only elements are absent, the key order, the world frame, the operating state used, and that the map is a snapshot.
 * @evidence contracts/performance.md#efficient-algorithms Linear in the element and model counts plus the summed vertex count of every drawn element, with one staging pass instead of one per element.
 * @evidence contracts/performance.md#reuse-equivalent-work Shares one world-matrix staging across every element and one model index across every lookup within the call; nothing is reused across calls because the record is the caller's and may have changed.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Staged matrices and the model index are dropped on return; the caller owns the map, bounded by the drawn element count times each model's part count.
 * @author Samchon
 */
export const builtEnvironmentPartBoxes = (
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
