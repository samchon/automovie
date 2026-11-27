import {
  IAutoMovieBuiltEnvironment,
  IAutoMovieModel,
  IAutoMovieSubjectBox,
} from "@automovie/interface";

import { unionSubjectBoxes } from "../../film/internal/unionSubjectBoxes";
import { builtEnvironmentWorldMatrices } from "./builtEnvironmentWorldMatrices";
import { builtInstanceSetPlacementBounds } from "./builtInstanceSetPlacementBounds";
import { builtPlacedPartBoxes } from "./builtPlacedPartBoxes";
import { builtSpaceSubtree } from "./builtSpaceSubtree";
import { requireBuiltSpace } from "./requireBuiltSpace";

/*
 * The world box the contents of a logical space and its descendants fill.
 *
 * Declared room volume and placed contents answer different questions. This
 * query folds content proxies for framing or inspection; it does not replace
 * the room's stated volume or prove that a chosen camera pose is inside the
 * room or has an unobstructed view.
 *
 * What is measured is exactly what builtEnvironmentSpaceNodes names: the
 * staged elements that draw a model and the compact populations of this space
 * and every space below it. Each element is measured by the same part boxes as
 * builtEnvironmentElementPartBounds, where the environment's current
 * operating state puts it, which is where lowerBuiltEnvironment stages
 * it, so a leaf authored open widens the box by the leaf where it actually
 * rests.
 *
 * A population widens this box. It contributes through
 * builtInstanceSetPlacementBounds, which measures the region its
 * declared placement law spans after folding the population's authored
 * prototype-local box through every scale and rotation that law permits, and
 * throws for an `along-route` layout. The building cannot inspect the model's
 * mesh, so the local box is the explicit geometry fact that keeps a one-member
 * table from collapsing to its origin.
 *
 * An element citing a runtime model reference, whose bytes this record never
 * holds, contributes its own world origin rather than nothing, exactly as one
 * whose parts draw no vertices does. A space furnished entirely by referenced
 * models therefore still reports where its content stands, and the horizontal
 * degeneracy is deliberate: a width the record never stated is a number that
 * would frame geometry nobody wrote down.
 *
 * `null` is a space with nothing placed in it at any depth. That is an ordinary
 * answer, not a fault: an undressed room and a purely semantic container ("the
 * west wing") are both legitimately empty, so refusing would make every caller
 * guard a normal case. An undeclared space id throws, because that is the
 * caller's own mistake. A degenerate box would be worse than null, because
 * nothing distinguishes it from one real element standing at the origin.
 *
 * These are CPU boxes of finite stated or tessellated vertices under
 * element-world and part-local TRS. Attached-bone transforms, skinning,
 * animation, loaded external geometry and GPU Float32 evaluation are outside
 * this measurement; enclosure of a rendered frame requires those extra effects
 * to be absent or separately bounded.
 */
export function builtEnvironmentSpaceContentBounds(
  environment: IAutoMovieBuiltEnvironment,
  spaceId: string,
): IAutoMovieSubjectBox | null {
  requireBuiltSpace(environment, spaceId);
  const included: Set<string> = builtSpaceSubtree(environment.spaces, spaceId);
  const matrices: Map<string, number[]> =
    builtEnvironmentWorldMatrices(environment);
  const models: Map<string, IAutoMovieModel> = new Map(
    environment.models.map(
      (model: IAutoMovieModel): [string, IAutoMovieModel] => [model.id, model],
    ),
  );
  const boxes: IAutoMovieSubjectBox[] = [];
  for (const element of environment.elements)
    if (
      element.model !== null &&
      element.space !== null &&
      included.has(element.space)
    )
      boxes.push(
        ...builtPlacedPartBoxes(
          models.get(element.model),
          matrices.get(element.id)!,
        ),
      );
  for (const population of environment.populations ?? [])
    if (included.has(population.space))
      boxes.push(
        builtInstanceSetPlacementBounds(
          population.set,
          population.prototypeBounds,
        ),
      );
  return unionSubjectBoxes(boxes);
}
