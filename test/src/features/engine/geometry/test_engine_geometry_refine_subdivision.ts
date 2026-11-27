import { AutoMovieEngineGeometry } from "@automovie/engine";
import type { IAutoMovieSubdivisionLevel } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * One Catmull-Clark step: `refineSubdivisionPoints(topology, positions)` emits
 * vertex, edge and face points in that order with the vertex masks used, and
 * `refineSubdivisionStencils(topology, source)` composes the same step with
 * sparse affine stencils.
 *
 * Fixture: the unit square quad, and the 3 x 3 vertex grid of four unit quads
 * with its centre vertex 4 raised to z = 1.
 *
 * Scenarios:
 *
 * 1. The square: corners on two boundary edges take the crease rule, (0.125,
 *    0.125), (0.875, 0.125), (0.875, 0.875), (0.125, 0.875); edge points are
 *    the midpoints; the face point is (0.5, 0.5); vertex 0's mask is 3/4 with
 *    1/8 on both edges.
 * 2. The grid: the centre's new z is 1/2 + 4 x 1/16 x 1/4 = 0.5625 and each
 *    interior edge point (1 + 0 + 1/4 + 1/4) / 4 = 0.375.
 * 3. The square's stencils from unit sources: the face row is 1/4 on each corner,
 *    edge 0 is 1/2 on vertices 0 and 1, vertex 0 is 3/4, 1/8, 1/8.
 * 4. On the grid, stencils applied to the positions equal the refined points
 *    within 1e-15.
 */
export function test_engine_geometry_refine_subdivision(): void {
  const square: IAutoMovieSubdivisionLevel = AutoMovieEngineGeometry.admitSubdivisionCage({
    positions: [0, 0, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0],
    faces: [[0, 1, 2, 3]],
  });
  const grid: IAutoMovieSubdivisionLevel = AutoMovieEngineGeometry.admitSubdivisionCage({
    positions: Array.from({ length: 9 }, (_: unknown, i: number): number[] => [
      i % 3,
      Math.floor(i / 3),
      i === 4 ? 1 : 0,
    ]).flat(),
    faces: [
      [0, 1, 4, 3],
      [1, 2, 5, 4],
      [3, 4, 7, 6],
      [4, 5, 8, 7],
    ],
  });

  // 1.
  const refined = AutoMovieEngineGeometry.refineSubdivisionPoints(square.topology, square.positions);
  TestValidator.equals(
    "square points",
    refined.points,
    [
      0.125, 0.125, 0, 0.875, 0.125, 0, 0.875, 0.875, 0, 0.125, 0.875, 0, 0.5,
      0, 0, 1, 0.5, 0, 0.5, 1, 0, 0, 0.5, 0, 0.5, 0.5, 0,
    ],
  );
  TestValidator.equals("mask", refined.masks[0], {
    vertex: 0.75,
    edges: [0.125, 0.125],
    faces: [0],
  });

  // 2.
  const lifted: number[] = AutoMovieEngineGeometry.refineSubdivisionPoints(
    grid.topology,
    grid.positions,
  ).points;
  TestValidator.equals("centre", lifted[3 * 4 + 2], 0.5625);
  const interior: number[] = [];
  for (let e: number = 0; e < grid.topology.edgeSharpness.length; ++e)
    if (
      grid.topology.edgeVertices[2 * e] === 4 ||
      grid.topology.edgeVertices[2 * e + 1] === 4
    )
      interior.push(lifted[3 * (9 + e) + 2]!);
  TestValidator.equals(
    "interior edges",
    interior,
    [0.375, 0.375, 0.375, 0.375],
  );

  // 3.
  const unit = (n: number): Map<number, number>[] =>
    Array.from({ length: n }, (_: unknown, i: number) => new Map([[i, 1]]));
  const rows: Map<number, number>[] = AutoMovieEngineGeometry.refineSubdivisionStencils(
    square.topology,
    unit(4),
  );
  TestValidator.equals(
    "face row",
    [...rows[8]!.entries()],
    [
      [0, 0.25],
      [1, 0.25],
      [2, 0.25],
      [3, 0.25],
    ],
  );
  TestValidator.equals(
    "edge row",
    [...rows[4]!.entries()],
    [
      [0, 0.5],
      [1, 0.5],
    ],
  );
  TestValidator.equals(
    "vertex row",
    [...rows[0]!.entries()].sort((a, b) => a[0] - b[0]),
    [
      [0, 0.75],
      [1, 0.125],
      [3, 0.125],
    ],
  );

  // 4.
  const stencils: Map<number, number>[] = AutoMovieEngineGeometry.refineSubdivisionStencils(
    grid.topology,
    unit(9),
  );
  TestValidator.predicate(
    "stencils agree",
    stencils.every((row: Map<number, number>, i: number): boolean =>
      [0, 1, 2].every((axis: number): boolean => {
        let sum: number = 0;
        for (const [j, w] of row) sum += w * grid.positions[3 * j + axis]!;
        return Math.abs(sum - lifted[3 * i + axis]!) <= 1e-15;
      }),
    ),
  );
}
