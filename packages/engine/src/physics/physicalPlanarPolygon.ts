// Ported from IHMC Robotics, Euclid (Apache-2.0):
// src/geometry/java/us/ihmc/euclid/geometry/tools/EuclidGeometryPolygonTools.java
// (computeConvexPolygon2DArea, lineOfSightStartIndex, lineOfSightEndIndex,
// canObserverSeeEdge, isPoint2DInsideConvexPolygon2D, signed distance and
// orthogonal projection), and ConvexPolygon2D.scale.
// See vendor/ihmc/NOTICE.
import { walkSortedPlanarHull } from "../math/internal/walkSortedPlanarHull";
import { physicalPlanarPolygonEdges as Edges } from "./physicalPlanarPolygonEdges";

/**
 * Convex polygons in a horizontal frame of their own, with the semantics of
 * IHMC's Euclid `ConvexPolygon2D`, which the ported balance modules read
 * (`physicalOneStepCaptureRegion`, `physicalFootstepAdjustor`): vertices
 * clockwise, an empty polygon's area zero and centroid not a number, a polygon
 * of one or two vertices of area zero with its vertices' mean as centroid, and
 * a point on an edge inside.
 *
 * Points are `{ x, y }` in a right-handed frame with z up, as IHMC's sole and
 * mid-feet frames: x forward, y to the left. A world point maps into it by
 * `local` and back by `world`, the frame given by an origin and a forward
 * direction on the floor of the engine's y-up world, left being up x forward.
 */
export namespace physicalPlanarPolygon {
  /** A point of the frame, metres. */
  export interface IPoint {
    /** Forward. */
    x: number;

    /** To the left. */
    y: number;
  }

  /** A frame on the floor: its origin and forward unit direction, world x and z. */
  export interface IFrame {
    /** The origin's world x and z. */
    origin: { x: number; z: number };

    /** The forward direction's world x and z, unit length. */
    forward: { x: number; z: number };
  }

  /**
   * A world floor point in the frame: x along forward, y along left = up x
   * forward = (forward.z, -forward.x) in world x and z.
   *
   * @param frame The frame.
   * @param point The world point; its y is ignored.
   * @returns The point in the frame.
   */
  export function local(
    frame: IFrame,
    point: { x: number; z: number },
  ): IPoint {
    const dx: number = point.x - frame.origin.x;
    const dz: number = point.z - frame.origin.z;
    return {
      x: dx * frame.forward.x + dz * frame.forward.z,
      y: dx * frame.forward.z - dz * frame.forward.x,
    };
  }

  /**
   * A frame point on the world floor, the inverse of `local`.
   *
   * @param frame The frame.
   * @param point The point in the frame.
   * @returns The world x and z.
   */
  export function world(
    frame: IFrame,
    point: IPoint,
  ): { x: number; z: number } {
    return {
      x: frame.origin.x + point.x * frame.forward.x + point.y * frame.forward.z,
      z: frame.origin.z + point.x * frame.forward.z - point.y * frame.forward.x,
    };
  }

  /**
   * The clockwise convex hull of points, duplicates within `EPSILON` and
   * collinear vertices removed (Euclid's gift wrapping keeps the same vertices;
   * Andrew's monotone chain finds them here).
   *
   * @param points The points.
   * @returns The hull's vertices, clockwise; one or two vertices for a point or
   *   a segment.
   */
  export function hull(points: readonly IPoint[]): IPoint[] {
    const sorted: IPoint[] = [...points].sort(
      (a: IPoint, b: IPoint): number => a.x - b.x || a.y - b.y,
    );
    const unique: IPoint[] = [];
    for (const p of sorted)
      if (
        !unique.some(
          (q: IPoint): boolean =>
            Math.abs(q.x - p.x) <= EPSILON && Math.abs(q.y - p.y) <= EPSILON,
        )
      )
        unique.push({ x: p.x, y: p.y });
    if (unique.length <= 2) return unique;

    // The monotone chain runs counter-clockwise; Euclid's polygons run
    // clockwise.
    const ccw: IPoint[] = walkSortedPlanarHull(unique, "x", "y");
    return ccw.length >= 3 ? ccw.reverse() : unique.slice(0, 2);
  }

  /**
   * The area, square metres: half the absolute shoelace sum (Euclid
   * `computeConvexPolygon2DArea`), zero for fewer than three vertices, the
   * empty sum included.
   *
   * @param polygon The clockwise polygon.
   * @returns The area.
   */
  export function area(polygon: readonly IPoint[]): number {
    if (polygon.length < 3) return 0;
    let sum: number = 0;
    for (let i: number = 0; i < polygon.length; i++) {
      const a: IPoint = polygon[i]!;
      const b: IPoint = polygon[(i + polygon.length - 1) % polygon.length]!;
      sum += a.x * b.y - b.x * a.y;
    }
    return Math.abs(sum) / 2;
  }

  /**
   * The area centroid: not a number for no vertex, the vertices' mean for one
   * or two (Euclid `computeConvexPolygon2DArea`).
   *
   * @param polygon The clockwise polygon.
   * @returns The centroid.
   */
  export function centroid(polygon: readonly IPoint[]): IPoint {
    if (polygon.length === 0) return { x: Number.NaN, y: Number.NaN };
    if (polygon.length < 3)
      return {
        x:
          polygon.reduce((s: number, p: IPoint): number => s + p.x, 0) /
          polygon.length,
        y:
          polygon.reduce((s: number, p: IPoint): number => s + p.y, 0) /
          polygon.length,
      };
    let sum: number = 0;
    let cx: number = 0;
    let cy: number = 0;
    for (let i: number = 0; i < polygon.length; i++) {
      const a: IPoint = polygon[i]!;
      const b: IPoint = polygon[(i + polygon.length - 1) % polygon.length]!;
      const weight: number = a.x * b.y - b.x * a.y;
      cx += (a.x + b.x) * weight;
      cy += (a.y + b.y) * weight;
      sum += weight;
    }
    return { x: cx / (3 * sum), y: cy / (3 * sum) };
  }

  /**
   * The vertices an observer outside sees, in the order IHMC's
   * `computeVisibleVerticesFromOutsideLeftToRightCopy` lists them: from the
   * line of sight's end vertex back through the previous vertices to its start
   * (Euclid `lineOfSightStartIndex`, `lineOfSightEndIndex`).
   *
   * @param polygon The clockwise polygon.
   * @param observer The observer.
   * @returns The visible vertices, or undefined when the observer is inside or
   *   on the polygon, or the polygon is empty.
   */
  export function visible(
    polygon: readonly IPoint[],
    observer: IPoint,
  ): IPoint[] | undefined {
    const sight: { start: number; end: number } | undefined = Edges.lineOfSight(
      polygon,
      observer,
    );
    if (!sight) return undefined;
    const out: IPoint[] = [];
    let index: number = sight.end;
    for (;;) {
      out.push({ ...polygon[index]! });
      index = (index + polygon.length - 1) % polygon.length;
      if (index === sight.start) {
        out.push({ ...polygon[index]! });
        return out;
      }
    }
  }

  /**
   * Whether a point lies inside a polygon or on its boundary (Euclid
   * `isPoint2DInsideConvexPolygon2D` with no epsilon): on the vertex for one
   * vertex, on the segment for two, else on no edge's outer side.
   *
   * @param polygon The clockwise polygon.
   * @param point The point.
   * @returns Whether it is inside.
   */
  export function inside(polygon: readonly IPoint[], point: IPoint): boolean {
    if (polygon.length === 0) return false;
    if (polygon.length < 3) return Edges.segmentDistance(polygon, point) <= 0;
    for (let i: number = 0; i < polygon.length; i++)
      if (Edges.outer(polygon[i]!, polygon[(i + 1) % polygon.length]!, point))
        return false;
    return true;
  }

  /**
   * The signed distance from a point to a polygon, metres: its distance to the
   * boundary, negative inside (Euclid `signedDistance`).
   *
   * @param polygon The clockwise polygon.
   * @param point The point.
   * @returns The signed distance; not a number for an empty polygon.
   */
  export function signedDistance(
    polygon: readonly IPoint[],
    point: IPoint,
  ): number {
    if (polygon.length === 0) return Number.NaN;
    if (polygon.length < 3) return Edges.segmentDistance(polygon, point);
    const distance: number = Edges.boundary(polygon, point).distance;
    return inside(polygon, point) ? -distance : distance;
  }

  /**
   * A point's orthogonal projection onto a polygon (Euclid
   * `orthogonalProjection`): itself when inside, else the nearest point of the
   * boundary.
   *
   * @param polygon The clockwise polygon, not empty.
   * @param point The point.
   * @returns The projection.
   */
  export function project(polygon: readonly IPoint[], point: IPoint): IPoint {
    if (polygon.length >= 3 && inside(polygon, point)) return { ...point };
    return Edges.boundary(polygon, point).nearest;
  }

  /**
   * The intersection of two convex polygons, by clipping the first with each of
   * the second's edges (Sutherland and Hodgman 1974), the same point set IHMC's
   * `ConvexPolygonTools.computeIntersectionOfPolygons` returns.
   *
   * @param first A clockwise polygon.
   * @param second A clockwise polygon.
   * @returns The intersection, clockwise; empty when they do not meet.
   */
  export function intersect(
    first: readonly IPoint[],
    second: readonly IPoint[],
  ): IPoint[] {
    if (first.length === 0 || second.length === 0) return [];
    if (second.length < 3)
      return hull(second.filter((p: IPoint): boolean => inside(first, p)));
    if (first.length < 3)
      return hull(first.filter((p: IPoint): boolean => inside(second, p)));
    let out: IPoint[] = [...first];
    for (let k: number = 0; k < second.length && out.length > 0; k++) {
      const a: IPoint = second[k]!;
      const b: IPoint = second[(k + 1) % second.length]!;

      // Inside a clockwise polygon is right of each edge: cross <= 0.
      const side = (p: IPoint): number => -Edges.cross(a, b, p);
      const kept: IPoint[] = [];
      out.forEach((p: IPoint, i: number): void => {
        const q: IPoint = out[(i + 1) % out.length]!;
        const sp: number = side(p);
        const sq: number = side(q);
        if (sp >= 0) kept.push({ ...p });
        if (sp >= 0 !== sq >= 0) {
          const t: number = sp / (sp - sq);
          kept.push({ x: p.x + (q.x - p.x) * t, y: p.y + (q.y - p.y) * t });
        }
      });
      out = hull(kept);
    }
    return out;
  }

  /**
   * A polygon scaled about a point (Euclid `ConvexPolygon2D.scale`): each
   * vertex moved to about + factor (vertex - about).
   *
   * @param polygon The polygon.
   * @param about The fixed point.
   * @param factor The scale.
   * @returns The scaled polygon, in the same order.
   */
  export function scale(
    polygon: readonly IPoint[],
    about: IPoint,
    factor: number,
  ): IPoint[] {
    return polygon.map(
      (p: IPoint): IPoint => ({
        x: about.x + factor * (p.x - about.x),
        y: about.y + factor * (p.y - about.y),
      }),
    );
  }

  /**
   * A polygon shrunk inward by a distance (IHMC `ConvexPolygonScaler`
   * `.scaleConvexPolygon` l.75-190, ihmc-robotics-toolkit): every edge's line
   * moved in by the distance and the region inside all of them kept, which is
   * the polygon clipped by the moved lines; a polygon too small for it
   * collapses to its area centroid. A segment shortens by the distance at each
   * end, collapsing to its middle when shorter than twice it; a point stays. A
   * distance within 1e-10 of zero leaves the polygon as it is.
   *
   * @param polygon The clockwise polygon.
   * @param distance The inward distance, metres, not negative.
   * @returns The shrunk polygon, clockwise.
   */
  export function shrink(
    polygon: readonly IPoint[],
    distance: number,
  ): IPoint[] {
    if (Math.abs(distance) < 1.0e-10 || polygon.length <= 1)
      return polygon.map((p: IPoint): IPoint => ({ ...p }));
    if (polygon.length === 2) {
      const a: IPoint = polygon[0]!;
      const b: IPoint = polygon[1]!;
      const length: number = Math.hypot(b.x - a.x, b.y - a.y);
      if (length < 2 * distance)
        return [{ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }];
      const t: number = distance / length;
      return [
        { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t },
        { x: a.x + (b.x - a.x) * (1 - t), y: a.y + (b.y - a.y) * (1 - t) },
      ];
    }
    let out: IPoint[] = [...polygon];
    for (let k: number = 0; k < polygon.length && out.length > 0; k++) {
      const a: IPoint = polygon[k]!;
      const b: IPoint = polygon[(k + 1) % polygon.length]!;
      const length: number = Math.hypot(b.x - a.x, b.y - a.y);

      // Inside a clockwise polygon is right of each edge; the moved line
      // keeps the points at least the distance to the right.
      const side = (p: IPoint): number =>
        -Edges.cross(a, b, p) / length - distance;
      const kept: IPoint[] = [];
      out.forEach((p: IPoint, i: number): void => {
        const q: IPoint = out[(i + 1) % out.length]!;
        const sp: number = side(p);
        const sq: number = side(q);
        if (sp >= 0) kept.push({ ...p });
        if (sp >= 0 !== sq >= 0) {
          const t: number = sp / (sp - sq);
          kept.push({ x: p.x + (q.x - p.x) * t, y: p.y + (q.y - p.y) * t });
        }
      });
      out = hull(kept);
    }
    return out.length > 0 ? out : [centroid(polygon)];
  }

  /**
   * The rows A p <= b that hold a point inside a polygon (IHMC
   * `PolygonWiggler.convertToInequalityConstraints` l.287-420): one per edge,
   * the edge's left unit normal, for three or more vertices; the line and its
   * two end caps for a segment, or the point's box when the segment is no
   * longer than twice `inside`; the point's four bounds for one vertex.
   *
   * @param polygon The clockwise polygon, not empty.
   * @param inside The distance a segment's caps keep inside, metres; the
   *   polygon rows keep none, as the reference passes zero for them.
   * @returns The rows, each `{ a: [ax, ay], b }`.
   */
  export function rows(
    polygon: readonly IPoint[],
    inside: number = 0,
  ): { a: [number, number]; b: number }[] {
    const point = (
      x: number,
      y: number,
    ): { a: [number, number]; b: number }[] => [
      { a: [1, 0], b: x },
      { a: [0, 1], b: y },
      { a: [-1, 0], b: -x },
      { a: [0, -1], b: -y },
    ];
    if (polygon.length === 1) return point(polygon[0]!.x, polygon[0]!.y);
    if (polygon.length === 2) {
      const first: IPoint = polygon[0]!;
      const second: IPoint = polygon[1]!;
      if (Math.hypot(second.x - first.x, second.y - first.y) <= 2 * inside)
        return point((first.x + second.x) / 2, (first.y + second.y) / 2);
      const vx: number = second.x - first.x;
      const vy: number = second.y - first.y;
      const line: number = first.y * vx - first.x * vy;
      return [
        { a: [-vy, vx], b: line },
        { a: [vy, -vx], b: -line },
        { a: [-vx, -vy], b: -inside - first.x * vx - first.y * vy },
        { a: [vx, vy], b: -inside + second.x * vx + second.y * vy },
      ];
    }
    return polygon.map(
      (first: IPoint, i: number): { a: [number, number]; b: number } => {
        const second: IPoint = polygon[(i + 1) % polygon.length]!;
        const norm: number = Math.hypot(second.x - first.x, second.y - first.y);
        const x: number = (second.x - first.x) / norm;
        const y: number = (second.y - first.y) / norm;
        return { a: [-y, x], b: first.y * x - first.x * y };
      },
    );
  }

  /** Euclid's polygon tolerance for coincident vertices, metres. */
  export const EPSILON: number = 1.0e-7;
}
