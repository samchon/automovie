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
 * Resolve one building element or population to its reported box and part-box proxies, or null when unresolved.
 *
 * Element parts come from the supplied lookup, permitting one-element measurement or a batch table. Their union has element-origin-point basis when both corners are equal and element-geometry-bounds otherwise. A point can arise from the world-origin fallback or genuine degenerate geometry. Populations delegate to {@link builtInstanceSetPlacementBounds}: compact layouts use an envelope law, explicit layouts fold stored transforms, and along-route throws.
 *
 * Null, undefined or empty part answers resolve to null; the existing part lookups use them for undeclared or transform-only elements. An undeclared population id also returns null.
 *
 * @evidence contracts/common.md#principled-implementation Unions the supplied axis-aligned part boxes under their static CPU measurement premise. Equal minimum and maximum coordinates select the point basis, whether produced by the origin fallback or degenerate geometry; the label alone does not distinguish those sources.
 * @evidence contracts/common.md#clear-and-simple-design One resolution rule behind the single-body bounds query and both overlap queries, with the part source injected because one caller measures one element and another reads a building-wide table.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Names no element, population or caller; an unresolved locator answers null for the caller to report, and the `along-route` refusal of the population fold passes through rather than being caught.
 * @evidence contracts/common.md#meaningful-documentation States what `parts` supplies and what its empty answers mean, how the element box and its basis are derived, that populations stay compact, the `along-route` throw, and every null case.
 * @evidence contracts/performance.md#efficient-algorithms One caller-supplied part lookup plus an O(P) union of P part boxes, or an O(R) scan of R populations plus the placement-bounds fold. The fold validates every stored explicit transform and constructs eight corners per selected explicit member; compact layouts use a bounded corner set.
 * @evidence contracts/performance.md#reuse-equivalent-work The part boxes the caller supplies are reused as the solids and as the input to the union, so each body is measured once per resolution; reuse across bodies is the caller's lookup, such as the sweep's one building-wide part table.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Keeps nothing after returning; the result references the lookup's part boxes and one new union box, both owned by the caller.
 */
export const resolveBuiltPlacementBody: (props: { environment: IAutoMovieBuiltEnvironment; target: AutoMovieBuiltPlacementBodyLocator; parts: (elementId: string) => readonly IAutoMovieSubjectBox[] | null | undefined; }) => IAutoMovieBuiltPlacementBody | null = (props: {
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
