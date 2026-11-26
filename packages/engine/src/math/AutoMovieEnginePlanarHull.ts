import { walkSortedPlanarHull } from "./internal/walkSortedPlanarHull";

/** Deterministic convex envelopes over two coordinate fields of point data. */
export namespace AutoMovieEnginePlanarHull {
  /**
   * Walk the counter-clockwise boundary of a projected point set. Sorting uses
   * the first coordinate then the second. Straight runs retain their endpoints
   * and the chosen records keep all of their original fields and identities.
   * Coordinates must be finite. Callers admit duplicates and choose
   * tolerances.
   *
   * @param points Points in the same coordinate frame and unit.
   * @param x First planar coordinate key.
   * @param y Second planar coordinate key.
   * @returns The ordered boundary with no closing copy of the first vertex.
   */
  export function vertices<
    X extends string | number,
    Y extends string | number,
    Point extends Readonly<Record<X | Y, number>>,
  >(points: readonly Point[], x: X, y: Y): Point[] {
    if (points.length < 2) return [...points];
    const sorted: Point[] = [...points].sort(
      (a: Point, b: Point): number => a[x] - b[x] || a[y] - b[y],
    );
    return walkSortedPlanarHull(sorted, x, y);
  }

  /**
   * Measure the closed perimeter of the projected convex envelope in the input
   * unit. A segment contributes twice its length.
   *
   * @param points Unordered points in the same frame and unit.
   * @param x First planar coordinate key.
   * @param y Second planar coordinate key.
   * @returns The hull perimeter, zero for an empty or single-point input.
   */
  export function perimeter<
    X extends string | number,
    Y extends string | number,
    Point extends Readonly<Record<X | Y, number>>,
  >(points: readonly Point[], x: X, y: Y): number {
    return boundaryLength(vertices(points, x, y), x, y);
  }

  /**
   * Measure a previously selected boundary in its given traversal order. The
   * last vertex joins the first. An empty outline or a single point has zero
   * length.
   *
   * @param points Ordered finite vertices with coordinates in the same unit.
   * @param x First planar coordinate key.
   * @param y Second planar coordinate key.
   * @returns The closed boundary length in the common coordinate unit.
   */
  export function boundaryLength<
    X extends string | number,
    Y extends string | number,
    Point extends Readonly<Record<X | Y, number>>,
  >(points: readonly Point[], x: X, y: Y): number {
    if (points.length < 2) return 0;
    let sum: number = 0;
    for (let index: number = 0; index < points.length; ++index) {
      const a: Point = points[index]!;
      const b: Point = points[(index + 1) % points.length]!;
      sum += Math.hypot(b[x] - a[x], b[y] - a[y]);
    }
    return sum;
  }
}
