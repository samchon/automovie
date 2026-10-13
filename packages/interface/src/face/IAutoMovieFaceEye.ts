/**
 * Traits of one eye: signed morph weights in `[-2, 2]`, with `0` or omission
 * meaning unchanged.
 *
 * Lives under {@link IAutoMovieFaceEyeSet.left} or `right`. When it is the only
 * side stated on the set, its traits apply to both eyes; when both sides are
 * stated, each applies to its own eye only. Sides are the subject's: her left
 * eye is on the viewer's right. Heterochromia is an iris colour concern, not
 * geometry, so it has no trait here.
 *
 * @evidence contracts/common.md#principled-implementation `flattenFace` maps `size`, `width`, `height` and `tilt` to the `eyeSize`, `eyeWidth`, `eyeHeight` and `eyeTilt` side targets and adds the set's `spacing` to `offset` for the `eyeSpacing` targets, reporting the sum at the side's `offset` path, or at `eyes.spacing` when no side states an offset.
 * @evidence contracts/common.md#clear-and-simple-design One side record holds every per-eye trait, and the pair-level spacing lives on the set, so a per-eye shift and a symmetric spacing change do not need two spellings of the same field.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The summed spacing weight is range-checked as one value at the field the document spells, rather than checking each addend and letting their sum leave the range unreported.
 * @evidence contracts/common.md#meaningful-documentation States the weight range and neutral meaning, the lone-side rule, the subject-relative sides, and why colour is absent; members give each trait's direction and how `offset` combines with `spacing`.
 * @author Samchon
 */
export interface IAutoMovieFaceEye {
  /** Uniform scale of the eye about its own centre: `+` larger. */
  size?: number;

  /**
   * Horizontal-only scale of the eye opening, widening it without lifting the
   * lids; combine with `size` to set the aspect ratio.
   */
  width?: number;

  /** Vertical position of the eye on the face: `+` higher. */
  height?: number;

  /** Outer-corner slant: `+` lifts the outer corner for an upturned eye. */
  tilt?: number;

  /**
   * Outward shift of this eye away from the nose: `+` toward the temple.
   *
   * Adds to the pair-level {@link IAutoMovieFaceEyeSet.spacing}; use this for
   * one eye and `spacing` for both. The `[-2, 2]` range applies to the sum, and
   * a violation is reported at this field's path.
   */
  offset?: number;
}
