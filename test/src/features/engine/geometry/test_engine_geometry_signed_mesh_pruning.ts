import { AutoMovieEngineGeometry } from "@automovie/engine";
import type {
  IAutoMovieMesh,
  IAutoMovieSignedMeshQueryHit,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { closestTriangleDistanceSquaredOracle } from "../../internal/closestTriangleDistanceSquaredOracle";
import { createSignedVoxelUnion } from "../../internal/createSignedMeshFixture";
import { nclose } from "../../internal/predicates";

/**
 * The bounding-box hierarchy of `createAutoMovieSignedMeshQuery`, including the
 * per-triangle box test inside a leaf, returns the distance an exhaustive
 * search over every triangle finds, and reports a triangle that attains it.
 *
 * Mesh: a 4 x 4 x 2 voxel slab, well over one leaf of triangles.
 *
 * Scenarios:
 *
 * 1. A lattice of points outside, on the near side of and inside the surface (x
 *    and y from -1.5 to 5.5, z from -1.5 to 3.5, step 0.7): each distance
 *    equals the exhaustive minimum of an independent closest-point routine, and
 *    the triangle the query names lies at that same minimum.
 * 2. A walk of 60 points along a line, which keeps the previous feature as the
 *    starting bound, agrees as well.
 */
export function test_engine_geometry_signed_mesh_pruning(): void {
  const cells: number[][] = [];
  for (let x: number = 0; x < 4; x++)
    for (let y: number = 0; y < 4; y++)
      for (let z: number = 0; z < 2; z++) cells.push([x, y, z]);
  const mesh: IAutoMovieMesh = createSignedVoxelUnion(cells);
  const sample: (point: readonly number[]) => IAutoMovieSignedMeshQueryHit =
    AutoMovieEngineGeometry.createSignedMeshQuery(mesh);
  const corners: number[][][] = Array.from(
    { length: mesh.indices!.length / 3 },
    (_: unknown, triangle: number): number[][] =>
      [0, 1, 2].map((k: number): number[] => {
        const id: number = mesh.indices![3 * triangle + k]!;
        return mesh.positions.slice(3 * id, 3 * id + 3);
      }),
  );
  const check = (p: number[]): boolean => {
    const hit: IAutoMovieSignedMeshQueryHit = sample(p);
    let least2: number = Infinity;
    let reported2: number = Infinity;
    for (let triangle: number = 0; triangle < corners.length; triangle++) {
      const [a, b, c]: number[][] = corners[triangle]!;
      const distance2: number = closestTriangleDistanceSquaredOracle(
        p,
        a!,
        b!,
        c!,
      );
      least2 = Math.min(least2, distance2);
      if (triangle === hit.triangle) reported2 = distance2;
    }
    const least: number = Math.sqrt(least2);
    return (
      nclose(hit.distance, least, 1e-9) &&
      nclose(Math.sqrt(reported2), least, 1e-9)
    );
  };
  const lattice: number[][] = [];
  for (let x: number = -1.5; x <= 5.5; x += 0.7)
    for (let y: number = -1.5; y <= 5.5; y += 0.7)
      for (let z: number = -1.5; z <= 3.5; z += 0.7) lattice.push([x, y, z]);
  TestValidator.predicate("lattice", lattice.every(check));
  const walk: number[][] = [];
  for (let k: number = 0; k < 60; k++)
    walk.push([-1 + 0.1 * k, 1.3 + 0.01 * k, 2.6 - 0.05 * k]);
  TestValidator.predicate("walk", walk.every(check));
}
