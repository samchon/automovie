import {
  autoMovieFeatureEdgeDistance,
  measureAutoMovieFeatureEdges,
  tessellate,
} from "@automovie/engine";
import type {
  IAutoMovieMeasureFeatureEdges,
  IAutoMovieTessellation,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/nclose";
import { surfaceTriangleOf } from "../internal/surfaceTriangleOf";

/**
 * Wear distances do not depend on how finely a flat face is tessellated: a 1 m
 * box with each face subdivided into an 8 × 8 grid of quads measures the same
 * edges and the same distances as the 24-vertex box.
 *
 * Scenarios:
 *
 * 1. The subdivided box's feature segments, merged where collinear, are the
 *    24-vertex box's 12 edges: every piece lies on one of them, all are convex,
 *    and the pieces on each edge total its 1 m.
 * 2. With `reach: 0.05`, `dEdge` at 1000 fixed surface points equals the 24-vertex
 *    box's within 1e-9.
 * 3. That includes a point on the +Y face 0.005 m from its edge with +X, inside a
 *    triangle of the subdivided box that touches that edge at one vertex only,
 *    whose `dEdge` is 0.005.
 *
 * The shader's weights at 1280 × 720 are checked on a real GPU under the
 * visual-debugging skill, not here, each box against the CPU weight at the
 * point the rasterizer interpolated for each pixel, as
 * `test_render_wear_shader` states; the two boxes are not compared pixel by
 * pixel.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Measures both boxes and queries both at the same points; per-triangle lists limited to a triangle's own sides, or a weld that missed the grid's shared vertices, fails.
 * @evidence contracts/development/testing.md#independent-expectations The 24-vertex box from `tessellate` is the reference; the grid box is generated here with exact binary coordinates, and the 0.005 m case follows from geometry.
 * @evidence contracts/development/testing.md#distinguishing-cases A triangle touching the edge along a side, at a vertex only and not at all; signs and creases are owned by `test_geometry_feature_edge_distance`.
 * @evidence contracts/development/testing.md#execution-ownership A portable unit discovered as `test_geometry_feature_edges_tessellation`, with in-memory meshes.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 3 numbered scenarios it runs, each naming the input and the behavior it pins.
 */
export function test_geometry_feature_edges_tessellation(): void {
  const coarse: IAutoMovieTessellation = tessellate({
    type: "box",
    width: 1,
    height: 1,
    depth: 1,
  });
  const fine: { positions: number[]; indices: number[] } = gridBox(8);
  const a: IAutoMovieMeasureFeatureEdges.IResult = measureAutoMovieFeatureEdges(
    {
      positions: coarse.positions,
      indices: coarse.indices,
      reach: 0.05,
    },
  );
  const b: IAutoMovieMeasureFeatureEdges.IResult = measureAutoMovieFeatureEdges(
    {
      positions: fine.positions,
      indices: fine.indices,
      reach: 0.05,
    },
  );

  // 1. Collinear pieces merge into the twelve edges.
  const totals: number[] = a.edges.map(() => 0);
  let onEdges: boolean = b.edges.every(
    (piece: IAutoMovieMeasureFeatureEdges.IEdge): boolean => {
      const host: number = a.edges.findIndex(
        (edge: IAutoMovieMeasureFeatureEdges.IEdge): boolean =>
          onSegment(piece.a, edge) && onSegment(piece.b, edge),
      );
      if (host < 0 || !piece.convex) return false;
      totals[host] = (totals[host] ?? 0) + distance(piece.a, piece.b);
      return true;
    },
  );
  onEdges &&= totals.every((total: number): boolean => nclose(total, 1, 1e-12));
  TestValidator.predicate(
    `the grid box's ${b.edges.length} pieces merge into the 12 box edges`,
    onEdges,
  );

  // 2. Equal distances at 1000 surface points.
  const query: (
    mesh: { positions: ArrayLike<number>; indices: ArrayLike<number> },
    edges: IAutoMovieMeasureFeatureEdges.IResult,
    point: IAutoMovieVector3,
  ) => number = (
    mesh: { positions: ArrayLike<number>; indices: ArrayLike<number> },
    edges: IAutoMovieMeasureFeatureEdges.IResult,
    point: IAutoMovieVector3,
  ): number =>
    autoMovieFeatureEdgeDistance({
      edges,
      triangle: surfaceTriangleOf(mesh.positions, mesh.indices, point),
      point,
    }).convex;
  let equal: boolean = true;
  for (let index: number = 0; index < 1000; ++index) {
    const point: IAutoMovieVector3 = surfacePoint(index);
    equal &&= nclose(query(coarse, a, point), query(fine, b, point), 1e-9);
  }
  TestValidator.predicate("dEdge agrees at 1000 surface points", equal);

  // 3. A triangle touching the edge at one vertex only. On the +Y face the grid
  // cell x in [0.375, 0.5], z in [-0.125, 0] is split along its diagonal from
  // (x 0.375, z -0.125) to (x 0.5, z 0); the triangle on the z = 0 side has only
  // the corner (x 0.5, z 0) on the x = 0.5 edge.
  const point: IAutoMovieVector3 = { x: 0.495, y: 0.5, z: -0.002 };
  const triangle: number = surfaceTriangleOf(
    fine.positions,
    fine.indices,
    point,
  );
  const touches: number = [0, 1, 2].filter((k: number): boolean => {
    const vertex: number = fine.indices[3 * triangle + k] ?? -1;
    const x: number | undefined = fine.positions[3 * vertex];
    return x === 0.5;
  }).length;
  TestValidator.predicate(
    `a triangle touching the edge at ${touches} vertex sees it 0.005 m away`,
    touches === 1 && nclose(query(fine, b, point), 0.005, 1e-9),
  );
}

/**
 * A unit box centred on the origin, each face an n × n grid of quads wound
 * counter-clockwise from outside.
 */
function gridBox(n: number): { positions: number[]; indices: number[] } {
  const positions: number[] = [];
  const indices: number[] = [];
  // Each face: its normal axis and sign, and two in-face axes whose cross product is the outward normal.
  const faces: [number, number, number, number][] = [
    [0, 1, 1, 2],
    [0, -1, 2, 1],
    [1, 1, 2, 0],
    [1, -1, 0, 2],
    [2, 1, 0, 1],
    [2, -1, 1, 0],
  ];
  for (const [axis, sign, u, v] of faces) {
    const base: number = positions.length / 3;
    for (let j: number = 0; j <= n; ++j)
      for (let i: number = 0; i <= n; ++i) {
        const p: number[] = [0, 0, 0];
        p[axis] = sign * 0.5;
        p[u] = -0.5 + i / n;
        p[v] = -0.5 + j / n;
        positions.push(...p);
      }
    for (let j: number = 0; j < n; ++j)
      for (let i: number = 0; i < n; ++i) {
        const a: number = base + j * (n + 1) + i;
        indices.push(a, a + 1, a + n + 2, a, a + n + 2, a + n + 1);
      }
  }
  return { positions, indices };
}

/** A fixed point on the unit box's surface, spread over all faces. */
function surfacePoint(index: number): IAutoMovieVector3 {
  const face: number = index % 6;
  const s: number = ((index * 0.6180339887) % 1) - 0.5;
  const t: number = ((index * 0.7548776662) % 1) - 0.5;
  const sign: number = face % 2 === 0 ? 0.5 : -0.5;
  switch (Math.floor(face / 2)) {
    case 0:
      return { x: sign, y: s, z: t };
    case 1:
      return { x: s, y: sign, z: t };
    default:
      return { x: s, y: t, z: sign };
  }
}

/** Whether a point lies on an edge's segment, within 1e-12 m. */
function onSegment(
  p: IAutoMovieVector3,
  edge: IAutoMovieMeasureFeatureEdges.IEdge,
): boolean {
  return nclose(
    distance(edge.a, p) + distance(p, edge.b),
    distance(edge.a, edge.b),
    1e-12,
  );
}

/** Euclidean distance. */
function distance(a: IAutoMovieVector3, b: IAutoMovieVector3): number {
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
}
