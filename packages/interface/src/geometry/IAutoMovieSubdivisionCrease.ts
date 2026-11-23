/**
 * One semi-sharp or sharp cage edge of a subdivision surface.
 *
 * Sharpness follows DeRose, Kass and Truong (1998): an edge of sharpness `s`
 * uses the sharp crease rules for the first `floor(s)` refinement steps, a
 * blend weighted by the fractional part for the next step, and the smooth rules
 * afterwards, so the crease rounds into a fillet whose width shrinks as `s`
 * grows, without extra edge loops. `10` is infinitely sharp, OpenSubdiv's
 * convention, and stays sharp at every level and in the limit. A boundary edge
 * is always infinitely sharp, so declaring one has no effect.
 */
export interface IAutoMovieSubdivisionCrease {
  /** Index of one end vertex of the cage edge. */
  from: number;

  /** Index of the other end vertex; the order of `from` and `to` is free. */
  to: number;

  /**
   * Finite sharpness from `0` (smooth) to `10` (infinitely sharp); fractional
   * values blend the sharp and smooth rules for one step.
   */
  sharpness: number;
}
