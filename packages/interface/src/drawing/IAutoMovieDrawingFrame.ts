import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * The orthonormal page basis a view resolved to.
 *
 * Published because every number in the drawing is expressed in it: without
 * the basis, a page coordinate cannot be turned back into the world point it
 * came from, and a consumer checking the drawing against the design would have
 * to re-derive the frame.
 *
 * `normal` is the reversed view direction, `right` is `up hint × normal`, and
 * `up` is `normal × right`. For a reflected ceiling plan `right` is negated,
 * so that basis is left-handed (`right × up = -normal`). A derived drawing
 * rounds every component to six decimals, so unit length holds only to that
 * precision.
 *
 * @evidence contracts/common.md#principled-implementation `autoMovieDrawingFrame` normalizes the negated direction into the normal, takes the right axis from the cross product of the up hint and the normal, and re-orthogonalizes up as `normal × right`, throwing when the direction or up hint is non-finite, shorter than the drawing epsilon, or parallel; a page point is then `(dot(p - origin, right), dot(p - origin, up))`.
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
