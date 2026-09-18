import { IAutoMovieProfilePoint } from "./IAutoMovieProfilePoint";
import { IAutoMovieRegionRing } from "./IAutoMovieRegionRing";
import { IAutoMovieRegionTriangulation } from "./IAutoMovieRegionTriangulation";
import { PLANAR_EPSILON } from "./PLANAR_EPSILON";

/** The triangles one already-validated region resolves to.
 * @evidence requirements/asset-authoring/geometry.md#asset-composable-geometry-operations Triangulates an already admitted region for real cap geometry.
 * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-operations-topology Uses the canonical region identities for the cap indices consumed by extrusion and loft.
 */
export const trianglesOf = (
  region: Pick<IAutoMovieRegionTriangulation, "points" | "rings">,
): number[] => earClip(region.points, bridgeHoles(region.points, region.rings));

/** Twice the signed area of the triangle `origin -> from -> to`. */
const cross2 = (
  origin: IAutoMovieProfilePoint,
  from: IAutoMovieProfilePoint,
  to: IAutoMovieProfilePoint,
): number =>
  (from.x - origin.x) * (to.y - origin.y) -
  (from.y - origin.y) * (to.x - origin.x);

/**
 * Do two segments share any point at all, touching included?
 *
 * Touching counts because a region whose rings meet at one point is not two
 * regions with a shared corner; it is a surface pinched to a line, the same
 * shape [buildAutoMovieWall](./proceduralWall.ts) refuses when two openings meet at a corner.
 */
const segmentsMeet = (
  fromA: IAutoMovieProfilePoint,
  toA: IAutoMovieProfilePoint,
  fromB: IAutoMovieProfilePoint,
  toB: IAutoMovieProfilePoint,
): boolean => {
  if (
    straddles(cross2(fromB, toB, fromA), cross2(fromB, toB, toA)) &&
    straddles(cross2(fromA, toA, fromB), cross2(fromA, toA, toB))
  )
    return true;
  const contacts: ReadonlyArray<
    readonly [
      IAutoMovieProfilePoint,
      IAutoMovieProfilePoint,
      IAutoMovieProfilePoint,
    ]
  > = [
    [fromB, toB, fromA],
    [fromB, toB, toA],
    [fromA, toA, fromB],
    [fromA, toA, toB],
  ];
  return contacts.some(([from, to, point]) => {
    if (Math.abs(cross2(from, to, point)) > PLANAR_EPSILON) return false;
    const spanX = to.x - from.x;
    const spanY = to.y - from.y;
    const along =
      ((point.x - from.x) * spanX + (point.y - from.y) * spanY) /
      (spanX * spanX + spanY * spanY);
    return along >= -PLANAR_EPSILON && along <= 1 + PLANAR_EPSILON;
  });
};

/** Are two points on strictly opposite sides of the same line? */
const straddles = (left: number, right: number): boolean =>
  Math.abs(left) > PLANAR_EPSILON &&
  Math.abs(right) > PLANAR_EPSILON &&
  left * right < 0;

/** Even-odd ray cast along +X; the caller guarantees the point is off-ring. */
const pointInRing = (
  point: IAutoMovieProfilePoint,
  ring: readonly IAutoMovieProfilePoint[],
): boolean => {
  let inside = false;
  for (let index = 0; index < ring.length; ++index) {
    const from = ring[index]!;
    const to = ring[(index + 1) % ring.length]!;
    if (
      from.y > point.y !== to.y > point.y &&
      point.x <
        from.x + ((point.y - from.y) / (to.y - from.y)) * (to.x - from.x)
    )
      inside = !inside;
  }
  return inside;
};

/**
 * Fold every hole into the outer ring along a bridge nothing else crosses.
 *
 * The bridge is a segment travelled in both directions, so the region becomes
 * one ring an ear clipper can consume while the void stays a void: the two
 * traversals meet nothing between them. The pair is searched in declared order,
 * which is what keeps the same input producing the same triangles.
 *
 * A hole validated as strictly inside the region and meeting no other ring
 * always has a mutually visible vertex to bridge to, which is why the search is
 * read as total rather than guarded: the guard would answer a question
 * {@link refuseHolePlacement} and {@link refuseRingContacts} already settled.
 */
const bridgeHoles = (
  points: readonly IAutoMovieProfilePoint[],
  rings: readonly IAutoMovieRegionRing[],
): number[] => {
  const loops = rings.map((span) =>
    Array.from({ length: span.count }, (_unused, index) => span.start + index),
  );
  const shapes = rings.map((span) =>
    points.slice(span.start, span.start + span.count),
  );
  const ring = [...loops[0]!];
  for (let hole = 1; hole < loops.length; ++hole) {
    const bridge = ring
      .flatMap((_anchor, at) =>
        loops[hole]!.map((_corner, from) => ({ at, from })),
      )
      .find((candidate) =>
        bridgeIsClear(points, shapes, ring, loops, hole, candidate),
      )!;
    const rotated = [
      ...loops[hole]!.slice(bridge.from),
      ...loops[hole]!.slice(0, bridge.from),
    ];
    const anchor = ring[bridge.at]!;
    const tail = ring.splice(bridge.at + 1);
    for (const index of rotated) ring.push(index);
    ring.push(rotated[0]!, anchor);
    for (const index of tail) ring.push(index);
  }
  return ring;
};

/** Does one candidate bridge stay inside the region and meet nothing? */
const bridgeIsClear = (
  points: readonly IAutoMovieProfilePoint[],
  shapes: ReadonlyArray<readonly IAutoMovieProfilePoint[]>,
  ring: readonly number[],
  loops: ReadonlyArray<readonly number[]>,
  hole: number,
  candidate: { at: number; from: number },
): boolean => {
  const start = points[ring[candidate.at]!]!;
  const end = points[loops[hole]![candidate.from]!]!;
  const size = ring.length;
  for (let edge = 0; edge < size; ++edge)
    if (
      edge !== candidate.at &&
      edge !== (candidate.at + size - 1) % size &&
      segmentsMeet(
        start,
        end,
        points[ring[edge]!]!,
        points[ring[(edge + 1) % size]!]!,
      )
    )
      return false;
  for (let other = hole; other < loops.length; ++other) {
    const loop = loops[other]!;
    for (let edge = 0; edge < loop.length; ++edge)
      if (
        (other !== hole ||
          (edge !== candidate.from &&
            edge !== (candidate.from + loop.length - 1) % loop.length)) &&
        segmentsMeet(
          start,
          end,
          points[loop[edge]!]!,
          points[loop[(edge + 1) % loop.length]!]!,
        )
      )
        return false;
  }
  const middle = {
    x: (start.x + end.x) / 2,
    y: (start.y + end.y) / 2,
  };
  return (
    pointInRing(middle, shapes[0]!) &&
    shapes.every(
      (shape, at) => at === 0 || pointInRing(middle, shape) === false,
    )
  );
};

/**
 * Cut ears off one counter-clockwise ring until three corners are left.
 *
 * Each cut retains every remaining boundary vertex, including a straight-edge
 * subdivision. Input validation does not prove that a floating-point ear search
 * succeeded; a failed search must refuse before an invalid index is emitted.
 */
const earClip = (
  points: readonly IAutoMovieProfilePoint[],
  ring: readonly number[],
): number[] => {
  const working = [...ring];
  const triangles: number[] = [];
  for (let remaining = working.length; remaining > 3; --remaining) {
    const size = working.length;
    const at = working.findIndex((_corner, index) =>
      isEar(points, working, index),
    );
    if (at === -1)
      throw new Error("polygon triangulation could not find a valid ear");
    triangles.push(
      working[(at + size - 1) % size]!,
      working[at]!,
      working[(at + 1) % size]!,
    );
    working.splice(at, 1);
  }
  triangles.push(working[0]!, working[1]!, working[2]!);
  return triangles;
};

/**
 * Is the corner at `at` an ear: convex, with no other vertex in or on it?
 *
 * A vertex on the proposed diagonal blocks the cut too: skipping it can leave
 * only a zero-area chain for the remaining triangulation. A bridge repeats its
 * endpoints by index; those copies are the triangle's own corners, not blockers.
 */
const isEar = (
  points: readonly IAutoMovieProfilePoint[],
  ring: readonly number[],
  at: number,
): boolean => {
  const size = ring.length;
  const previousAt = (at + size - 1) % size;
  const nextAt = (at + 1) % size;
  const previous = points[ring[previousAt]!]!;
  const corner = points[ring[at]!]!;
  const next = points[ring[nextAt]!]!;
  if (cross2(previous, corner, next) <= PLANAR_EPSILON) return false;
  return ring.every((vertex) => {
    if (
      vertex === ring[previousAt] ||
      vertex === ring[at] ||
      vertex === ring[nextAt]
    )
      return true;
    return (
      insideOrOnTriangle(previous, corner, next, points[vertex]!) === false
    );
  });
};

/** Is the point inside or on the counter-clockwise triangle `a b c`? */
const insideOrOnTriangle = (
  a: IAutoMovieProfilePoint,
  b: IAutoMovieProfilePoint,
  c: IAutoMovieProfilePoint,
  point: IAutoMovieProfilePoint,
): boolean =>
  cross2(a, b, point) >= -PLANAR_EPSILON &&
  cross2(b, c, point) >= -PLANAR_EPSILON &&
  cross2(c, a, point) >= -PLANAR_EPSILON;
