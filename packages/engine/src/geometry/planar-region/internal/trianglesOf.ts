import type {
  IAutoMovieProfilePoint,
  IAutoMovieRegionRing,
} from "@automovie/interface";

import { PLANAR_EPSILON } from "../../constants/PLANAR_EPSILON";
import { planarCross } from "../../internal/planarCross";
import { planarSegmentsMeet } from "../../internal/planarSegmentsMeet";
import { pointInPlanarRing } from "../../internal/pointInPlanarRing";

/**
 * Triangulate a canonical region without changing its point identities.
 *
 * The caller supplies finite, nonintersecting rings admitted by
 * canonicalRegion, with the outer ring counter-clockwise and holes clockwise.
 * Hole bridges are traversed in both directions and ears retain collinear
 * boundary subdivisions. The result is a flat counter-clockwise triangle index
 * array into points. Floating-point bridge and ear searches refuse when no
 * candidate is found.
 */
export function trianglesOf(
  points: readonly IAutoMovieProfilePoint[],
  rings: readonly IAutoMovieRegionRing[],
): number[] {
  return earClip(points, bridgeHoles(points, rings));
}

/**
 * Fold every hole into the outer ring along a bridge nothing else crosses.
 *
 * The bridge is a segment travelled in both directions, so the region becomes
 * one ring an ear clipper can consume while the void stays a void: the two
 * traversals meet nothing between them. Pending holes are searched in declared
 * order for a visible bridge. A sheltered hole waits until the hole screening
 * it joins the outer boundary, so declaration order cannot make a valid region
 * impossible. Floating-point predicates can still exhaust the search and
 * refuse.
 */
function bridgeHoles(
  points: readonly IAutoMovieProfilePoint[],
  rings: readonly IAutoMovieRegionRing[],
): number[] {
  const loops: number[][] = rings.map((span: IAutoMovieRegionRing): number[] =>
    Array.from(
      { length: span.count },
      (_unused: unknown, index: number): number => span.start + index,
    ),
  );
  const shapes: IAutoMovieProfilePoint[][] = rings.map(
    (span: IAutoMovieRegionRing): IAutoMovieProfilePoint[] =>
      points.slice(span.start, span.start + span.count),
  );
  const ring: number[] = [...loops[0]!];
  const pending: Set<number> = new Set(
    Array.from(
      { length: loops.length - 1 },
      (_: unknown, index: number): number => index + 1,
    ),
  );
  while (pending.size !== 0) {
    let bridge: IPlanarHoleBridge | undefined;
    search: for (const hole of pending)
      for (let at: number = 0; at < ring.length; ++at)
        for (let from: number = 0; from < loops[hole]!.length; ++from)
          if (
            bridgeIsClear(points, shapes, ring, loops, pending, hole, at, from)
          ) {
            bridge = { hole, at, from };
            break search;
          }
    if (bridge === undefined)
      throw new Error(
        "polygon triangulation could not find a visible hole bridge",
      );
    const hole: number = bridge.hole;
    const rotated: number[] = [
      ...loops[hole]!.slice(bridge.from),
      ...loops[hole]!.slice(0, bridge.from),
    ];
    const anchor: number = ring[bridge.at]!;
    const tail: number[] = ring.splice(bridge.at + 1);
    for (const index of rotated) ring.push(index);
    ring.push(rotated[0]!, anchor);
    for (const index of tail) ring.push(index);
    pending.delete(hole);
  }
  return ring;
}

/** The two ends of a bridge from the current perimeter into a hole. */
interface IPlanarHoleBridge {
  /** Ordinal of the hole in the region's canonical rings. */
  hole: number;

  /** Corner ordinal in the current perimeter walk. */
  at: number;

  /** Corner ordinal in the hole's ring. */
  from: number;
}

/** Does one candidate bridge stay inside the region and meet nothing? */
function bridgeIsClear(
  points: readonly IAutoMovieProfilePoint[],
  shapes: ReadonlyArray<readonly IAutoMovieProfilePoint[]>,
  ring: readonly number[],
  loops: ReadonlyArray<readonly number[]>,
  pending: ReadonlySet<number>,
  hole: number,
  at: number,
  from: number,
): boolean {
  const start: IAutoMovieProfilePoint = points[ring[at]!]!;
  const end: IAutoMovieProfilePoint = points[loops[hole]![from]!]!;
  const size: number = ring.length;
  for (let edge: number = 0; edge < size; ++edge)
    if (
      edge !== at &&
      edge !== (at + size - 1) % size &&
      planarSegmentsMeet(
        start,
        end,
        points[ring[edge]!]!,
        points[ring[(edge + 1) % size]!]!,
      )
    )
      return false;
  for (const other of pending) {
    const loop: readonly number[] = loops[other]!;
    for (let edge: number = 0; edge < loop.length; ++edge)
      if (
        (other !== hole ||
          (edge !== from && edge !== (from + loop.length - 1) % loop.length)) &&
        planarSegmentsMeet(
          start,
          end,
          points[loop[edge]!]!,
          points[loop[(edge + 1) % loop.length]!]!,
        )
      )
        return false;
  }
  const middle: IAutoMovieProfilePoint = {
    x: (start.x + end.x) / 2,
    y: (start.y + end.y) / 2,
  };
  return (
    pointInPlanarRing(middle, shapes[0]!) &&
    shapes.every(
      (shape: readonly IAutoMovieProfilePoint[], index: number): boolean =>
        index === 0 || pointInPlanarRing(middle, shape) === false,
    )
  );
}

/**
 * Cut ears off one counter-clockwise ring until three corners are left.
 *
 * Each cut retains every remaining boundary vertex, including a straight-edge
 * subdivision. Input validation does not prove that a floating-point ear search
 * succeeded; a failed search must refuse before an invalid index is emitted.
 */
function earClip(
  points: readonly IAutoMovieProfilePoint[],
  ring: readonly number[],
): number[] {
  const working: number[] = [...ring];
  const triangles: number[] = [];
  for (let remaining: number = working.length; remaining > 3; --remaining) {
    const size: number = working.length;
    const at: number = working.findIndex(
      (_corner: number, index: number): boolean =>
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
}

/**
 * Is the corner at `at` an ear: convex, with no other vertex in or on it?
 *
 * A vertex on the proposed diagonal blocks the cut too: skipping it can leave
 * only a zero-area chain for the remaining triangulation. A bridge repeats its
 * endpoints by index; those copies are the triangle's own corners, not
 * blockers.
 */
function isEar(
  points: readonly IAutoMovieProfilePoint[],
  ring: readonly number[],
  at: number,
): boolean {
  const size: number = ring.length;
  const previousAt: number = (at + size - 1) % size;
  const nextAt: number = (at + 1) % size;
  const previous: IAutoMovieProfilePoint = points[ring[previousAt]!]!;
  const corner: IAutoMovieProfilePoint = points[ring[at]!]!;
  const next: IAutoMovieProfilePoint = points[ring[nextAt]!]!;
  if (planarCross(previous, corner, next) <= PLANAR_EPSILON) return false;
  return ring.every((vertex: number): boolean => {
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
}

/** Is the point inside or on the counter-clockwise triangle `a b c`? */
function insideOrOnTriangle(
  a: IAutoMovieProfilePoint,
  b: IAutoMovieProfilePoint,
  c: IAutoMovieProfilePoint,
  point: IAutoMovieProfilePoint,
): boolean {
  return (
    planarCross(a, b, point) >= -PLANAR_EPSILON &&
    planarCross(b, c, point) >= -PLANAR_EPSILON &&
    planarCross(c, a, point) >= -PLANAR_EPSILON
  );
}
