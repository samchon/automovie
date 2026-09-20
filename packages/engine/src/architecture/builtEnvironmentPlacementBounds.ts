import { AutoMovieBuiltPlacementBodyLocator, IAutoMovieBuiltEnvironment, IAutoMovieBuiltPlacementBounds } from "@automovie/interface";
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
 * @evidence requirements/building-exterior/structure-and-envelope.md#building-structural-support Supplies the world extent project source needs to inspect one named building placement.
 * @evidence specifications/building-envelope/structure-envelope-and-materials.md#building-envelope-structural-support-input-output Resolves element geometry or conservative compact-population bounds while preserving the measurement basis.
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
