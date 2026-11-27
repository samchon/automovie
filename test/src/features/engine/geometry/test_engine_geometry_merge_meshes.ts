import { AutoMovieEngineGeometry } from "@automovie/engine";
import type { IAutoMovieMesh } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../internal/predicates";

/**
 * `mergeMeshes` concatenates meshes, rebasing each member's indices by
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
 * 4. A 2 x 2 x 0.2 wall merged with an unindexed UV triangle rebases the
 *    triangle to the wall's vertex count plus 2 and drops normals and UVs (not
 *    common); two triangles with normals keep 12 UV and 18 normal components;
 *    no member merges to nothing.
 * 5. A skinned member, an index past its member's own vertices and normals short
 *    of their vertices are refused by their own diagnostics.
 */
export function test_engine_geometry_merge_meshes(): void {
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
  const merged: IAutoMovieMesh = AutoMovieEngineGeometry.mergeMeshes([dense, dense]);
  TestValidator.equals("positions", merged.positions.length, 288_024);
  TestValidator.equals("indices", merged.indices?.length, 432_000);
  TestValidator.equals(
    "rebased",
    merged.indices?.at(-1),
    ((indexCount - 1) % (vertices - 1)) + vertices,
  );
  TestValidator.equals("final coordinate", merged.positions.at(-1), 0);

  // 4.
  const wall: IAutoMovieMesh = AutoMovieEngineGeometry.buildWall({ width: 2, height: 2, depth: 0.2, openings: [] });
  const loose: IAutoMovieMesh = {
    positions: [0, 0, 0, 1, 0, 0, 0, 1, 0],
    normals: null,
    uvs: [0, 0, 1, 0, 0, 1],
    indices: null,
    skin: null,
  };
  const mixed: IAutoMovieMesh = AutoMovieEngineGeometry.mergeMeshes([wall, loose]);
  TestValidator.equals("unindexed rebased", mixed.indices!.at(-1), wall.positions.length / 3 + 2);
  TestValidator.equals("uncommon attributes dropped", [mixed.normals, mixed.uvs], [null, null]);
  const normals: number[] = [0, 0, 1, 0, 0, 1, 0, 0, 1];
  const common: IAutoMovieMesh = AutoMovieEngineGeometry.mergeMeshes([
    { ...loose, normals },
    { ...loose, normals },
  ]);
  TestValidator.equals("common attributes kept", [common.uvs?.length, common.normals?.length], [12, 18]);
  TestValidator.equals("empty", AutoMovieEngineGeometry.mergeMeshes([]).positions.length, 0);

  // 5.
  for (const [label, meshes, message] of [
    [
      "skinned",
      [{ ...loose, skin: { joints: [], boneIndices: [], weights: [] } }],
      "procedural rigid-mesh merge does not accept skinning",
    ],
    [
      "index past its own vertices",
      [{ ...loose, indices: [0, 1, 3] }, loose],
      "mesh merge member[0] indexes a vertex the mesh does not carry",
    ],
    [
      "short normals",
      [loose, { ...loose, normals: [0, 0, 1, 0, 0, 1] }],
      "mesh merge member[1] needs one normal per vertex",
    ],
  ] satisfies [string, IAutoMovieMesh[], string][])
    TestValidator.predicate(label, throwsError((): unknown => AutoMovieEngineGeometry.mergeMeshes(meshes), message));
}
