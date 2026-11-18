import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * The triangles of the convex hull of a point set, as index triples wound
 * counter clockwise seen from outside, by quickhull.
 *
 * The hull starts as a tetrahedron of extreme points. Every other point lying
 * more than `tolerance` in front of a triangle is filed with one such
 * triangle. While a triangle holds points, the farthest one joins the hull:
 * the triangles it lies in front of are found by walking neighbours from that
 * triangle, removed, and replaced by a fan from the point to the boundary of
 * the removed region (the horizon); the removed triangles' points are filed
 * again among the new ones. A point within `tolerance` of every plane never
 * joins, so coplanar points come out as several triangles of one plane, or
 * as no vertex at all, and a caller that wants faces groups the points by
 * plane afterwards.
 *
 * @param points Shape-local points, metres.
 * @param tolerance The distance within which a point counts as on a plane, metres, finite and not negative.
 * @returns The triangles as consecutive index triples; empty when the points span no volume beyond the tolerance.
 * @throws {Error} When the horizon of a point is not one closed loop, which a convex hull's always is.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the construction, what the tolerance does to coplanar points, the winding and the empty result.
 * @evidence contracts/development/implementation.md#principled-implementation Quickhull (Barber, Dobkin and Huhdanpaa 1996, The Quickhull Algorithm for Convex Hulls, ACM TOMS 22(4)): a point strictly in front of a face lies outside the hull, the faces it sees form one connected region, and the fan from the point to that region's boundary is the hull of the old hull and the point. A horizon edge cannot be collinear with the point, since the point would then lie in the plane of the visible face beside it, so no fan triangle is flat.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Owns only the triangle search; `physicalHullFaces` owns the faces, their order and their loops.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts One tolerance, the caller's, decides every visibility; a broken horizon throws instead of returning a partial hull.
 * @evidence contracts/development/implementation.md#efficient-algorithms Expected O(n log n) in the point count for points in general position: each point is filed against the triangles of the region its predecessor removed. The first tetrahedron costs three linear scans.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work One search per call; `physicalHullFaces` remembers its result per points array.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Triangles, neighbour links and filed points are call-owned and die with the call; only the index triples return.
 */
export function physicalHullTriangles(
  points: readonly IAutoMovieVector3[],
  tolerance: number,
): number[] {
  const count: number = points.length;
  if (count < 4) return [];

  // The first tetrahedron: the farthest pair among the axis extremes, the
  // point farthest from their line, and the point farthest from that plane.
  let first: number = 0;
  let second: number = 0;
  let span: number = -1;
  for (const axis of ["x", "y", "z"] as const) {
    let low: number = 0;
    let high: number = 0;
    for (let i: number = 1; i < count; i++) {
      if (points[i]![axis] < points[low]![axis]) low = i;
      if (points[i]![axis] > points[high]![axis]) high = i;
    }
    const length: number = points[high]![axis] - points[low]![axis];
    if (length > span) {
      span = length;
      first = low;
      second = high;
    }
  }
  if (!(span > tolerance)) return [];
  const a: IAutoMovieVector3 = points[first]!;
  const b: IAutoMovieVector3 = points[second]!;
  let third: number = -1;
  let far: number = tolerance * span;
  for (let i: number = 0; i < count; i++) {
    const p: IAutoMovieVector3 = points[i]!;
    const x: number = (b.y - a.y) * (p.z - a.z) - (b.z - a.z) * (p.y - a.y);
    const y: number = (b.z - a.z) * (p.x - a.x) - (b.x - a.x) * (p.z - a.z);
    const z: number = (b.x - a.x) * (p.y - a.y) - (b.y - a.y) * (p.x - a.x);
    const area: number = Math.sqrt(x * x + y * y + z * z);
    if (area > far) {
      far = area;
      third = i;
    }
  }
  if (third < 0) return [];
  const base: ITriangle = triangle(points, first, second, third);
  let fourth: number = -1;
  let height: number = tolerance;
  for (let i: number = 0; i < count; i++) {
    const d: number = Math.abs(distance(base, points[i]!));
    if (d > height) {
      height = d;
      fourth = i;
    }
  }
  if (fourth < 0) return [];

  // Wind the base away from the fourth point, then close the three sides.
  const flipped: boolean = distance(base, points[fourth]!) > 0;
  const u: number = flipped ? second : first;
  const v: number = flipped ? first : second;
  const faces: ITriangle[] = [
    triangle(points, u, v, third),
    triangle(points, v, u, fourth),
    triangle(points, third, v, fourth),
    triangle(points, u, third, fourth),
  ];
  join(faces[0]!, 0, faces[1]!, 0);
  join(faces[0]!, 1, faces[2]!, 0);
  join(faces[0]!, 2, faces[3]!, 0);
  join(faces[1]!, 1, faces[3]!, 2);
  join(faces[1]!, 2, faces[2]!, 1);
  join(faces[2]!, 2, faces[3]!, 1);

  const pending: ITriangle[] = [];
  const file = (index: number, among: readonly ITriangle[]): void => {
    for (const face of among)
      if (distance(face, points[index]!) > tolerance) {
        if (face.outside.length === 0) pending.push(face);
        face.outside.push(index);
        return;
      }
  };
  for (let i: number = 0; i < count; i++)
    if (i !== first && i !== second && i !== third && i !== fourth)
      file(i, faces);

  while (pending.length !== 0) {
    const seed: ITriangle = pending.pop()!;
    if (!seed.alive) continue;

    // The farthest point filed with this triangle joins the hull.
    let apex: number = seed.outside[0]!;
    let best: number = -Infinity;
    for (const index of seed.outside) {
      const d: number = distance(seed, points[index]!);
      if (d > best) {
        best = d;
        apex = index;
      }
    }
    const eye: IAutoMovieVector3 = points[apex]!;

    // Walk the triangles the point lies in front of, collecting the edges
    // where the walk meets a triangle it does not.
    const visible: ITriangle[] = [seed];
    const horizon: IEdge[] = [];
    seed.alive = false;
    for (let at: number = 0; at < visible.length; at++) {
      const face: ITriangle = visible[at]!;
      for (let edge: number = 0; edge < 3; edge++) {
        const next: ITriangle = face.neighbours[edge]!;
        if (!next.alive) continue;
        if (distance(next, eye) > tolerance) {
          next.alive = false;
          visible.push(next);
        } else
          horizon.push({
            from: face.corners[edge]!,
            to: face.corners[(edge + 1) % 3]!,
            beyond: next,
            side: next.neighbours.indexOf(face),
          });
      }
    }

    // One new triangle on every horizon edge, each meeting the next at the
    // horizon vertex they share.
    const fan: ITriangle[] = [];
    const starting: Map<number, ITriangle> = new Map();
    const ending: Map<number, ITriangle> = new Map();
    for (const edge of horizon) {
      const created: ITriangle = triangle(points, edge.from, edge.to, apex);
      join(created, 0, edge.beyond, edge.side);
      if (starting.has(edge.from) || ending.has(edge.to))
        throw new Error("A hull horizon must be one closed loop");
      starting.set(edge.from, created);
      ending.set(edge.to, created);
      fan.push(created);
    }
    for (const created of fan) {
      const after: ITriangle | undefined = starting.get(created.corners[1]!);
      const before: ITriangle | undefined = ending.get(created.corners[0]!);
      if (after === undefined || before === undefined)
        throw new Error("A hull horizon must be one closed loop");
      created.neighbours[1] = after;
      created.neighbours[2] = before;
    }
    faces.push(...fan);
    for (const face of visible)
      for (const index of face.outside) if (index !== apex) file(index, fan);
  }

  const out: number[] = [];
  for (const face of faces)
    if (face.alive) out.push(face.corners[0]!, face.corners[1]!, face.corners[2]!);
  return out;
}

/** One triangle of the growing hull. */
interface ITriangle {
  /** Point indices, counter clockwise seen from outside. */
  corners: [number, number, number];

  /** Outward normal, unit length unless the corners are collinear. */
  normal: [number, number, number];

  /** The plane's distance from the origin along the normal. */
  offset: number;

  /** The triangle across the edge leaving each corner. */
  neighbours: [ITriangle | null, ITriangle | null, ITriangle | null];

  /** Points filed in front of this triangle. */
  outside: number[];

  /** Whether the triangle is still on the hull. */
  alive: boolean;
}

/** An edge of a removed region, with the surviving triangle across it. */
interface IEdge {
  /** The edge's first point, in the removed triangle's winding. */
  from: number;

  /** The edge's second point. */
  to: number;

  /** The surviving triangle across the edge. */
  beyond: ITriangle;

  /** Which of that triangle's edges this is. */
  side: number;
}

/** A triangle through three points, its normal by the right-hand rule. */
function triangle(
  points: readonly IAutoMovieVector3[],
  i: number,
  j: number,
  k: number,
): ITriangle {
  const a: IAutoMovieVector3 = points[i]!;
  const b: IAutoMovieVector3 = points[j]!;
  const c: IAutoMovieVector3 = points[k]!;
  const x: number = (b.y - a.y) * (c.z - a.z) - (b.z - a.z) * (c.y - a.y);
  const y: number = (b.z - a.z) * (c.x - a.x) - (b.x - a.x) * (c.z - a.z);
  const z: number = (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
  const length: number = Math.sqrt(x * x + y * y + z * z) || 1;
  const normal: [number, number, number] = [x / length, y / length, z / length];
  return {
    corners: [i, j, k],
    normal,
    offset: normal[0] * a.x + normal[1] * a.y + normal[2] * a.z,
    neighbours: [null, null, null],
    outside: [],
    alive: true,
  };
}

/** Signed distance of a point in front of a triangle's plane. */
function distance(face: ITriangle, p: IAutoMovieVector3): number {
  return (
    face.normal[0] * p.x +
    face.normal[1] * p.y +
    face.normal[2] * p.z -
    face.offset
  );
}

/** Make two triangles each other's neighbour across the given edges. */
function join(a: ITriangle, edge: number, b: ITriangle, other: number): void {
  a.neighbours[edge] = b;
  b.neighbours[other] = a;
}
