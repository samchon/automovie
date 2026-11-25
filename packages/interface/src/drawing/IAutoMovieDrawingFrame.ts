import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * The orthonormal page basis a view resolved to.
 *
 * The published basis locates page coordinates in world space on the projection
 * plane. Orthographic projection discards source depth, so page coordinates
 * alone cannot recover the original 3D point; the rounded published axes also
 * need not invert the unrounded derivation exactly.
 *
 * `normal` is the reversed view direction, `right` is `up hint × normal`, and
 * `up` is `normal × right`. For a reflected ceiling plan `right` is negated, so
 * that basis is left-handed (`right × up = -normal`). A derived drawing rounds
 * every component to six decimals, so unit length holds only to that
 * precision.
 */
export interface IAutoMovieDrawingFrame {
  /** World point at page `(0, 0)`, and the point the cut plane passes through. */
  origin: IAutoMovieVector3;

  /** Unit world direction of the page `+x` axis. */
  right: IAutoMovieVector3;

  /** Unit world direction of the page `+y` axis. */
  up: IAutoMovieVector3;

  /** Unit world normal of the cut or picture plane, pointing at the viewer. */
  normal: IAutoMovieVector3;
}
