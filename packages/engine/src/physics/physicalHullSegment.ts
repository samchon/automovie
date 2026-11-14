import type { IAutoMovieVector3 } from "@automovie/interface";

import { physicalHullFaces } from "./physicalHullFaces";

/**
 * The unit parameter of the point of a segment nearest a convex hull, or
 * deepest inside it, in the hull's own frame.
 *
 * Apart, the nearest pair of a hull and a segment is the point of their
 * Minkowski difference nearest the origin, which the Gilbert-Johnson-Keerthi
 * iteration finds exactly for two polytopes: each step adds the difference's
 * support point against the current nearest point and keeps the face of the
 * simplex nearest the origin (Ericson's region tests), and the segment
 * parameter is the barycentric mix of the simplex's segment ends. Once the
 * difference reaches within the hull's tolerance of the origin, the segment
 * meets the hull, and its deepest point minimises the greatest face plane
 * distance along it: a convex piecewise linear function of the parameter,
 * whose least value the walk along its upper envelope reaches exactly. A
 * segment that only grazes the hull within the tolerance takes the
 * iteration's parameter: that of its nearest point, or of the origin's
 * barycentric mix when a tetrahedron of the difference holds the origin.
 *
 * @param points The hull's shape-local points, metres, spanning a volume.
 * @param a The segment's start, at parameter 0, in the same frame.
 * @param b Its end, at parameter 1.
 * @returns The parameter in [0, 1].
 * @throws {Error} When the points span no volume.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States both cases, the method of each, the parameter's meaning, the frame and the grazing case.
 * @evidence contracts/development/implementation.md#principled-implementation The distance of two convex polytopes by Gilbert, Johnson and Keerthi (IEEE J Robot Autom 4:193, 1988) with the nearest point of a simplex by Voronoi region tests (Ericson, Real-Time Collision Detection, sections 5.1.5 and 5.1.6), and the deepest point as the one-variable linear program min over t of max over faces, solved by walking its upper envelope; both are exact for polytopes.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The single owner of segment-to-hull proximity; `physicalShapeNearest` reads the point, normal and distance at this parameter from `physicalHullNearest`, the single owner of the point query.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The only tolerance is the hull's own coplanarity tolerance, which separates a meeting from a gap; the iteration bound is the count of distinct support pairs, which the strictly shrinking nearest point cannot revisit. The non-null assertions index the simplex and the faces by bounded indices.
 * @evidence contracts/development/implementation.md#efficient-algorithms A few support scans over the hull's vertices apart, and one pass over the faces per envelope piece within, in place of the 47 point queries of a golden-section search.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of the hull and the segment; the faces and vertices it reads are shared by `physicalHullFaces`.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Keeps nothing between calls; its temporaries die with the call.
 */
export function physicalHullSegment(
  points: readonly IAutoMovieVector3[],
  a: IAutoMovieVector3,
  b: IAutoMovieVector3,
): number {
  const hull: physicalHullFaces.IHull = physicalHullFaces(points);
  if (!hull.faces.length) throw new Error("A hull must span a volume");
  const support = (d: IAutoMovieVector3): IVertex => {
    let vertex: number = 0;
    let most: number = -Infinity;
    hull.vertices.forEach((p: IAutoMovieVector3, i: number): void => {
      const along: number = dot(p, d);
      if (along > most) {
        most = along;
        vertex = i;
      }
    });
    const end: number = dot(d, a) <= dot(d, b) ? 0 : 1;
    return { w: minus(hull.vertices[vertex]!, end === 0 ? a : b), vertex, end };
  };
  const first: IVertex = support(minus(a, hull.centre));
  let simplex: IWeighted[] = alone(first);
  let v: IAutoMovieVector3 = first.w;
  let parameter: number = first.end;
  const limit: number = 2 * hull.vertices.length + 1;
  for (let step: number = 0; step < limit; step++) {
    const vv: number = dot(v, v);
    if (vv <= hull.tolerance * hull.tolerance)
      return deepest(hull, a, b) ?? parameter;
    const next: IVertex = support({ x: -v.x, y: -v.y, z: -v.z });
    // The difference lies where v.x >= v.w, so |v| - v.w/|v| bounds the gap.
    if (vv - dot(v, next.w) <= hull.tolerance * Math.sqrt(vv)) break;
    if (
      simplex.some(
        (s: IWeighted): boolean =>
          s.vertex === next.vertex && s.end === next.end,
      )
    )
      break;
    const grown: IVertex[] = [...simplex, next];
    const reduced: IWeighted[] | null = nearest(grown);
    if (reduced === null)
      return deepest(hull, a, b) ?? enclosing(grown) ?? parameter;
    const u: IAutoMovieVector3 = combined(reduced);
    if (!(dot(u, u) < vv)) break;
    simplex = reduced;
    v = u;
    parameter = reduced.reduce(
      (sum: number, s: IWeighted): number => sum + s.weight * s.end,
      0,
    );
  }
  return Math.min(1, Math.max(0, parameter));
}

/** A support point of the Minkowski difference: a hull vertex less a segment end. */
interface IVertex {
  /** The difference, metres. */ w: IAutoMovieVector3;
  /** The hull vertex's index. */ vertex: number;
  /** The segment end's parameter, 0 or 1. */ end: number;
}

/** A simplex vertex with its barycentric weight in the nearest point. */
interface IWeighted extends IVertex {
  /** The weight, in [0, 1]. */ weight: number;
}

const dot = (p: IAutoMovieVector3, q: IAutoMovieVector3): number =>
  p.x * q.x + p.y * q.y + p.z * q.z;

const minus = (
  p: IAutoMovieVector3,
  q: IAutoMovieVector3,
): IAutoMovieVector3 => ({ x: p.x - q.x, y: p.y - q.y, z: p.z - q.z });

const cross = (
  p: IAutoMovieVector3,
  q: IAutoMovieVector3,
): IAutoMovieVector3 => ({
  x: p.y * q.z - p.z * q.y,
  y: p.z * q.x - p.x * q.z,
  z: p.x * q.y - p.y * q.x,
});

const combined = (simplex: readonly IWeighted[]): IAutoMovieVector3 =>
  simplex.reduce(
    (sum: IAutoMovieVector3, s: IWeighted): IAutoMovieVector3 => ({
      x: sum.x + s.weight * s.w.x,
      y: sum.y + s.weight * s.w.y,
      z: sum.z + s.weight * s.w.z,
    }),
    { x: 0, y: 0, z: 0 },
  );

const weighted = (
  pairs: readonly (readonly [IVertex, number])[],
): IWeighted[] =>
  pairs
    .filter(([, weight]: readonly [IVertex, number]): boolean => weight > 0)
    .map(
      ([s, weight]: readonly [IVertex, number]): IWeighted => ({
        w: s.w,
        vertex: s.vertex,
        end: s.end,
        weight,
      }),
    );

const alone = (s: IVertex): IWeighted[] => [
  { w: s.w, vertex: s.vertex, end: s.end, weight: 1 },
];

/**
 * The smallest face of a simplex holding its point nearest the origin, with
 * that point's weights; null when the origin lies inside a tetrahedron.
 */
const nearest = (simplex: readonly IVertex[]): IWeighted[] | null => {
  if (simplex.length === 1) return alone(simplex[0]!);
  if (simplex.length === 2) return edge(simplex[0]!, simplex[1]!);
  if (simplex.length === 3)
    return triangle(simplex[0]!, simplex[1]!, simplex[2]!);
  const p: IVertex = simplex[0]!;
  const q: IVertex = simplex[1]!;
  const r: IVertex = simplex[2]!;
  const s: IVertex = simplex[3]!;
  let best: IWeighted[] | null = null;
  let least: number = Infinity;
  // A face is a candidate when the origin lies beyond it from the fourth
  // vertex; a flat tetrahedron offers every face.
  for (const [i, j, k, opposite] of [
    [p, q, r, s],
    [p, r, s, q],
    [p, s, q, r],
    [q, s, r, p],
  ] as const) {
    const n: IAutoMovieVector3 = cross(minus(j.w, i.w), minus(k.w, i.w));
    const side: number = dot(minus(opposite.w, i.w), n);
    if (!(-dot(i.w, n) * side < 0) && side !== 0) continue;
    const face: IWeighted[] = triangle(i, j, k);
    const u: IAutoMovieVector3 = combined(face);
    if (dot(u, u) < least) {
      least = dot(u, u);
      best = face;
    }
  }
  return best;
};

/**
 * The segment parameter of the origin's barycentric mix in a tetrahedron of
 * the difference that holds it, by its signed sub-volumes; null for a flat
 * tetrahedron.
 */
const enclosing = (simplex: readonly IVertex[]): number | null => {
  const volume = (
    p: IAutoMovieVector3,
    q: IAutoMovieVector3,
    r: IAutoMovieVector3,
    s: IAutoMovieVector3,
  ): number => dot(minus(q, p), cross(minus(r, p), minus(s, p)));
  const p: IAutoMovieVector3 = simplex[0]!.w;
  const q: IAutoMovieVector3 = simplex[1]!.w;
  const r: IAutoMovieVector3 = simplex[2]!.w;
  const s: IAutoMovieVector3 = simplex[3]!.w;
  const origin: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  const total: number = volume(p, q, r, s);
  if (total === 0) return null;
  const weights: number[] = [
    volume(origin, q, r, s),
    volume(p, origin, r, s),
    volume(p, q, origin, s),
    volume(p, q, r, origin),
  ];
  return Math.min(
    1,
    Math.max(
      0,
      weights.reduce(
        (sum: number, w: number, i: number): number =>
          sum + (w / total) * simplex[i]!.end,
        0,
      ),
    ),
  );
};

/** The point of a segment of the difference nearest the origin. */
const edge = (p: IVertex, q: IVertex): IWeighted[] => {
  const e: IAutoMovieVector3 = minus(q.w, p.w);
  const ee: number = dot(e, e);
  const t: number = ee > 0 ? -dot(p.w, e) / ee : 0;
  if (t <= 0) return alone(p);
  if (t >= 1) return alone(q);
  return weighted([
    [p, 1 - t],
    [q, t],
  ]);
};

/** The point of a triangle of the difference nearest the origin (Ericson 5.1.5). */
const triangle = (p: IVertex, q: IVertex, r: IVertex): IWeighted[] => {
  const ab: IAutoMovieVector3 = minus(q.w, p.w);
  const ac: IAutoMovieVector3 = minus(r.w, p.w);
  const d1: number = -dot(ab, p.w);
  const d2: number = -dot(ac, p.w);
  if (d1 <= 0 && d2 <= 0) return alone(p);
  const d3: number = -dot(ab, q.w);
  const d4: number = -dot(ac, q.w);
  if (d3 >= 0 && d4 <= d3) return alone(q);
  const vc: number = d1 * d4 - d3 * d2;
  if (vc <= 0 && d1 >= 0 && d3 <= 0) {
    const t: number = d1 / (d1 - d3);
    return weighted([
      [p, 1 - t],
      [q, t],
    ]);
  }
  const d5: number = -dot(ab, r.w);
  const d6: number = -dot(ac, r.w);
  if (d6 >= 0 && d5 <= d6) return alone(r);
  const vb: number = d5 * d2 - d1 * d6;
  if (vb <= 0 && d2 >= 0 && d6 <= 0) {
    const t: number = d2 / (d2 - d6);
    return weighted([
      [p, 1 - t],
      [r, t],
    ]);
  }
  const va: number = d3 * d6 - d5 * d4;
  if (va <= 0 && d4 - d3 >= 0 && d5 - d6 >= 0) {
    const t: number = (d4 - d3) / (d4 - d3 + (d5 - d6));
    return weighted([
      [q, 1 - t],
      [r, t],
    ]);
  }
  const total: number = va + vb + vc;
  // A triangle of no area: the nearest of its edges.
  if (!(total > 0)) {
    let best: IWeighted[] = edge(p, q);
    for (const candidate of [edge(q, r), edge(p, r)]) {
      const u: IAutoMovieVector3 = combined(candidate);
      const w: IAutoMovieVector3 = combined(best);
      if (dot(u, u) < dot(w, w)) best = candidate;
    }
    return best;
  }
  return weighted([
    [p, va / total],
    [q, vb / total],
    [r, vc / total],
  ]);
};

/**
 * The parameter minimising the greatest face plane distance along the
 * segment, when that least value is not positive; null when the segment
 * stays outside every face plane's reach, so it does not enter the hull.
 */
const deepest = (
  hull: physicalHullFaces.IHull,
  a: IAutoMovieVector3,
  b: IAutoMovieVector3,
): number | null => {
  const e: IAutoMovieVector3 = minus(b, a);
  const level: number[] = hull.faces.map(
    (f: physicalHullFaces.IFace): number => dot(f.normal, a) - f.offset,
  );
  const slope: number[] = hull.faces.map((f: physicalHullFaces.IFace): number =>
    dot(f.normal, e),
  );
  // The plane greatest just after the start: the steepest among equals.
  let current: number = 0;
  level.forEach((l: number, f: number): void => {
    if (
      l > level[current]! ||
      (l === level[current]! && slope[f]! > slope[current]!)
    )
      current = f;
  });
  let t: number = 0;
  while (slope[current]! < 0) {
    let meet: number = 1;
    let after: number = -1;
    for (let f: number = 0; f < level.length; f++) {
      if (!(slope[f]! > slope[current]!)) continue;
      const s: number =
        (level[current]! - level[f]!) / (slope[f]! - slope[current]!);
      if (s < meet || (s === meet && after >= 0 && slope[f]! > slope[after]!)) {
        meet = s;
        after = f;
      }
    }
    if (after < 0) {
      t = 1;
      break;
    }
    t = Math.max(t, meet);
    current = after;
  }
  return level[current]! + slope[current]! * t > 0 ? null : t;
};
