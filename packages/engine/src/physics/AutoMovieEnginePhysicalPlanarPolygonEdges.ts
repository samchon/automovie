// Ported from IHMC Robotics, Euclid (Apache-2.0):
// src/geometry/java/us/ihmc/euclid/geometry/tools/EuclidGeometryPolygonTools.java
// (lineOfSightStartIndex, lineOfSightEndIndex, canObserverSeeEdge and
// orthogonal projection).
import type { AutoMovieEnginePhysicalPlanarPolygon } from "./AutoMovieEnginePhysicalPlanarPolygon";

/**
 * The edge geometry convex planar polygons are read with
 * (`AutoMovieEnginePhysicalPlanarPolygon`): cross products, the outer side of an edge, the
 * edges a point can see, and points' distances to segments and boundaries.
 * @see https://github.com/ihmcrobotics/euclid/blob/0.11.0/src/geometry/java/us/ihmc/euclid/geometry/tools/EuclidGeometryPolygonTools.java
 */
export namespace AutoMovieEnginePhysicalPlanarPolygonEdges {
  /** The z-component of (a - o) x (b - o). */
  export function cross(
    o: AutoMovieEnginePhysicalPlanarPolygon.IPoint,
    a: AutoMovieEnginePhysicalPlanarPolygon.IPoint,
    b: AutoMovieEnginePhysicalPlanarPolygon.IPoint,
  ): number {
    return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  }

  /**
   * Whether a point is strictly on the outer side of a clockwise polygon's edge a
   * -> b, its left (Euclid `canObserverSeeEdge`, `isPoint2DOnSideOfLine2D`).
   */
  export function outer(
    a: AutoMovieEnginePhysicalPlanarPolygon.IPoint,
    b: AutoMovieEnginePhysicalPlanarPolygon.IPoint,
    point: AutoMovieEnginePhysicalPlanarPolygon.IPoint,
  ): boolean {
    return cross(a, b, point) > 0;
  }

  /**
   * The indices of a clockwise polygon's line-of-sight start and end vertices
   * from an observer (Euclid `lineOfSightStartIndex`, `lineOfSightEndIndex`): the
   * start begins the first visible edge after an invisible one, the end begins
   * the first invisible edge after a visible one; undefined when the observer
   * sees no edge.
   */
  export function lineOfSight(
    polygon: readonly AutoMovieEnginePhysicalPlanarPolygon.IPoint[],
    observer: AutoMovieEnginePhysicalPlanarPolygon.IPoint,
  ): { start: number; end: number } | undefined {
    const n: number = polygon.length;
    if (n === 0) return undefined;
    if (n === 1)
      return polygon[0]!.x === observer.x && polygon[0]!.y === observer.y
        ? undefined
        : { start: 0, end: 0 };
    if (n === 2) {
      if (segmentDistance(polygon, observer) <= 0) return undefined;
      const onSide: boolean = outer(polygon[0]!, polygon[1]!, observer);
      return onSide ? { start: 0, end: 1 } : { start: 1, end: 0 };
    }
    const sees = (edge: number): boolean =>
      outer(polygon[edge]!, polygon[(edge + 1) % n]!, observer);
    let start: number = -1;
    let end: number = -1;
    let previous: boolean = sees(n - 1);
    for (let edge: number = 0; edge < n; edge++) {
      const now: boolean = sees(edge);
      if (!previous && now && start < 0) start = edge;
      if (previous && !now && end < 0) end = edge;
      previous = now;
    }
    return start >= 0 && end >= 0 ? { start, end } : undefined;
  }

  /** The distance from a point to a polygon of one or two vertices, metres. */
  export function segmentDistance(
    polygon: readonly AutoMovieEnginePhysicalPlanarPolygon.IPoint[],
    point: AutoMovieEnginePhysicalPlanarPolygon.IPoint,
  ): number {
    return polygon.length === 1
      ? Math.hypot(point.x - polygon[0]!.x, point.y - polygon[0]!.y)
      : nearestOnSegment(polygon[0]!, polygon[1]!, point).distance;
  }

  /** The nearest boundary point of a polygon to a point, and its distance. */
  export function boundary(
    polygon: readonly AutoMovieEnginePhysicalPlanarPolygon.IPoint[],
    point: AutoMovieEnginePhysicalPlanarPolygon.IPoint,
  ): { nearest: AutoMovieEnginePhysicalPlanarPolygon.IPoint; distance: number } {
    if (polygon.length === 1)
      return {
        nearest: { ...polygon[0]! },
        distance: Math.hypot(point.x - polygon[0]!.x, point.y - polygon[0]!.y),
      };
    let best: { nearest: AutoMovieEnginePhysicalPlanarPolygon.IPoint; distance: number } = {
      nearest: { ...point },
      distance: Infinity,
    };
    const edges: number = polygon.length === 2 ? 1 : polygon.length;
    for (let i: number = 0; i < edges; i++) {
      const candidate = nearestOnSegment(
        polygon[i]!,
        polygon[(i + 1) % polygon.length]!,
        point,
      );
      if (candidate.distance < best.distance) best = candidate;
    }
    return best;
  }

  /** The nearest point of segment a b to a point, and its distance. */
  export function nearestOnSegment(
    a: AutoMovieEnginePhysicalPlanarPolygon.IPoint,
    b: AutoMovieEnginePhysicalPlanarPolygon.IPoint,
    point: AutoMovieEnginePhysicalPlanarPolygon.IPoint,
  ): { nearest: AutoMovieEnginePhysicalPlanarPolygon.IPoint; distance: number } {
    const dx: number = b.x - a.x;
    const dy: number = b.y - a.y;
    const length2: number = dx * dx + dy * dy;
    const t: number =
      length2 > 0
        ? Math.max(
            0,
            Math.min(
              1,
              ((point.x - a.x) * dx + (point.y - a.y) * dy) / length2,
            ),
          )
        : 0;
    const nearest: AutoMovieEnginePhysicalPlanarPolygon.IPoint = {
      x: a.x + dx * t,
      y: a.y + dy * t,
    };
    return {
      nearest,
      distance: Math.hypot(point.x - nearest.x, point.y - nearest.y),
    };
  }
}
