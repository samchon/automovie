import type {
  IAutoMovieMeasureFeatureEdges,
  IAutoMovieVector3,
} from "@automovie/interface";

import { pointSegmentDistance } from "../math/pointSegmentDistance";
import { segmentSegmentDistance } from "../math/segmentSegmentDistance";

/**
 * Feature edges bend the surface by more than this angle between face normals,
 * 30°.
 */
const FEATURE_COSINE: number = Math.cos(Math.PI / 6);

/** Most feature edges one triangle keeps. */
const LIST_LIMIT: number = 16;

/**
 * Find a triangle mesh's convex and concave feature edges and, for each
 * triangle, the ones within reach of it.
 *
 * 1. Vertices with exactly equal positions are welded, so a flat-shaded mesh whose
 *    vertices are split at hard edges still shares those edges. Triangles of
 *    zero area are skipped.
 * 2. An edge shared by exactly two welded triangles is a feature edge when the
 *    angle between their face normals exceeds 30°; an edge with one triangle (a
 *    boundary) or more than two (non-manifold) is not. The edge is convex when
 *    the second triangle's centroid lies behind the first triangle's plane,
 *    against its normal, and concave otherwise. Edges are listed in the order
 *    their first triangle and its side occur in the input.
 * 3. Each triangle keeps the feature edges whose segment lies within `reach` of
 *    the triangle, nearest first with ties broken by edge index, up to 16. The
 *    segment-to-triangle distance is zero when the segment pierces the
 *    triangle, and otherwise the least of its endpoints' distances to the
 *    triangle and its distances to the triangle's three sides, which is exact
 *    for a segment and a triangle in 3D.
 *
 * Because a triangle lists every edge within reach, not only its own sides, a
 * fragment inside a face subdivided into many triangles sees the same edges as
 * in the face's one quad; edges themselves are split into collinear pieces by
 * such subdivision, which leaves every distance unchanged. The work is a fixed
 * function of the input, so a mesh measured twice gives equal output.
 *
 * Cost is O(T log T) for welding and adjacency plus O(T × E) for the lists,
 * with T triangles and E feature edges; meshes this measures are generated sets
 * of at most tens of thousands of triangles, measured once when a model is
 * built.
 *
 * @throws When `reach` is not finite and above zero, or an index is out of
 *   range.
 */
export function measureAutoMovieFeatureEdges(
  props: IAutoMovieMeasureFeatureEdges.IProps,
): IAutoMovieMeasureFeatureEdges.IResult {
  const { positions, indices, reach }: IAutoMovieMeasureFeatureEdges.IProps =
    props;
  if (reach <= 0)
    throw new Error("feature edge reach must be finite and above zero");
  const vertexCount: number = Math.floor(positions.length / 3);
  const triangleCount: number = Math.floor(indices.length / 3);

  // 1. Weld exactly equal positions.
  const welded: number[] = new Array<number>(vertexCount);
  const ids: Map<string, number> = new Map();
  for (let v: number = 0; v < vertexCount; ++v) {
    const key: string = `${positions[3 * v]},${positions[3 * v + 1]},${positions[3 * v + 2]}`;
    let id: number | undefined = ids.get(key);
    if (id === undefined) {
      id = v;
      ids.set(key, id);
    }
    welded[v] = id;
  }
  const point: (v: number) => IAutoMovieVector3 = (
    v: number,
  ): IAutoMovieVector3 => ({
    x: positions[3 * v]!,
    y: positions[3 * v + 1]!,
    z: positions[3 * v + 2]!,
  });
  const corners: IAutoMovieVector3[][] = [];
  const normals: (IAutoMovieVector3 | null)[] = [];
  for (let t: number = 0; t < triangleCount; ++t) {
    const vs: number[] = [
      indices[3 * t]!,
      indices[3 * t + 1]!,
      indices[3 * t + 2]!,
    ];
    if (vs.some((v: number): boolean => !(v >= 0 && v < vertexCount)))
      throw new Error(`feature edge triangle ${t} has an index out of range`);
    const [a, b, c]: [IAutoMovieVector3, IAutoMovieVector3, IAutoMovieVector3] =
      vs.map(point) as [
        IAutoMovieVector3,
        IAutoMovieVector3,
        IAutoMovieVector3,
      ];
    corners.push([a, b, c]);
    const n: IAutoMovieVector3 = cross(sub(b, a), sub(c, a));
    const length: number = Math.hypot(n.x, n.y, n.z);
    normals.push(length > 0 ? scale(n, 1 / length) : null);
  }

  // 2. Edges by welded endpoint pair, with the triangles sharing them.
  const sides: Map<string, { a: number; b: number; triangles: number[] }> =
    new Map();
  for (let t: number = 0; t < triangleCount; ++t) {
    if (normals[t] === null) continue;
    for (let k: number = 0; k < 3; ++k) {
      const u: number = indices[3 * t + k]!;
      const v: number = indices[3 * t + ((k + 1) % 3)]!;
      const wu: number = welded[u]!;
      const wv: number = welded[v]!;
      if (wu === wv) continue;
      const key: string = wu < wv ? `${wu}:${wv}` : `${wv}:${wu}`;
      const side: { a: number; b: number; triangles: number[] } | undefined =
        sides.get(key);
      if (side === undefined) sides.set(key, { a: u, b: v, triangles: [t] });
      else side.triangles.push(t);
    }
  }
  const edges: IAutoMovieMeasureFeatureEdges.IEdge[] = [];
  for (const side of sides.values()) {
    if (side.triangles.length !== 2) continue;
    const [first, second]: [number, number] = side.triangles as [
      number,
      number,
    ];
    const n1: IAutoMovieVector3 = normals[first]!;
    const n2: IAutoMovieVector3 = normals[second]!;
    if (dot(n1, n2) >= FEATURE_COSINE) continue;
    const [p, q, r]: IAutoMovieVector3[] = corners[second]!;
    const centroid: IAutoMovieVector3 = scale(add(add(p!, q!), r!), 1 / 3);
    edges.push({
      a: point(side.a),
      b: point(side.b),
      convex: dot(sub(centroid, corners[first]![0]!), n1) < 0,
    });
  }

  // 3. Each triangle's edges within reach.
  const triangles: number[][] = corners.map(
    (triangle: IAutoMovieVector3[]): number[] =>
      edges
        .map(
          (
            edge: IAutoMovieMeasureFeatureEdges.IEdge,
            index: number,
          ): [number, number] => [
            segmentTriangleDistance(edge.a, edge.b, triangle),
            index,
          ],
        )
        .filter(([distance]: [number, number]): boolean => distance <= reach)
        .sort(
          (x: [number, number], y: [number, number]): number =>
            x[0] - y[0] || x[1] - y[1],
        )
        .slice(0, LIST_LIMIT)
        .map(([, index]: [number, number]): number => index),
  );
  return { edges, triangles, reach };
}

/** Exact distance from segment `ab` to a triangle. */
function segmentTriangleDistance(
  a: IAutoMovieVector3,
  b: IAutoMovieVector3,
  triangle: IAutoMovieVector3[],
): number {
  const [p, q, r]: [IAutoMovieVector3, IAutoMovieVector3, IAutoMovieVector3] =
    triangle as [IAutoMovieVector3, IAutoMovieVector3, IAutoMovieVector3];
  const n: IAutoMovieVector3 = cross(sub(q, p), sub(r, p));
  const da: number = dot(sub(a, p), n);
  const db: number = dot(sub(b, p), n);

  // The segment pierces the triangle's plane inside the triangle.
  if (dot(n, n) > 0 && da * db <= 0 && da !== db) {
    const hit: IAutoMovieVector3 = add(a, scale(sub(b, a), da / (da - db)));
    if (inside(hit, p, q, r, n)) return 0;
  }
  return Math.min(
    pointTriangleDistance(a, p, q, r),
    pointTriangleDistance(b, p, q, r),
    segmentSegmentDistance(a, b, p, q),
    segmentSegmentDistance(a, b, q, r),
    segmentSegmentDistance(a, b, r, p),
  );
}

/**
 * Distance from a point to a triangle: to its plane when it projects inside,
 * else to its nearest side.
 */
function pointTriangleDistance(
  x: IAutoMovieVector3,
  p: IAutoMovieVector3,
  q: IAutoMovieVector3,
  r: IAutoMovieVector3,
): number {
  const n: IAutoMovieVector3 = cross(sub(q, p), sub(r, p));
  const area: number = dot(n, n);
  if (area > 0) {
    const height: number = dot(sub(x, p), n) / area;
    const foot: IAutoMovieVector3 = sub(x, scale(n, height));
    if (inside(foot, p, q, r, n)) return Math.abs(height) * Math.sqrt(area);
  }
  return Math.min(
    pointSegmentDistance(x, p, q),
    pointSegmentDistance(x, q, r),
    pointSegmentDistance(x, r, p),
  );
}

/** Whether a point of the triangle's plane lies inside or on the triangle. */
function inside(
  x: IAutoMovieVector3,
  p: IAutoMovieVector3,
  q: IAutoMovieVector3,
  r: IAutoMovieVector3,
  n: IAutoMovieVector3,
): boolean {
  return (
    dot(cross(sub(q, p), sub(x, p)), n) >= 0 &&
    dot(cross(sub(r, q), sub(x, q)), n) >= 0 &&
    dot(cross(sub(p, r), sub(x, r)), n) >= 0
  );
}

/** `a + b`. */
function add(a: IAutoMovieVector3, b: IAutoMovieVector3): IAutoMovieVector3 {
  return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
}

/** `a − b`. */
function sub(a: IAutoMovieVector3, b: IAutoMovieVector3): IAutoMovieVector3 {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}

/** `a × s`. */
function scale(a: IAutoMovieVector3, s: number): IAutoMovieVector3 {
  return { x: a.x * s, y: a.y * s, z: a.z * s };
}

/** `a · b`. */
function dot(a: IAutoMovieVector3, b: IAutoMovieVector3): number {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

/** `a × b`. */
function cross(a: IAutoMovieVector3, b: IAutoMovieVector3): IAutoMovieVector3 {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  };
}
