import type {
  AutoMovieVector2Tuple,
  IAutoMovieFontGlyph,
  IAutoMovieFontSegment,
  IAutoMoviePlanarRegion,
  IAutoMovieProfilePoint,
} from "@automovie/interface";

import { flattenAutoMovieQuadratic } from "./flattenAutoMovieQuadratic";

/**
 * Flatten a glyph's contours into rings in metres about its origin and group
 * them into regions, each an outer ring with the holes directly inside it.
 *
 * Each segment is scaled to metres, then flattened by
 * {@link flattenAutoMovieQuadratic} within `tolerance`; consecutive equal points
 * are merged. Rings are grouped by containment, not by winding, because fonts
 * disagree on winding and a composite may mirror a component: a ring inside an
 * even number of other rings bounds ink, and one inside an odd number is a hole
 * of the innermost ring around it. Two rings that touch or cross make
 * containment meaningless and are refused before grouping, naming the glyph,
 * since the triangulator refuses such rings rather than repairing them. A ring
 * crossing itself is left for the triangulator, which refuses it.
 *
 * Cost is quadratic in the glyph's flattened edges, for the crossing test; a
 * caller lays each distinct code point out once and translates it.
 *
 * @param glyph The decoded glyph, font units.
 * @param scale Metres per font unit.
 * @param tolerance Largest chord error, metres.
 * @returns Regions in the glyph's frame, metres, `+y` up from the baseline;
 *   empty for a glyph with no outline.
 * @throws {Error} Two of the glyph's contours touch or cross, or a contour
 *   flattens to fewer than three points; the message names the code point.
 */
export function regionsOfAutoMovieGlyph(
  glyph: IAutoMovieFontGlyph,
  scale: number,
  tolerance: number,
): IAutoMoviePlanarRegion[] {
  const label: string = `U+${glyph.codePoint.toString(16).toUpperCase().padStart(4, "0")} "${String.fromCodePoint(glyph.codePoint)}"`;
  const rings: AutoMovieVector2Tuple[][] = glyph.contours.map(
    (contour: IAutoMovieFontSegment[]): AutoMovieVector2Tuple[] => {
      const ring: AutoMovieVector2Tuple[] = [];
      for (const segment of contour) {
        const points: AutoMovieVector2Tuple[] = flattenAutoMovieQuadratic(
          [segment.start[0] * scale, segment.start[1] * scale],
          [segment.control[0] * scale, segment.control[1] * scale],
          [segment.end[0] * scale, segment.end[1] * scale],
          tolerance,
        );
        // The end is the next segment's start; closure is implicit.
        for (const point of points.slice(0, -1)) {
          const last: AutoMovieVector2Tuple | undefined = ring[ring.length - 1];
          if (
            last === undefined ||
            last[0] !== point[0] ||
            last[1] !== point[1]
          )
            ring.push(point);
        }
      }
      const head: AutoMovieVector2Tuple | undefined = ring[0];
      const tail: AutoMovieVector2Tuple | undefined = ring[ring.length - 1];
      if (ring.length > 1 && head![0] === tail![0] && head![1] === tail![1])
        ring.pop();
      if (ring.length < 3)
        throw new Error(
          `Glyph ${label} has a contour that flattens to fewer than three points`,
        );
      return ring;
    },
  );

  for (let a: number = 0; a < rings.length; ++a)
    for (let b: number = a + 1; b < rings.length; ++b)
      if (ringsMeet(rings[a]!, rings[b]!))
        throw new Error(
          `Glyph ${label} has contours that touch or cross; the triangulator refuses them rather than repairing them`,
        );

  // Nesting depth by containment of each ring's first point.
  const depth: number[] = rings.map(
    (ring: AutoMovieVector2Tuple[], index: number): number =>
      rings.filter(
        (other: AutoMovieVector2Tuple[], at: number): boolean =>
          at !== index && inside(ring[0]!, other),
      ).length,
  );
  const regions: Map<
    number,
    { outer: IAutoMovieProfilePoint[]; holes: IAutoMovieProfilePoint[][] }
  > = new Map();
  const points: (ring: AutoMovieVector2Tuple[]) => IAutoMovieProfilePoint[] = (
    ring: AutoMovieVector2Tuple[],
  ): IAutoMovieProfilePoint[] =>
    ring.map(
      ([x, y]: AutoMovieVector2Tuple): IAutoMovieProfilePoint => ({ x, y }),
    );
  rings.forEach((ring: AutoMovieVector2Tuple[], index: number): void => {
    if (depth[index]! % 2 === 0)
      regions.set(index, { outer: points(ring), holes: [] });
  });
  rings.forEach((ring: AutoMovieVector2Tuple[], index: number): void => {
    if (depth[index]! % 2 === 0) return;
    const parent: number = rings.findIndex(
      (other: AutoMovieVector2Tuple[], at: number): boolean =>
        depth[at] === depth[index]! - 1 && inside(ring[0]!, other),
    );
    regions.get(parent)!.holes.push(points(ring));
  });
  return [...regions.values()];
}

/** Whether any edge of one ring touches or crosses any edge of the other. */
function ringsMeet(
  a: readonly AutoMovieVector2Tuple[],
  b: readonly AutoMovieVector2Tuple[],
): boolean {
  for (let i: number = 0; i < a.length; ++i) {
    const p: AutoMovieVector2Tuple = a[i]!;
    const q: AutoMovieVector2Tuple = a[(i + 1) % a.length]!;
    for (let j: number = 0; j < b.length; ++j)
      if (segmentsMeet(p, q, b[j]!, b[(j + 1) % b.length]!)) return true;
  }
  return false;
}

/** Whether two closed segments share any point, by orientation signs. */
function segmentsMeet(
  p1: AutoMovieVector2Tuple,
  p2: AutoMovieVector2Tuple,
  q1: AutoMovieVector2Tuple,
  q2: AutoMovieVector2Tuple,
): boolean {
  const o1: number = orient(p1, p2, q1);
  const o2: number = orient(p1, p2, q2);
  const o3: number = orient(q1, q2, p1);
  const o4: number = orient(q1, q2, p2);
  if (o1 * o2 < 0 && o3 * o4 < 0) return true;
  return (
    (o1 === 0 && within(p1, p2, q1)) ||
    (o2 === 0 && within(p1, p2, q2)) ||
    (o3 === 0 && within(q1, q2, p1)) ||
    (o4 === 0 && within(q1, q2, p2))
  );
}

/** Sign of the turn from `a` to `b` to `c`. */
function orient(
  a: AutoMovieVector2Tuple,
  b: AutoMovieVector2Tuple,
  c: AutoMovieVector2Tuple,
): number {
  return Math.sign(
    (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]),
  );
}

/**
 * Whether `c`, collinear with `a` and `b`, lies on the closed segment between
 * them.
 */
function within(
  a: AutoMovieVector2Tuple,
  b: AutoMovieVector2Tuple,
  c: AutoMovieVector2Tuple,
): boolean {
  return (
    Math.min(a[0], b[0]) <= c[0] &&
    c[0] <= Math.max(a[0], b[0]) &&
    Math.min(a[1], b[1]) <= c[1] &&
    c[1] <= Math.max(a[1], b[1])
  );
}

/** Even-odd ray test of a point against a ring. */
function inside(
  point: AutoMovieVector2Tuple,
  ring: readonly AutoMovieVector2Tuple[],
): boolean {
  let crossings: boolean = false;
  for (
    let i: number = 0, j: number = ring.length - 1;
    i < ring.length;
    j = i++
  ) {
    const a: AutoMovieVector2Tuple = ring[i]!;
    const b: AutoMovieVector2Tuple = ring[j]!;
    if (
      a[1] > point[1] !== b[1] > point[1] &&
      point[0] < ((b[0] - a[0]) * (point[1] - a[1])) / (b[1] - a[1]) + a[0]
    )
      crossings = !crossings;
  }
  return crossings;
}
