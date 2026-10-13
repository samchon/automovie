import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * The orthonormal page basis a view resolved to.
 *
 * Published rather than kept private because every number in the drawing is
 * expressed in it: without the basis, a page coordinate cannot be turned back
 * into the world point it came from, and a consumer that wanted to check the
 * drawing against the design would have to re-derive the frame and hope it
 * matched.
 *
 * For a reflected ceiling plan `right` is negated, so that basis is left-handed
 * (`right × up = -normal`). A derived drawing rounds every component to six
 * decimals, so unit length holds only to that precision.
 *
 * @evidence contracts/common.md#principled-implementation `autoMovieDrawingFrame` takes `normal` as the negated view direction, `right` as `up × normal` normalized and `up` re-orthogonalized as `normal × right`, then negates `right` for the reflected ceiling plan; zero, non-finite or parallel inputs throw.
 * @evidence contracts/common.md#clear-and-simple-design An origin and three unit vectors are the least data that maps a page point back to the world, published so consumers never re-derive it.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The ceiling-plan mirror lives only in this frame's negated `right` and in no consumer, which is exactly why that basis is left-handed.
 * @evidence contracts/common.md#meaningful-documentation States what each vector means, the handedness of the reflected case, and the rounding precision of the published components.
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

  /** Unit world normal of the cut/picture plane, pointing at the viewer. */
  normal: IAutoMovieVector3;
}
