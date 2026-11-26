import { type IAutoMoviePlanarPoint, type IAutoMovieOpeningProfile, type IAutoMoviePolygonBounds } from "@automovie/interface";
import { outlineCentroid as outlineCentroidImplementation } from "./internal/outlineCentroid";
import { outlineHull as outlineHullImplementation } from "./internal/outlineHull";
import { planarSide as planarSideImplementation } from "./internal/planarSide";
import { pointInPolygon as pointInPolygonImplementation } from "./internal/pointInPolygon";
import { pointOnSegment as pointOnSegmentImplementation } from "./internal/pointOnSegment";
import { polygonBounds as polygonBoundsImplementation } from "./internal/polygonBounds";
import { polygonDoubleArea as polygonDoubleAreaImplementation } from "./internal/polygonDoubleArea";
import { polygonInside as polygonInsideImplementation } from "./internal/polygonInside";
import { polygonIsSimple as polygonIsSimpleImplementation } from "./internal/polygonIsSimple";
import { polygonShortestEdge as polygonShortestEdgeImplementation } from "./internal/polygonShortestEdge";
import { polygonsOverlap as polygonsOverlapImplementation } from "./internal/polygonsOverlap";
import { segmentsCross as segmentsCrossImplementation } from "./internal/segmentsCross";
import { segmentsTouch as segmentsTouchImplementation } from "./internal/segmentsTouch";

/** Public operations for Auto Movie Engine Planar Geometry. */
export namespace AutoMovieEnginePlanarGeometry {
  /**
   * The area-weighted centroid of a closed planar outline, or the mean of its
   * points when the outline encloses no area.
   *
   * The outline is read as a simple polygon closing from its last point back to
   * its first, in either winding. When the absolute doubled signed area is at
   * most {@link ObservationGeometry.Epsilon}, including a sufficiently small
   * nonzero area, the vertex mean is returned instead. An empty outline answers
   * `NaN` coordinates.
   */
  export function outlineCentroid(outline: readonly IAutoMoviePlanarPoint[]): IAutoMoviePlanarPoint {
    return outlineCentroidImplementation(outline);
  }

  /**
   * A conservative straight polygon enclosing a possibly arced outline.
   *
   * An outward arc of at most a half turn is bounded by its chord-and-sagitta
   * rectangle. An inward arc retains its chord, because an inset rectangle
   * removes more of the void than the arc removes. Signed chord-ring area
   * determines winding; zero-area rings retain rectangle expansion, including
   * two-arc circles. A tilted rectangle may overstate profile-axis extents,
   * making containment and separation conservative.
   *
   * Bulge magnitude is tan(theta / 4), so sagitta is half the chord times bulge;
   * positive bulges lean left. Building validation admits magnitudes at most one
   * and distinct consecutive corners. The profile-frame result borrows original
   * corners and inserts two far corners only for expanded arcs. It may remain
   * non-convex, and simple-hull admission does not separately prove circular-arc
   * simplicity.
   *
   * @param profile Opening outline and optional per-edge bulges.
   * @returns The bounding straight ring, in outline order.
   */
  export function outlineHull(profile: IAutoMovieOpeningProfile): IAutoMoviePlanarPoint[] {
    return outlineHullImplementation(profile);
  }

  /**
   * Which side of the directed line `from -> to` a point falls on: `1` left, `-1`
   * right, `0` on the line.
   *
   * The sign is the 2D cross product `(to - from) x (point - from)` with x right
   * and y up. It counts as zero when its magnitude is at most `PLANAR_EPSILON`
   * (1e-12) times the larger of 1 and the Manhattan lengths of `to - from` and
   * `point - from`, so the tolerance grows with the size of the figure and never
   * falls below the absolute floor. A degenerate line, `from` equal to `to`, puts
   * every point on it.
   *
   * @param from Start of the directed line, in the caller's planar frame.
   * @param to End of the directed line, in the same frame.
   * @param point Point to classify, in the same frame.
   * @returns `1`, `-1` or `0` as described above.
   */
  export function planarSide(from: IAutoMoviePlanarPoint, to: IAutoMoviePlanarPoint, point: IAutoMoviePlanarPoint): -1 | 0 | 1 {
    return planarSideImplementation(from, to, point);
  }

  /**
   * Whether a point is inside a simple polygon, its own boundary included.
   *
   * {@link polygonInside}, {@link polygonsOverlap} and footprint-ring placement
   * share this answer. A point on an edge or vertex counts as inside under
   * {@link pointOnSegment}'s scale-relative `PLANAR_EPSILON` tolerance. The
   * polygon is an implicitly closed simple ring in either winding; an empty ring
   * contains nothing. Self-crossing rings are outside the geometric contract even
   * though the loop still evaluates parity.
   *
   * @param point Point to classify, in the polygon's planar frame.
   * @param polygon Closed ring of corners, the last joined back to the first.
   * @returns True when the point is inside or on the boundary.
   */
  export function pointInPolygon(point: IAutoMoviePlanarPoint, polygon: readonly IAutoMoviePlanarPoint[]): boolean {
    return pointInPolygonImplementation(point, polygon);
  }

  /**
   * Whether a point lies on a closed segment, its endpoints included.
   *
   * The point must be collinear by {@link planarSide} and inside the segment's
   * axis-aligned box widened by `PLANAR_EPSILON` (1e-12) on every side. A
   * zero-length segment therefore contains exactly the points within that slack
   * of its one position.
   *
   * @param point Point to test, in the caller's planar frame.
   * @param from One endpoint of the segment, in the same frame.
   * @param to The other endpoint, in the same frame.
   * @returns True when the point is on the segment within the stated tolerance.
   */
  export function pointOnSegment(point: IAutoMoviePlanarPoint, from: IAutoMoviePlanarPoint, to: IAutoMoviePlanarPoint): boolean {
    return pointOnSegmentImplementation(point, from, to);
  }

  /**
   * The axis-aligned bounds of a polygon in its own planar frame.
   *
   * Returns componentwise extrema in polygon units as new caller-owned corners. A
   * meaningful finite box requires non-empty finite input. Empty input retains
   * `Infinity` minima and `-Infinity` maxima, and comparisons skip `NaN`
   * coordinates; this function does not validate either premise.
   *
   * @param polygon Points of the ring, in any order.
   * @returns The lower and upper corners of the bounding box.
   */
  export function polygonBounds(polygon: readonly IAutoMoviePlanarPoint[]): IAutoMoviePolygonBounds.IResult {
    return polygonBoundsImplementation(polygon);
  }

  /**
   * Twice the signed area of a closed polygon, positive when counter-clockwise.
   *
   * The ring closes from last to first in its planar frame; units are squared
   * polygon units and counter-clockwise uses x right, y up. Empty input returns
   * zero. Self-crossings contribute their net wound area. The calculation
   * subtracts the first corner from each point to reduce cancellation from large
   * offsets.
   *
   * @param polygon Closed ring of corners, the last joined back to the first.
   * @returns The shoelace sum, twice the signed enclosed area.
   */
  export function polygonDoubleArea(polygon: readonly IAutoMoviePlanarPoint[]): number {
    return polygonDoubleAreaImplementation(polygon);
  }

  /**
   * Whether an inner polygon stays within an outer one, flush edges allowed.
   *
   * Boundary contact is allowed, so a void whose sill lies exactly on the wall's
   * own bottom edge is contained, while a void whose corner pokes through the
   * wall's side is not. Every inner corner must be inside or on the outer ring by
   * {@link pointInPolygon}, and no inner edge may properly cross an outer edge by
   * {@link segmentsCross} or leave through its vertices.
   *
   * Both polygons are closed rings in one planar frame and are assumed simple.
   * Outer vertices on an inner edge split it into intervals. Testing each
   * interval's midpoint also detects exits through vertices of a concave outer
   * ring, where neither boundary properly crosses the other.
   *
   * @param inner Ring that must stay inside, such as an opening's void hull.
   * @param outer Ring that must contain it, such as the host face outline.
   * @returns True when `inner` stays within `outer` by the rule above.
   */
  export function polygonInside(inner: readonly IAutoMoviePlanarPoint[], outer: readonly IAutoMoviePlanarPoint[]): boolean {
    return polygonInsideImplementation(inner, outer);
  }

  /**
   * Whether no two non-adjacent edges of a closed ring touch.
   *
   * Building outlines require a simple boundary, rather than selecting a fill
   * rule for self-crossings. Adjacent edges are skipped because their shared
   * corner is expected; consequently this function does not detect adjacent
   * backtracking or overlapping adjacent segments.
   *
   * Contact uses {@link segmentsTouch}'s scale-relative `PLANAR_EPSILON`; a vertex
   * on a non-adjacent edge counts as touching. Point count, adjacent degeneracy
   * and area are separate caller checks: even a two- or three-point ring returns
   * true here if no non-adjacent pair exists.
   *
   * @param polygon Closed ring of corners, the last joined back to the first.
   * @returns True when no two non-adjacent edges share a point.
   */
  export function polygonIsSimple(polygon: readonly IAutoMoviePlanarPoint[]): boolean {
    return polygonIsSimpleImplementation(polygon);
  }

  /**
   * The shortest edge length of a closed polygon.
   *
   * Includes the closing edge and measures Euclidean length in polygon units. An
   * empty ring returns `Infinity`; repeated consecutive finite corners and a
   * one-point ring return zero. Coordinate subtraction or a non-representable
   * final length can still overflow despite `Math.hypot`'s scaled evaluation.
   *
   * @param polygon Closed ring of corners, the last joined back to the first.
   * @returns The minimum edge length, or `Infinity` for an empty ring.
   */
  export function polygonShortestEdge(polygon: readonly IAutoMoviePlanarPoint[]): number {
    return polygonShortestEdgeImplementation(polygon);
  }

  /**
   * Whether two polygons share any point at all, contact included.
   *
   * Contact counts so opening validation can refuse voids meeting along a jamb.
   *
   * Requires non-empty simple rings in one planar frame and inherits the binary64
   * and scale-relative `PLANAR_EPSILON` behavior of {@link segmentsTouch} and
   * {@link pointInPolygon}. An edge contact or containment of one corner returns
   * true. Paired with a non-empty ring, an empty ring can throw a `TypeError`
   * when its missing corner reaches the containment predicate.
   *
   * @param left One closed ring.
   * @param right The other closed ring, in the same frame.
   * @returns True when the closed regions share any point.
   */
  export function polygonsOverlap(left: readonly IAutoMoviePlanarPoint[], right: readonly IAutoMoviePlanarPoint[]): boolean {
    return polygonsOverlapImplementation(left, right);
  }

  /**
   * Whether segments `a-b` and `c-d` cross at a point interior to both.
   *
   * Each segment's endpoints must lie strictly on opposite sides of the other's
   * line by {@link planarSide}. Any endpoint on the other line within tolerance,
   * so a touch at an endpoint, a T-junction or a collinear overlap, is not a
   * crossing; {@link segmentsTouch} answers those.
   *
   * @param a First endpoint of the first segment, in the caller's planar frame.
   * @param b Second endpoint of the first segment.
   * @param c First endpoint of the second segment.
   * @param d Second endpoint of the second segment.
   * @returns True only for a proper crossing.
   */
  export function segmentsCross(a: IAutoMoviePlanarPoint, b: IAutoMoviePlanarPoint, c: IAutoMoviePlanarPoint, d: IAutoMoviePlanarPoint): boolean {
    return segmentsCrossImplementation(a, b, c, d);
  }

  /**
   * Whether segments `a-b` and `c-d` share any point, endpoints and collinear
   * overlap included.
   *
   * True for a proper crossing by {@link segmentsCross}, or when any endpoint of
   * one segment lies on the other by {@link pointOnSegment}. Those cases are
   * exhaustive: two closed segments that meet without properly crossing must meet
   * at an endpoint of one of them.
   *
   * @param a First endpoint of the first segment, in the caller's planar frame.
   * @param b Second endpoint of the first segment.
   * @param c First endpoint of the second segment.
   * @param d Second endpoint of the second segment.
   * @returns True when the closed segments share a point within tolerance.
   */
  export function segmentsTouch(a: IAutoMoviePlanarPoint, b: IAutoMoviePlanarPoint, c: IAutoMoviePlanarPoint, d: IAutoMoviePlanarPoint): boolean {
    return segmentsTouchImplementation(a, b, c, d);
  }
}
