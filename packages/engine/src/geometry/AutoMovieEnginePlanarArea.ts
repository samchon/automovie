import type {
  AutoMovieVector2Tuple,
  IAutoMoviePlanarPoint,
} from "@automovie/interface";

/** Measure the oriented area of a closed ring in its own XY plane. */
export namespace AutoMovieEnginePlanarArea {
  /**
   * Measure a ring in square metres. The last corner joins the first.
   *
   * Counter-clockwise rings are positive. Self-crossings contribute their net
   * wound area. Fewer than three corners give zero. Inputs are finite points in
   * a single frame. The calculation reads them without modifying them.
   * Arithmetic uses binary64 and may overflow for extreme spans or areas.
   *
   * @param points Ring corners in metres, in winding order.
   * @returns The signed enclosed area in square metres.
   */
  export function measure(points: readonly IAutoMoviePlanarPoint[]): number {
    return measureDoubled(points) / 2;
  }

  /**
   * Measure twice the signed area of a ring in square metres. Ring closure,
   * winding and degeneracy follow {@link measure}.
   *
   * @param points Ring corners in metres, in winding order.
   * @returns Twice the signed enclosed area in square metres.
   */
  export function measureDoubled(
    points: readonly IAutoMoviePlanarPoint[],
  ): number {
    return sumDoubledArea(points, "x", "y");
  }

  /**
   * Measure a ring of finite XY tuples in a common frame and unit. Ring
   * closure, winding and degeneracy follow {@link measure}.
   *
   * @param points Ring corners in winding order.
   * @returns The signed enclosed area in squared input units.
   */
  export function measureTuples(
    points: readonly Readonly<AutoMovieVector2Tuple>[],
  ): number {
    return sumDoubledArea(points, 0, 1) / 2;
  }
}

/*
 * Sum consecutive cross products relative to the ring's first corner.
 */
function sumDoubledArea<
  X extends string | number,
  Y extends string | number,
  Point extends Readonly<Record<X | Y, number>>,
>(points: readonly Point[], x: X, y: Y): number {
  if (points.length < 3) return 0;

  const origin: Point = points[0]!;
  const centered: number = sumCrossProducts(points, x, y, origin[x], origin[y]);
  if (Number.isFinite(centered)) return centered;

  // A span across opposite extremes can overflow a translated coordinate
  // even when the original edge products are finite.
  return sumCrossProducts(points, x, y, 0, 0);
}

/*
 * Sum a closed ring's cross products in the given translated XY frame.
 */
function sumCrossProducts<
  X extends string | number,
  Y extends string | number,
  Point extends Readonly<Record<X | Y, number>>,
>(
  points: readonly Point[],
  x: X,
  y: Y,
  originX: number,
  originY: number,
): number {
  const firstX: number = points[0]![x] - originX;
  const firstY: number = points[0]![y] - originY;
  let fromX: number = firstX;
  let fromY: number = firstY;
  let total: number = 0;
  for (let index: number = 1; index < points.length; ++index) {
    const point: Point = points[index]!;
    const toX: number = point[x] - originX;
    const toY: number = point[y] - originY;
    total += fromX * toY - toX * fromY;
    fromX = toX;
    fromY = toY;
  }
  return total + (fromX * firstY - firstX * fromY);
}
