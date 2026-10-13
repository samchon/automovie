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
