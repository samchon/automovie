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
 * @evidence contracts/common.md#principled-implementation Per-edge sharpness with uniform decrement and fractional blending is the semi-sharp crease model of DeRose, Kass and Truong (1998); the infinite value 10 is the OpenSubdiv constant, so authored values mean the same as in that reference.
 * @evidence contracts/common.md#clear-and-simple-design An edge is named by its two cage vertices, the identity the cage already has, instead of an edge index the caller would have to derive from the subdivider's own edge numbering.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts `subdivideAutoMovieSurface` refuses a crease naming no cage edge, a repeated edge, and a sharpness outside 0 to 10, instead of ignoring or clamping it.
 * @evidence contracts/common.md#meaningful-documentation States the rule sequence a sharpness selects, the infinite value, the boundary interaction, and the admitted range.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A data record with no runtime body; the refinement cost is answered on `subdivideAutoMovieSurface`.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Read once while the cage is admitted; nothing is cached on it.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Caller-owned and read only; the subdivider copies the sharpness into its own edge table.
 * @author Samchon
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
