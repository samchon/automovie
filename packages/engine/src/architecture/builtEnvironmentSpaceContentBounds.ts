import { IAutoMovieBuiltEnvironment, IAutoMovieVector3 } from "@automovie/interface";
import { tessellate } from "../geometry/tessellate";
import { builtInstanceSetPlacementBounds } from "./builtInstanceSetPlacementBounds";

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
 * staged set pieces and the compact populations of this space and every space
 * below it. Each element stands where the environment's current operating state
 * puts it, which is where {@link lowerBuiltEnvironment} stages it, so a leaf
 * authored open widens the box by the leaf where it actually rests. Geometry is
 * read through {@link tessellate} for a primitive and from the stated mesh
 * otherwise, the same vertices the renderer draws, so the box cannot drift from
 * the picture.
 *
 * **A population widens this box, and that is the intended change rather than a
 * regression.** Before populations existed the answer counted elements alone,
 * and in the medieval-residence experiment that meant a room whose slate, ashlar
 * and flagging were four instance sets reported the box of whatever few elements
 * were left over: not `null`, which would have been noticed, but a plausibly
 * small box a review camera then aimed into a corner. A caller that stored the
 * old answer is holding a narrower box than the room's contents, so an eye
 * derived from it frames less than it did. A population contributes through
 * {@link builtInstanceSetPlacementBounds}, which measures the region its
 * declared placement law spans after folding the population's authored
 * prototype-local box through every scale and rotation that law permits. The
 * building cannot inspect the recipe's mesh, so the local box is the explicit
 * geometry fact that keeps a one-member table from collapsing to its origin.
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
 * guard a normal case, and this file keeps refusal for an undeclared space id,
 * which is the caller's own mistake. A degenerate box would be worse than null,
 * because nothing distinguishes it from one real element standing at the
 * origin.
 *
 * @evidence requirements/interior/scope-and-host-boundary.md#interior-current-product-scope `builtEnvironmentSpaceContentBounds` reports the world box the placed contents of a logical space and its descendants fill. This ensures authored building-interior state remains explicit and reviewable within its supported host boundary.
 * @evidence specifications/interior-space/scope-and-host.md#interior-space-building-interior-boundary `builtEnvironmentSpaceContentBounds` resolves the element hierarchy, ownership, and geometry of one logical-space subtree into its world extent inside one building-interior boundary.
 * @evidence requirements/asset-authoring/identity-and-instances.md#asset-logical-group `builtEnvironmentSpaceContentBounds` includes every compact population owned by the queried space subtree instead of losing it behind instance compression.
 * @evidence requirements/asset-authoring/identity-and-instances.md#asset-compression-individuality `builtEnvironmentSpaceContentBounds` measures a compressed population from its stable placement law rather than treating omitted expansion as empty content.
 * @evidence specifications/asset-and-representation/alternatives-instances-and-groups.md#asset-spec-group-individuality `builtEnvironmentSpaceContentBounds` folds the compact population record itself, so a spatial query remains proportional to populations rather than procedural members.
 * @evidence requirements/asset-authoring/representations-bounds-and-lod.md#asset-declared-measured-bounds `builtEnvironmentSpaceContentBounds` keeps the authored prototype-local extent separate from the world-space content box it derives.
 * @evidence specifications/asset-and-representation/bounds-proxies-and-lod.md#asset-spec-bounds-inputs `builtEnvironmentSpaceContentBounds` derives the current world extent from the population's declared local bound and placement law without persisting a second placement box.
 * @author Samchon
 */
export const builtEnvironmentSpaceContentBounds = (
  environment: IAutoMovieBuiltEnvironment,
  spaceId: string,
): { min: IAutoMovieVector3; max: IAutoMovieVector3 } | null => {
  requireSpace(environment, spaceId);
  const included = descendantSpaces(environment.spaces, spaceId);
  const matrices = worldMatricesOf(environment, operationDeltas(environment));
  const models = new Map(
    environment.models.map((model) => [model.id, model] as const),
  );
  const points = environment.elements
    .filter(
      (element) =>
        element.model !== null &&
        element.space !== null &&
        included.has(element.space),
    )
    .flatMap((element) =>
      placedElementPoints(
        models.get(element.model!),
        matrices.get(element.id)!,
      ),
    );
  for (const population of environment.populations ?? [])
    if (included.has(population.space)) {
      const bounds = builtInstanceSetPlacementBounds(
        population.set,
        population.prototypeBounds,
      );
      points.push(bounds.min, bounds.max);
    }
  return points.length === 0 ? null : boundsOf(points);
};
