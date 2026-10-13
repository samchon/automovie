import { IAutoMovieExplicitInstanceTransform } from "@automovie/interface";

/**
 * Explicit instance slots and the occurrences that cannot become one.
 *
 * Produced by `autoMoviePatternInstanceTransforms`. A whole occurrence
 * (`cut === "none"`) becomes one slot whose id is the occurrence id,
 * translation the centre on its zone's facet or the main frame, rotation the
 * frame's U turned by `rotationDeg` with `+Z` along the face normal, scale
 * `(size.u, size.v, thickness)`, and prototype `prototypes[variant]` when a
 * table is given. `mirror` does not change a slot; it shows only through the
 * texture transform. Every other occurrence is listed in `cut`.
 *
 * @author Samchon
 */
export interface IAutoMoviePatternInstancing {
  /** One exact full-TRS slot per whole occurrence, in placement order. */
  transforms: IAutoMovieExplicitInstanceTransform[];

  /** Occurrence ids that were cut and therefore need their own geometry. */
  cut: string[];
}
