import { IAutoMoviePlanarPoint } from "./IAutoMoviePlanarPoint";

/**
 * A closed outline in the host boundary's own frame, straight edges or arcs.
 *
 * Edge `i` runs from `outline[i]` to `outline[(i + 1) % outline.length]`. A
 * rectangular door is four points and no bulge at all; a semicircular oculus is
 * two points and two half-turn bulges; a round-headed arch is the jambs and the
 * head as one bulged edge. Nothing here names a door type: the outline is the
 * general shape and the rectangle is one of its cases.
 *
 * Validation and extents read the straight hull that replaces each arc with
 * its chord-and-sagitta rectangle: that hull must enclose area, not cross
 * itself, lie inside the host face's outline, and not overlap another
 * opening's hull on the same boundary. Area is computed exactly from circular
 * segments, and drawings draft arcs as fixed-step chords.
 *
 * @evidence contracts/common.md#principled-implementation `outlineHull` bounds each arc of at most a half turn by its chord and sagitta, which contains the true arc and touches its extremes, so hull-based containment and overlap only err toward refusal; `autoMovieOpeningArea` adds each arc's exact circular segment `r^2 (theta - sin theta) / 2`.
 * @evidence contracts/common.md#clear-and-simple-design One outline with optional per-edge bulges covers rectangles, arches, and circles, and absent bulges mean straight edges, so no opening-type enum or second arc record exists.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Arcs past a half turn are refused rather than sampled, and a bulge-free two-point outline is refused for enclosing no area rather than padded with a third corner.
 * @evidence contracts/common.md#meaningful-documentation States the edge indexing, worked shapes, what validation and extents read, how area and drawings treat arcs, the two-point floor and why, and the bulge's magnitude, sign convention, and limit.
 * @author Samchon
 */
export interface IAutoMovieOpeningProfile {
  /**
   * Closed outline in host-boundary-local XY metres, at least two points.
   *
   * Two is the floor rather than three because a circle is two arcs, and
   * demanding a third corner would outlaw a round oculus for no geometric
   * reason. What must hold is that the outline encloses area once its arcs are
   * taken into account, so two points with no bulge between them are still
   * refused.
   */
  outline: IAutoMoviePlanarPoint[];

  /**
   * Per-edge circular bulge, one entry per edge when stated at all.
   *
   * The magnitude is the polyline bulge `tan(theta / 4)` for the arc's included
   * angle `theta`, so `0` is a straight edge and `1` is a half turn. The sign
   * is mirrored from AutoCAD and DXF: a positive bulge leans to the left of the
   * edge's own direction, a clockwise arc, while an AutoCAD positive bulge turns
   * counter-clockwise and leans right, so an imported DXF bulge is negated. Each
   * value must be finite with magnitude at most `1`: an arc longer than a half
   * turn is authored as two edges, which is what keeps each arc's extent
   * exactly boundable rather than sampled.
   */
  bulges?: number[];
}
