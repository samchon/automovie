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
 * @evidence contracts/common.md#principled-implementation A closed outline with optional AutoCAD bulges `tan(theta / 4)` capped at magnitude 1; `outlineHull` bounds each arc of at most a half turn exactly by its chord and sagitta, and validation runs the area, simplicity, face-containment, and overlap tests on that hull.
 * @evidence contracts/common.md#clear-and-simple-design Points plus an optional parallel bulge array and no door-type field, because a rectangle, an arch, and an oculus are cases of one outline.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The half-turn cap is what makes arc bounds exact rather than sampled; the hull over-approximates an arc, so containment and overlap errors only refuse, and no outline shape is special-cased.
 * @evidence contracts/common.md#meaningful-documentation States the edge indexing, frame and metre units, the two-point floor and why, the bulge convention, sign, and cap, the one-bulge-per-edge rule, and which reading each consumer uses.
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
   * The value is AutoCAD's polyline convention `tan(theta / 4)` for the arc's
   * included angle `theta`, so `0` is a straight edge and `1` is a half turn
   * bulging to the left of the edge's own direction. The magnitude may not
   * exceed `1`: an arc longer than a half turn is authored as two edges, which
   * is what keeps each arc's extent exactly boundable rather than sampled.
   */
  bulges?: number[];
}
