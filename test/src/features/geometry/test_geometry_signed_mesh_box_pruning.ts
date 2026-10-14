import { createAutoMovieSignedMeshQuery, type IAutoMovieSignedMeshQueryHit } from "@automovie/engine";
import { type IAutoMovieMesh } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";


import { closestTriangleDistanceSquaredOracle } from "../internal/closestTriangleDistanceSquaredOracle";
import { createSignedVoxelUnion } from "../internal/createSignedMeshFixture";
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
 *
 * @evidence contracts/testing.md#behavioral-verification Compiles the existing 4-by-4-by-2 voxel slab, queries its original lattice and sixty-point walk and compares both returned distance and reported-triangle distance with an exhaustive triangle minimum. It catches hierarchy or leaf-box pruning that skips a genuinely nearer feature, including reuse of the preceding winner.
 * @evidence contracts/testing.md#independent-expectations The existing scalar Ericson seven-region oracle independently measures every authored triangle instead of using production face/segment traversal or its hierarchy. Distances retain 1e-9 absolute agreement; both routines still use binary64 coordinates, and this test observes unsigned nearest distance and witness attainment rather than sign, every tie ordinal or rendered geometry.
 * @evidence contracts/testing.md#distinguishing-cases Preserves the slab exceeding one hierarchy leaf, original three-axis lattice and coherent sixty-query walk. Analytic feature/sign, equal-distance source ordering and malformed or open surfaces are owned by companion signed-mesh tests.
 * @evidence contracts/testing.md#execution-ownership The discoverable named entry directly calls portable compiled-query source and the existing voxel/triangle observers on in-memory data. It installs no consumer, builds no native artifact and starts no process, browser or GPU; lattice/walk rows are local cases without dynamic registration.
 */
export function test_geometry_signed_mesh_box_pruning(): void {
  const cells: number[][] = [];
  for (let x: number = 0; x < 4; x++)
    for (let y: number = 0; y < 4; y++)
      for (let z: number = 0; z < 2; z++) cells.push([x, y, z]);
  const mesh: IAutoMovieMesh = createSignedVoxelUnion(cells);
  const sample: (point: readonly number[]) => IAutoMovieSignedMeshQueryHit =
    createAutoMovieSignedMeshQuery(mesh);
  // Predecode the same caller-owned triangles once; every lattice and walking
  // query still measures every one independently of the production hierarchy.
  const corners: number[][][] = Array.from(
    { length: mesh.indices!.length / 3 },
    (_: unknown, triangle: number): number[][] =>
      [0, 1, 2].map((k: number): number[] => {
        const id: number = mesh.indices![3 * triangle + k]!;
        return mesh.positions.slice(3 * id, 3 * id + 3);
      }),
  );
  const check: (p: Vec) => boolean = (p: Vec): boolean => {
    const hit: IAutoMovieSignedMeshQueryHit = sample(p);
    let least2: number = Infinity,
      reported2: number = Infinity;
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
  const lattice: Vec[] = [];
  for (let x: number = -1.5; x <= 5.5; x += 0.7)
    for (let y: number = -1.5; y <= 5.5; y += 0.7)
      for (let z: number = -1.5; z <= 3.5; z += 0.7) lattice.push([x, y, z]);
  TestValidator.predicate(
    "every lattice point matches the exhaustive nearest distance",
    lattice.every(check),
  );
  const walk: Vec[] = [];
  for (let k: number = 0; k < 60; k++)
    walk.push([-1 + 0.1 * k, 1.3 + 0.01 * k, 2.6 - 0.05 * k]);
  TestValidator.predicate(
    "a walking sequence matches as well",
    walk.every(check),
  );
}
