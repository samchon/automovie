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

import { surfaceTriangleOf } from "../../../internal/surfaceTriangleOf";
import { throwsError } from "../../../internal/throwsError";

type Edge = IAutoMovieMeasureFeatureEdges.IEdge;

/**
 * `measureAutoMovieFeatureEdges` finds a welded mesh's sharp bends (30 degrees
 * or more), independent of how finely flat faces are tessellated; the convex
 * distance (`autoMovieFeatureEdgeDistance`) follows them.
 *
 * Fixtures: the unit box from `tessellate` (24 vertices, every corner split by
 * face); the same box with every face an 8 x 8 grid of quads; a 16-segment
 * cylinder of radius 0.3 and height 1 (side facets 22.5 degrees apart); reach
 * 0.05 m.
 *
 * Scenarios:
 *
 * 1. The box has exactly 12 convex edges, each 1 m along one axis: no face
 *    diagonal is one. Its +Y face centre has no convex edge within reach
 *    (0.05); a point 0.005 m from the middle of the +Y/+X edge reads 0.005.
 * 2. The cylinder has only its 32 rim segments, convex, at |y| = 0.5.
 * 3. Measuring twice gives the same output; reach 0 throws.
 * 4. The grid box's pieces all lie on the 12 edges, convex, totalling 1 m each;
 *    at 1000 fixed surface points its convex distance equals the plain box's
 *    within 1e-9, including (0.495, 0.5, -0.002) in a triangle touching the
 *    edge at one vertex only (0.005).
 */
export function test_unit_engine_geometry_feature_edges(): void {
  const close = (a: number, b: number, e: number): boolean => Math.abs(a - b) <= e;
  const distance = (a: IAutoMovieVector3, b: IAutoMovieVector3): number =>
    Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
  const measure = (mesh: { positions: number[]; indices: number[] }, reach: number = 0.05) =>
    measureAutoMovieFeatureEdges({ positions: mesh.positions, indices: mesh.indices, reach });
  const convex = (
    mesh: { positions: number[]; indices: number[] },
    edges: IAutoMovieMeasureFeatureEdges.IResult,
    point: IAutoMovieVector3,
  ): number =>
    autoMovieFeatureEdgeDistance({
      edges,
      triangle: surfaceTriangleOf(mesh.positions, mesh.indices, point),
      point,
    }).convex;
  const box: IAutoMovieTessellation = tessellate({ type: "box", width: 1, height: 1, depth: 1 });
  const measured: IAutoMovieMeasureFeatureEdges.IResult = measure(box);

  // 1.
  TestValidator.equals("box edges", measured.edges.length, 12);
  TestValidator.predicate(
    "axis-parallel unit edges",
    measured.edges.every((e: Edge): boolean => {
      const d: number[] = [Math.abs(e.b.x - e.a.x), Math.abs(e.b.y - e.a.y), Math.abs(e.b.z - e.a.z)];
      return e.convex && close(d[0]! + d[1]! + d[2]!, 1, 1e-12) && d.filter((v: number) => v > 1e-12).length === 1;
    }),
  );
  TestValidator.equals("face centre", convex(box, measured, { x: 0, y: 0.5, z: 0 }), 0.05);
  TestValidator.predicate("near the edge", close(convex(box, measured, { x: 0.495, y: 0.5, z: 0 }), 0.005, 1e-9));

  // 2.
  const rims: IAutoMovieMeasureFeatureEdges.IResult = measure(tessellate({ type: "cylinder", radius: 0.3, height: 1 }));
  TestValidator.equals("rim count", rims.edges.length, 32);
  TestValidator.predicate(
    "rims only",
    rims.edges.every((e: Edge): boolean => e.convex && close(Math.abs(e.a.y), 0.5, 1e-12) && close(e.a.y, e.b.y, 1e-12)),
  );

  // 3.
  TestValidator.equals("repeatable", measure(box), measured);
  TestValidator.predicate("zero reach", throwsError((): unknown => measure(box, 0)));

  // 4.
  const grid: { positions: number[]; indices: number[] } = { positions: [], indices: [] };
  const n: number = 8;
  for (const [axis, sign, u, v] of [
    [0, 1, 1, 2],
    [0, -1, 2, 1],
    [1, 1, 2, 0],
    [1, -1, 0, 2],
    [2, 1, 0, 1],
    [2, -1, 1, 0],
  ] satisfies [number, number, number, number][]) {
    const base: number = grid.positions.length / 3;
    for (let j: number = 0; j <= n; ++j)
      for (let i: number = 0; i <= n; ++i) {
        const p: number[] = [0, 0, 0];
        p[axis] = sign * 0.5;
        p[u] = -0.5 + i / n;
        p[v] = -0.5 + j / n;
        grid.positions.push(...p);
      }
    for (let j: number = 0; j < n; ++j)
      for (let i: number = 0; i < n; ++i) {
        const a: number = base + j * (n + 1) + i;
        grid.indices.push(a, a + 1, a + n + 2, a, a + n + 2, a + n + 1);
      }
  }
  const pieces: IAutoMovieMeasureFeatureEdges.IResult = measure(grid);
  const on = (p: IAutoMovieVector3, e: Edge): boolean =>
    close(distance(e.a, p) + distance(p, e.b), distance(e.a, e.b), 1e-12);
  const totals: number[] = measured.edges.map((): number => 0);
  TestValidator.predicate(
    "pieces on the edges",
    pieces.edges.every((piece: Edge): boolean => {
      const host: number = measured.edges.findIndex((e: Edge): boolean => on(piece.a, e) && on(piece.b, e));
      if (host < 0 || !piece.convex) return false;
      totals[host]! += distance(piece.a, piece.b);
      return true;
    }),
  );
  TestValidator.predicate("1 m each", totals.every((t: number): boolean => close(t, 1, 1e-12)));
  const surface = (k: number): IAutoMovieVector3 => {
    const face: number = k % 6;
    const s: number = ((k * 0.6180339887) % 1) - 0.5;
    const t: number = ((k * 0.7548776662) % 1) - 0.5;
    const side: number = face % 2 === 0 ? 0.5 : -0.5;
    const axis: number = Math.floor(face / 2);
    return axis === 0 ? { x: side, y: s, z: t } : axis === 1 ? { x: s, y: side, z: t } : { x: s, y: t, z: side };
  };
  TestValidator.predicate(
    "equal distances",
    Array.from({ length: 1000 }, (_: unknown, k: number) => surface(k)).every((p: IAutoMovieVector3): boolean =>
      close(convex(box, measured, p), convex(grid, pieces, p), 1e-9),
    ),
  );
  const point: IAutoMovieVector3 = { x: 0.495, y: 0.5, z: -0.002 };
  const triangle: number = surfaceTriangleOf(grid.positions, grid.indices, point);
  const touching: number = [0, 1, 2].filter(
    (k: number): boolean => grid.positions[3 * grid.indices[3 * triangle + k]!] === 0.5,
  ).length;
  TestValidator.predicate(
    "one-vertex triangle",
    touching === 1 && close(convex(grid, pieces, point), 0.005, 1e-9),
  );
}
