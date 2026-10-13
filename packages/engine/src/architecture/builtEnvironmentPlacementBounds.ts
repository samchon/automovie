import {
  AutoMovieBuiltPlacementBodyLocator,
  IAutoMovieBuiltEnvironment,
  IAutoMovieBuiltPlacementBounds,
} from "@automovie/interface";

import { builtEnvironmentElementBounds } from "./builtEnvironmentElementBounds";
import { builtInstanceSetPlacementBounds } from "./builtInstanceSetPlacementBounds";

/**
 * Resolve one building element or compact population to its current world box.
 *
 * An environment-owned element is measured through the same tessellated model
 * and full hierarchy transform its spatial queries use, so this is not a second
 * answer to "where does it stand". A compact population delegates to its one
 * placement-bounds fold and is never expanded here.
 *
 * A missing identity or a transform-only group answers `null`, because neither
 * states a place a body occupies. An element the record locates but carries no
 * vertices for — a runtime model reference, a model with no parts — resolves to
 * the single world origin the record does state, and says so with the
 * `element-origin-point` basis rather than passing a point off as geometry. The
 * caller keeps the position it asked for, and every overlap or gap taken from
 * that box carries the label that says it measured no volume.
 *
 * @evidence contracts/common.md#principled-implementation Dispatches on locator kind: an element delegates to `builtEnvironmentElementBounds` and labels a zero-extent box `element-origin-point`, and a population delegates to `builtInstanceSetPlacementBounds` without expanding members.
 * @evidence contracts/common.md#clear-and-simple-design A thin dispatcher that adds only the basis label, so element geometry stays in the element query and the population law stays in the instance-set fold.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The origin-point basis is decided by exact equality of the two corners, so a model whose drawn vertices collapse to one point is labelled the same way, which still reads truthfully as a box measuring no volume.
 * @evidence contracts/common.md#meaningful-documentation States the two resolution paths, the null cases, when the origin-point basis appears, and how it qualifies overlaps and gaps taken from the box.
 * @evidence contracts/performance.md#cost-and-resources Defect: an element locator inherits the element query's whole-hierarchy staging per call and a population locator searches populations linearly; with no cache between calls, the sweeps that resolve every body through here pay `O(E^2)` staging.
 * @author Samchon
 */
export const builtEnvironmentPlacementBounds = (props: {
  environment: IAutoMovieBuiltEnvironment;
  target: AutoMovieBuiltPlacementBodyLocator;
}): IAutoMovieBuiltPlacementBounds | null => {
  if (props.target.kind === "element") {
    const bounds = builtEnvironmentElementBounds(
      props.environment,
      props.target.id,
    );
    return bounds === null
      ? null
      : {
          ...bounds,
          basis:
            bounds.min.x === bounds.max.x &&
            bounds.min.y === bounds.max.y &&
            bounds.min.z === bounds.max.z
              ? "element-origin-point"
              : "element-geometry-bounds",
        };
  }
  const population = (props.environment.populations ?? []).find(
    (candidate) => candidate.set.id === props.target.id,
  );
  if (population === undefined) return null;
  return {
    ...builtInstanceSetPlacementBounds(
      population.set,
      population.prototypeBounds,
    ),
    basis: "population-placement-bounds",
  };
};
