import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * The orthonormal page basis a view resolved to.
 *
 * The published basis locates page coordinates in world space on the projection plane. Orthographic projection discards source depth, so page coordinates alone cannot recover the original 3D point; the rounded published axes also need not invert the unrounded derivation exactly.
 *
 * `normal` is the reversed view direction, `right` is `up hint × normal`, and
 * `up` is `normal × right`. For a reflected ceiling plan `right` is negated,
 * so that basis is left-handed (`right × up = -normal`). A derived drawing
 * rounds every component to six decimals, so unit length holds only to that
 * precision.
 *
 * @evidence contracts/common.md#principled-implementation `autoMovieDrawingFrame` checks finite vector components, direction/up lengths above 1e-9, positive finite scale and optional finite nonnegative depth bands. It normalizes -direction, normalizes up cross normal and derives normal cross right, rejecting raw cross length at or below 1e-9; this parallelism threshold depends on up magnitude. Usable finite cross-product intermediates remain a premise, and the published drawing rounds each axis component to six decimals after projecting with the unrounded frame.
 * @evidence contracts/common.md#clear-and-simple-design Origin plus three unit vectors is the complete affine frame, and the cut plane reuses the same origin and normal, so no separate plane record is needed.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The mirror for a reflected ceiling plan is the single negation of `right`, stated as making the basis left-handed, rather than a flip applied later in a serializer.
 * @evidence contracts/common.md#meaningful-documentation States how each axis is derived, the reflected handedness, that the origin is both page origin and cut-plane point, and the rounding precision.
 * @author Samchon
 */
export interface IAutoMovieDrawingFrame {
  /**
   * World point at page `(0, 0)`, and the point the cut plane passes through.
   */
  origin: IAutoMovieVector3;

  /** Unit world direction of the page `+x` axis. */
  right: IAutoMovieVector3;

  /** Unit world direction of the page `+y` axis. */
  up: IAutoMovieVector3;

  /** Unit world normal of the cut or picture plane, pointing at the viewer. */
  normal: IAutoMovieVector3;
}
