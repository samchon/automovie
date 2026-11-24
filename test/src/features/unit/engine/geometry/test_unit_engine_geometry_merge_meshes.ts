import { mergeAutoMovieMeshes } from "@automovie/engine";
import type { IAutoMovieMesh } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * `mergeAutoMovieMeshes` concatenates meshes, rebasing each member's indices by
 * the vertices before it, without passing the buffers as an argument list.
 *
 * Member: 48004 vertices and 216000 indices, index i addressing vertex i mod
 * 48003 (the last vertex is unreferenced).
 *
 * Scenarios:
 *
 * 1. Two such members merge to 288024 position components and 432000 indices.
 * 2. The last index is the second member's own last index rebased by 48004:
 *    (215999 mod 48003) + 48004.
 * 3. The authored final coordinate (0) survives.
 */
export function test_unit_engine_geometry_merge_meshes(): void {
  const vertices: number = 48_004;
  const indexCount: number = 216_000;
  const dense: IAutoMovieMesh = {
    positions: Array.from(
      { length: vertices * 3 },
      (_: unknown, component: number): number =>
        component % 9 === 3 || component % 9 === 7 ? 1 : 0,
    ),
    indices: Array.from(
      { length: indexCount },
      (_: unknown, index: number): number => index % (vertices - 1),
    ),
    normals: null,
    uvs: null,
    skin: null,
  };
  const merged: IAutoMovieMesh = mergeAutoMovieMeshes([dense, dense]);
  TestValidator.equals("positions", merged.positions.length, 288_024);
  TestValidator.equals("indices", merged.indices?.length, 432_000);
  TestValidator.equals(
    "rebased",
    merged.indices?.at(-1),
    ((indexCount - 1) % (vertices - 1)) + vertices,
  );
  TestValidator.equals("final coordinate", merged.positions.at(-1), 0);
}
