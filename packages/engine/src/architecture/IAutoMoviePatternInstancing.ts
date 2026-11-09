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
 * @evidence contracts/development/design.md#principled-representation A whole occurrence maps to a computed TRS slot using its centre, frame basis, in-plane turn, size and thickness. Frame orthogonality is admitted within tolerance, so correspondence to the authored basis is numerical rather than an exact affine factorization; generated finite, well-scaled placement data is a premise.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Two lists, slots and cut ids, so the caller instances one and builds the other as geometry without filtering.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A cut piece is never scaled into a wrong-shaped slot; it is listed in `cut` for the caller to build, and `mirror` is left to the texture transform.
 * @evidence contracts/development/common.md#meaningful-documentation States the producer, how each slot field is derived, the prototype indexing, the role of `mirror`, and where the remaining occurrences go.
 */
export interface IAutoMoviePatternInstancing {
  /** One computed full-TRS slot per whole occurrence, in placement order. */
  transforms: IAutoMovieExplicitInstanceTransform[];

  /** Occurrence ids that were cut and therefore need their own geometry. */
  cut: string[];
}
