/**
 * One evaluated skin and its rest-authored garment coverage samples.
 *
 * Triangle indices, positions, normals and field entries address the same
 * native vertices. Positions are posed metres in one body frame; coverage
 * comes from the matching rest skin. The cut reads these arrays without
 * changing them, and the garment owner subsequently closes and lifts its
 * result. Interpolated normals must have a nonzero length wherever retained.
 *
 * @evidence contracts/common.md#principled-implementation Carries the original source triangle incidence and aligned geometry/coverage arrays used by one clipping calculation.
 * @evidence contracts/common.md#clear-and-simple-design Owns only the existing cut inputs; coverage, clipping and garment lift retain their separate calculations.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No contour correction, source exception or expected result is encoded in this carrier.
 * @evidence contracts/common.md#meaningful-documentation States native alignment, rest versus posed meaning, read-only arrays and the normal precondition.
 * @evidence contracts/modeling.md#spatial-conventions Positions are metres and normals dimensionless directions in the same supplied body frame; field entries retain the coverage owner's signed scalar meaning.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The garment producer owns the represented part.
 * @evidenceExclude contracts/modeling.md#parameter-channels Carries evaluated buffers rather than an authoring channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The clipping function owns output incidence and population.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The clipping function constructs the shared edge crossings.
 * @evidenceExclude contracts/modeling.md#rendered-observation The body and person consumers observe the garment.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Carries evaluated geometry and costume coverage, not a physiological value.
 * @evidenceExclude contracts/anatomy.md#permitted-range This carrier admits no anatomical quantity.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Internal evaluated buffers are not personal sculpt inputs.
 * @author Samchon
 */
export interface IHumanBodyUnderwearSurfaceCutInput {
  /** Original triangle corners in native skin vertex order. */
  indices: readonly number[];

  /** Posed skin positions, one XYZ metre triple per native vertex. */
  positions: readonly number[];

  /** Posed outward normal directions, aligned with the skin positions. */
  normals: readonly number[];

  /** Rest coverage per native vertex; positive values retain the skin. */
  field: ArrayLike<number>;
}
