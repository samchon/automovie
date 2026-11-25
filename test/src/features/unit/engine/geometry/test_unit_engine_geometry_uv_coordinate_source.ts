import {
  buildAutoMoviePolyhedron,
  buildAutoMovieWall,
  extrudeAutoMovieProfile,
  extrudeAutoMovieRegion,
  revolveAutoMovieProfile,
  tessellateToMesh,
} from "@automovie/engine";
import type { IAutoMovieMesh } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { sweepPolygonLoft } from "../../../internal/sweepPolygonLoft";

/**
 * Mesh constructors either emit metric UVs (spans in metres of the surface's
 * own length) or say they emit none.
 *
 * Scenarios:
 *
 * 1. A 3 x 2 polyhedron face, a 3 x 1 region extruded 0.2, a 1 x 1 square lofted 3
 *    m and a radius-3 ring revolved at 8 segments emit one UV pair per vertex.
 * 2. A convex extrusion, a wall and a primitive box emit null UVs.
 * 3. Their spans are 3 (face length), 8 (the region's outer perimeter 3 + 1 + 3 +
 *    1), 3 (loft length) and 6 pi (circumference), none a normalized 1.
 * 4. The region's ring opens its seam at vertex 8 with u = 0 and closes it at
 *    vertex 23 with u = 8.
 */
export function test_unit_engine_geometry_uv_coordinate_source(): void {
  const span = (mesh: IAutoMovieMesh, axis: 0 | 1): number =>
    Math.max(...mesh.uvs!.filter((_: number, i: number): boolean => i % 2 === axis));
  const square = (h: number) => [
    { x: -h, y: -h },
    { x: h, y: -h },
    { x: h, y: h },
    { x: -h, y: h },
  ];
  const face: IAutoMovieMesh = buildAutoMoviePolyhedron([
    [
      { x: 0, y: 0, z: 0 },
      { x: 3, y: 0, z: 0 },
      { x: 3, y: 2, z: 0 },
      { x: 0, y: 2, z: 0 },
    ],
  ]);
  const region: IAutoMovieMesh = extrudeAutoMovieRegion({
    outer: [
      { x: 0, y: 0 },
      { x: 3, y: 0 },
      { x: 3, y: 1 },
      { x: 0, y: 1 },
    ],
    depth: 0.2,
  });
  const lofted: IAutoMovieMesh = sweepPolygonLoft({
    path: [
      { x: 0, y: 0, z: 0 },
      { x: 0, y: 0, z: 3 },
    ],
    sections: [
      { at: 0, outer: square(0.5) },
      { at: 1, outer: square(0.5) },
    ],
  });
  const turned: IAutoMovieMesh = revolveAutoMovieProfile({
    profile: [
      { x: 3, y: 0 },
      { x: 3, y: 1 },
    ],
    segments: 8,
  });

  // 1. and 3.
  for (const [label, mesh, axis, expected] of [
    ["face", face, 0, 3],
    ["region", region, 0, 8],
    ["lofted", lofted, 1, 3],
    ["turned", turned, 0, 6 * Math.PI],
  ] satisfies [string, IAutoMovieMesh, 0 | 1, number][]) {
    TestValidator.equals(`${label} pairs`, mesh.uvs!.length, (mesh.positions.length / 3) * 2);
    TestValidator.predicate(`${label} span`, Math.abs(span(mesh, axis) - expected) <= 1e-9);
  }

  // 2.
  TestValidator.equals(
    "no UVs",
    [
      extrudeAutoMovieProfile({ profile: square(0.5), depth: 1 }).uvs,
      buildAutoMovieWall({ width: 1, height: 1, depth: 0.1, openings: [] }).uvs,
      tessellateToMesh({ type: "box", width: 1, height: 1, depth: 1 }).uvs,
    ],
    [null, null, null],
  );

  // 4.
  TestValidator.predicate(
    "seam",
    Math.abs(region.uvs![8 * 2]!) <= 1e-9 && Math.abs(region.uvs![23 * 2]! - 8) <= 1e-9,
  );
}
