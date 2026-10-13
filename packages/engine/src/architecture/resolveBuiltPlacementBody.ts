import {
  AutoMovieBuiltPlacementBodyLocator,
  IAutoMovieBuiltEnvironment,
  IAutoMovieBuiltPopulation,
  IAutoMovieSubjectBox,
} from "@automovie/interface";

import { unionSubjectBoxes } from "../film/unionSubjectBoxes";
import { IAutoMovieBuiltPlacementBody } from "./IAutoMovieBuiltPlacementBody";
import { builtInstanceSetPlacementBounds } from "./builtInstanceSetPlacementBounds";

/**
 * Resolve one building element or compact population to its reported box and
 * the boxes it fills, or null when it occupies no place.
 *
 * An element's part boxes come from `parts`, so a single-pair query can measure
 * one element on the spot while a sweep reads a table it resolved once for the
 * whole building; the rule for turning parts into a body is the same either
 * way. The reported box is their union, labelled `element-origin-point` when it
 * is a single point, which is what an element whose model the record does not
 * hold or whose parts draw no vertex resolves to, and `element-geometry-bounds`
 * otherwise. A population delegates to {@link builtInstanceSetPlacementBounds}
 * and is never expanded; that fold throws for an `along-route` layout.
 *
 * A `parts` answer of `null`, `undefined` or an empty list means the element is
 * undeclared or a transform-only group, and resolves to null, as does a
 * population id the record does not hold.
 *
 * @evidence contracts/common.md#principled-implementation The element box is the union of its part boxes, which equals the box of every drawn vertex because each part box is that part's exact vertex box; the point-box test compares corners exactly because the origin fallback copies one point into both corners.
 * @evidence contracts/common.md#clear-and-simple-design One resolution rule behind the single-body bounds query and both overlap queries, with the part source injected because one caller measures one element and another reads a building-wide table.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Names no element, population or caller; an unresolved locator answers null for the caller to report, and the `along-route` refusal of the population fold passes through rather than being caught.
 * @evidence contracts/common.md#meaningful-documentation States what `parts` supplies and what its empty answers mean, how the element box and its basis are derived, that populations stay compact, the `along-route` throw, and every null case.
 * @evidence contracts/performance.md#efficient-algorithms One part lookup and a fold over the element's part count, or one population scan plus its placement-bounds fold; nothing is expanded per member.
 * @evidence contracts/performance.md#reuse-equivalent-work The part boxes the caller supplies are reused as the solids and as the input to the union, so each body is measured once per resolution; reuse across bodies is the caller's lookup, such as the sweep's one building-wide part table.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Keeps nothing after returning; the result references the lookup's part boxes and one new union box, both owned by the caller.
 */
export const resolveBuiltPlacementBody = (props: {
  environment: IAutoMovieBuiltEnvironment;
  target: AutoMovieBuiltPlacementBodyLocator;
  /** World part boxes of one element id, or null or undefined when it has none. */
  parts: (
    elementId: string,
  ) => readonly IAutoMovieSubjectBox[] | null | undefined;
}): IAutoMovieBuiltPlacementBody | null => {
  if (props.target.kind === "element") {
    const solids: readonly IAutoMovieSubjectBox[] | null | undefined =
      props.parts(props.target.id);
    const union: IAutoMovieSubjectBox | null =
      solids === null || solids === undefined
        ? null
        : unionSubjectBoxes(solids);
    if (solids === null || solids === undefined || union === null) return null;
    return {
      bounds: {
        ...union,
        basis:
          union.min.x === union.max.x &&
          union.min.y === union.max.y &&
          union.min.z === union.max.z
            ? "element-origin-point"
            : "element-geometry-bounds",
      },
      solids,
    };
  }
  const id: string = props.target.id;
  const population: IAutoMovieBuiltPopulation | undefined = (
    props.environment.populations ?? []
  ).find(
    (candidate: IAutoMovieBuiltPopulation): boolean => candidate.set.id === id,
  );
  if (population === undefined) return null;
  const bounds: IAutoMovieBuiltPlacementBody["bounds"] = {
    ...builtInstanceSetPlacementBounds(
      population.set,
      population.prototypeBounds,
    ),
    basis: "population-placement-bounds",
  };
  return { bounds, solids: [bounds] };
};
