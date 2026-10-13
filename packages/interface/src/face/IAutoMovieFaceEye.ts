import { AutoMovieFaceWeight } from "./AutoMovieFaceWeight";

/**
 * Traits of ONE eye: signed morph weights in `[-2, 2]`, `0`/omitted meaning
 * unchanged.
 *
 * Lives under {@link IAutoMovieFaceEyeSet.left} / `right`. **Side rule:** when
 * it is the only side defined on the set, these traits apply to BOTH eyes; when
 * both sides are defined, each applies to its own eye only. Sides are the
 * SUBJECT's left/right: her left eye is on the viewer's right. Heterochromia is
 * an iris-color concern, not geometry.
 *
 * @evidence contracts/common.md#principled-implementation Five optional leaves that `flattenFace` maps onto side-suffixed targets: size, width, height and tilt onto `eyeSize`, `eyeWidth`, `eyeHeight` and `eyeTilt`, and offset onto `eyeSpacing` after adding the pair's `spacing`, the sum being what `validateFace` range-checks.
 * @evidence contracts/common.md#clear-and-simple-design Traits of one eye only; the relation between the eyes lives on `IAutoMovieFaceEyeSet`, and `offset` exists so one eye can move sideways without changing the pair's spacing.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The offset-plus-spacing sum is the single cross-level combination, applied only where `flattenFace` handles the spacing targets and documented on both fields; no other leaf is combined or adjusted.
 * @evidence contracts/common.md#meaningful-documentation Gives each leaf's direction, the subject-side convention, the lone-side rule, that `offset` adds to the pair spacing and is range-checked as a sum, and that iris colour is out of scope.
 * @author Samchon
 */
export interface IAutoMovieFaceEye {
  /** Uniform scale of the eye about its own center: `+` larger. */
  size?: AutoMovieFaceWeight;

  /**
   * Horizontal-only scale of the eye fissure: widens the opening without
   * lifting the lids; use with `size` to control the aspect ratio.
   */
  width?: AutoMovieFaceWeight;

  /** Vertical position of the eye on the face: `+` higher. */
  height?: AutoMovieFaceWeight;

  /** Outer-corner slant: `+` lifts the outer corner (upturned eye). */
  tilt?: AutoMovieFaceWeight;

  /**
   * Outward shift of the eye, away from the nose: `+` toward the temple. Adds
   * to the pair-level {@link IAutoMovieFaceEyeSet.spacing}; use this for one
   * eye, `spacing` for the pair. The `[-2, 2]` range applies to that sum, and a
   * violation is reported at this field's path.
   */
  offset?: AutoMovieFaceWeight;
}
