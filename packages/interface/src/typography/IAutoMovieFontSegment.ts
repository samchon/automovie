import type { AutoMovieVector2Tuple } from "../geometry/AutoMovieVector2Tuple";

/**
 * One quadratic Bézier segment of a glyph contour, in font units with `+x`
 * along the baseline toward the reader's right and `+y` up from the baseline.
 *
 * A TrueType contour is a chain of on-curve points joined by straight lines or
 * by quadratic arcs through one off-curve control point, with an on-curve point
 * implied midway between two consecutive off-curve points (ISO/IEC 14496-22,
 * the `glyf` table). The decoder writes every piece in this one form: a
 * straight piece carries its control point at the midpoint of its ends, which
 * traces the same line. A contour's segments are listed in the font's order,
 * each `start` equal to the previous segment's `end`, and the last `end` equal
 * to the first `start`, so the contour is closed.
 */
export interface IAutoMovieFontSegment {
  /** On-curve start point, font units. */
  start: AutoMovieVector2Tuple;

  /**
   * Off-curve control point, font units; the midpoint of `start` and `end` for
   * a straight piece.
   */
  control: AutoMovieVector2Tuple;

  /** On-curve end point, font units. */
  end: AutoMovieVector2Tuple;
}
