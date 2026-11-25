/**
 * One axis-aligned rectangular void in a wall's local XY face, in metres from
 * the wall's lower-left corner, as `buildAutoMovieWall` cuts it.
 *
 * The wall builder refuses a blank or repeated `id`, a non-finite corner, a
 * nonpositive size, an opening reaching past the wall, two openings that
 * overlap, two that meet only at a corner and pinch the wall to a line, and a
 * set that removes the whole wall. `builtBoundaryWallCut` derives one per built
 * opening from the bounding box of its profile's hull.
 */
export interface IAutoMovieWallOpening {
  /** Opening identity, non-blank and unique per wall, named in diagnostics. */
  id: string;

  /** Left edge in metres from the wall's left edge, at least zero. */
  x: number;

  /** Bottom edge in metres from the wall's bottom edge, at least zero. */
  y: number;

  /** Positive width in metres; `x + width` may not exceed the wall width. */
  width: number;

  /** Positive height in metres; `y + height` may not exceed the wall height. */
  height: number;
}
