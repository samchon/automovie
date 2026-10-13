import {
  IAutoMovieBuiltEnvironment,
  IAutoMovieModel,
  IAutoMovieSubjectBox,
} from "@automovie/interface";

import { unionSubjectBoxes } from "../film/unionSubjectBoxes";
import { builtEnvironmentWorldMatrices } from "./builtEnvironmentWorldMatrices";
import { builtInstanceSetPlacementBounds } from "./builtInstanceSetPlacementBounds";
import { builtPlacedPartBoxes } from "./builtPlacedPartBoxes";
import { builtSpaceSubtree } from "./builtSpaceSubtree";
import { requireBuiltSpace } from "./requireBuiltSpace";

/**
 * The world box the contents of a logical space and its descendants fill.
 *
 * A declared space and the thing standing in it are two different extents, and
 * reading the first as the second is what puts a review camera in an empty
 * corner. In the medieval-residence experiment the space `stair-ground` is
 * declared over x 3.5..14.5, z 5.5..11.5 while the stair tower filling it
 * occupies x 8.93..14.13, z 5.90..11.10, so three of four cameras placed at the
 * declared cell's corners stood outside the tower and framed a wall. The cell
 * answers how far the room reaches; this answers where its content is, which is
 * the question a reviewer placing an eye actually asks.
 *
 * What is measured is exactly what {@link builtEnvironmentSpaceNodes} names: the
 * staged elements that draw a model and the compact populations of this space
 * and every space below it. Each element is measured by the same part boxes as
 * {@link builtEnvironmentElementPartBounds}, where the environment's current
 * operating state puts it, which is where {@link lowerBuiltEnvironment} stages
 * it, so a leaf authored open widens the box by the leaf where it actually
 * rests.
 *
 * A population widens this box. It contributes through
 * {@link builtInstanceSetPlacementBounds}, which measures the region its
 * declared placement law spans after folding the population's authored
 * prototype-local box through every scale and rotation that law permits, and
 * throws for an `along-route` layout. The building cannot inspect the recipe's
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
 * @evidence contracts/common.md#principled-implementation The answer is the union of the exact part boxes of every drawn element and the conservative placement box of every population in the subtree, so it encloses every vertex the renderer draws there and every member position the population law permits.
 * @evidence contracts/common.md#clear-and-simple-design Composes the shared subtree walk, current-state staging, part measurement and box union, so this query owns only which elements and populations belong to the space.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Names no space, element or production; the medieval-residence numbers motivate the query in the documentation and appear nowhere in the code, and the origin fallback and the `null` answer are stated rules.
 * @evidence contracts/common.md#meaningful-documentation States which contents are measured, the operating state, the population fold and its `along-route` throw, the runtime-model origin fallback, the meaning of `null`, and the throw for an undeclared id.
 * @evidence contracts/performance.md#efficient-algorithms Linear in the space and element counts plus the summed vertex count of the subtree's drawn elements and the population count; the whole hierarchy is staged because a content element's world matrix depends on ancestors outside the subtree.
 * @evidence contracts/performance.md#reuse-equivalent-work One staging pass and one model index are shared by every element in the subtree within the call; nothing is cached across calls because the record is the caller's and may change.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Allocates the subtree set, staged matrices, model index and one box per measured part for one call and drops them on return; the caller owns the single returned box.
 * @author Samchon
 */
export const builtEnvironmentSpaceContentBounds = (
  environment: IAutoMovieBuiltEnvironment,
  spaceId: string,
): IAutoMovieSubjectBox | null => {
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
};
