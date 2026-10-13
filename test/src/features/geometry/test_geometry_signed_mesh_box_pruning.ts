import { createAutoMovieSignedMeshQuery } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { createSignedVoxelUnion } from "../internal/createSignedMeshFixture";
import { closestTriangleDistanceSquaredOracle } from "../internal/closestTriangleDistanceSquaredOracle";

import { nclose } from "../internal/predicates";

type Vec = [number, number, number];
/**
 * The bounding-box hierarchy, including the per-triangle box test inside a
 * leaf, returns the distance an exhaustive search over every triangle finds,
 * and reports a triangle that attains it.
 * Scenarios:
 * 1. A 4 x 4 x 2 voxel slab (well over one leaf of triangles) is queried at a
 *    lattice of points outside, on the near side of and inside the surface;
 *    each distance equals the exhaustive minimum from an independent
 *    closest-point routine.
 * 2. The triangle the query names lies at that same minimum distance, so a
 *    skipped triangle was never the nearest one.
 * 3. A second walk along a line, which keeps the previous feature as the
 *    starting bound, agrees as well.
 */
export const test_geometry_signed_mesh_box_pruning = (): void => {
  const cells: number[][] = [];
  for (let x = 0; x < 4; x++)
    for (let y = 0; y < 4; y++)
      for (let z = 0; z < 2; z++) cells.push([x, y, z]);
  const mesh = createSignedVoxelUnion(cells);
  const sample = createAutoMovieSignedMeshQuery(mesh);
  // Predecode the same caller-owned triangles once; every lattice and walking
  // query still measures every one independently of the production hierarchy.
  const corners=Array.from({length:mesh.indices!.length/3},(_,triangle)=>[0,1,2].map(k=>{const id=mesh.indices![3*triangle+k]!;return mesh.positions.slice(3*id,3*id+3);}));
  const check=(p:Vec):boolean=>{
    const hit=sample(p);let least2=Infinity,reported2=Infinity;
    for(let triangle=0;triangle<corners.length;triangle++){
      const [a,b,c]=corners[triangle]!;const distance2=closestTriangleDistanceSquaredOracle(p,a!,b!,c!);
      least2=Math.min(least2,distance2);if(triangle===hit.triangle)reported2=distance2;
    }
    const least=Math.sqrt(least2);
    return nclose(hit.distance,least,1e-9)&&nclose(Math.sqrt(reported2),least,1e-9);
  };
  const lattice: Vec[] = [];
  for (let x = -1.5; x <= 5.5; x += 0.7)
    for (let y = -1.5; y <= 5.5; y += 0.7)
      for (let z = -1.5; z <= 3.5; z += 0.7) lattice.push([x, y, z]);
  TestValidator.predicate(
    "every lattice point matches the exhaustive nearest distance",
    lattice.every(check),
  );
  const walk: Vec[] = [];
  for (let k = 0; k < 60; k++)
    walk.push([-1 + 0.1 * k, 1.3 + 0.01 * k, 2.6 - 0.05 * k]);
  TestValidator.predicate(
    "a walking sequence matches as well",
    walk.every(check),
  );
};
