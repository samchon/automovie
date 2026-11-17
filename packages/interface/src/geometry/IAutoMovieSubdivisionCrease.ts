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
 *
 * @evidence contracts/development/design.md#principled-representation Per-edge sharpness with uniform decrement and fractional blending is the semi-sharp crease model of DeRose, Kass and Truong (1998); the infinite value 10 is the OpenSubdiv constant, so authored values mean the same as in that reference.
 * @evidence contracts/development/design.md#minimal-and-owned-surface An edge is named by its two cage vertices, the identity the cage already has, instead of an edge index the caller would have to derive from the subdivider's own edge numbering.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts `subdivideAutoMovieSurface` refuses a crease naming no cage edge, a repeated edge, and a sharpness outside 0 to 10, instead of ignoring or clamping it.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule sequence a sharpness selects, the infinite value, the boundary interaction, and the admitted range.
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
