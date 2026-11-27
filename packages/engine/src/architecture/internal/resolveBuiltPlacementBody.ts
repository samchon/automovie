import {
  type IAutoMovieBuiltPlacementBody,
  IAutoMovieBuiltPopulation,
  type IAutoMovieResolveBuiltPlacementBody,
  IAutoMovieSubjectBox,
} from "@automovie/interface";

import { unionSubjectBoxes } from "../../film/internal/unionSubjectBoxes";
import { builtInstanceSetPlacementBounds } from "./builtInstanceSetPlacementBounds";

/*
 * Resolve one building element or population to its reported box and part-box
 * proxies, or null when unresolved.
 *
 * Element parts come from the supplied lookup, permitting one-element
 * measurement or a batch table. Their union has element-origin-point basis when
 * both corners are equal and element-geometry-bounds otherwise. A point can
 * arise from the world-origin fallback or genuine degenerate geometry.
 * Populations delegate to builtInstanceSetPlacementBounds: compact
 * layouts use an envelope law, explicit layouts fold stored transforms, and
 * along-route throws.
 *
 * Null, undefined or empty part answers resolve to null; the existing part
 * lookups use them for undeclared or transform-only elements. An undeclared
 * population id also returns null.
 */
export function resolveBuiltPlacementBody(
  props: IAutoMovieResolveBuiltPlacementBody.IProps,
): IAutoMovieBuiltPlacementBody | null {
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
}
