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
 * @evidence contracts/common.md#principled-implementation Whole occurrences become full TRS slots built from an orthonormal basis (turned U, `normal × U`, normal) decomposed to a unit quaternion; cut ones are only named, because scaling a whole module to a cut piece's box would render the wrong shape.
 * @evidence contracts/common.md#clear-and-simple-design Two lists, slots and cut ids, so the caller instances one set and builds geometry for the other without reading cut classes again.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A variant index beyond the prototype table throws instead of wrapping, and a mirrored piece keeps its slot unchanged because a flipped rectangle has the same footprint.
 * @evidence contracts/common.md#meaningful-documentation States how each slot field is formed, the prototype indexing and its refusal, the mirror rule, and what `cut` lists.
 * @evidenceExclude contracts/performance.md#cost-and-resources Owns fresh slot objects and id arrays built in one linear pass over placements; a second call with another thickness or prototype table rebuilds every slot.
 * @author Samchon
 */
export interface IAutoMoviePatternInstancing {
  /** One exact full-TRS slot per whole occurrence, in placement order. */
  transforms: IAutoMovieExplicitInstanceTransform[];

  /** Occurrence ids that were cut and therefore need their own geometry. */
  cut: string[];
}
