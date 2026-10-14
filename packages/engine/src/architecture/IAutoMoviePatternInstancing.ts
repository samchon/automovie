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
 * @evidence contracts/common.md#principled-implementation A whole occurrence maps to a computed TRS slot using its centre, frame basis, in-plane turn, size and thickness. Frame orthogonality is admitted within tolerance, so correspondence to the authored basis is numerical rather than an exact affine factorization; generated finite, well-scaled placement data is a premise.
 * @evidence contracts/common.md#clear-and-simple-design Two lists, slots and cut ids, so the caller instances one and builds the other as geometry without filtering.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A cut piece is never scaled into a wrong-shaped slot; it is listed in `cut` for the caller to build, and `mirror` is left to the texture transform.
 * @evidence contracts/common.md#meaningful-documentation States the producer, how each slot field is derived, the prototype indexing, the role of `mirror`, and where the remaining occurrences go.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A data shape; one constant-time slot per whole occurrence, answered on `autoMoviePatternInstanceTransforms`.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Slots are built per call from the run result and not retained between calls or frames.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The caller owns both arrays, and every slot's translation, rotation and scale is computed fresh, so no slot aliases the frame or a placement.
 * @author Samchon
 */
export interface IAutoMoviePatternInstancing {
  /** One computed full-TRS slot per whole occurrence, in placement order. */
  transforms: IAutoMovieExplicitInstanceTransform[];

  /** Occurrence ids that were cut and therefore need their own geometry. */
  cut: string[];
}
