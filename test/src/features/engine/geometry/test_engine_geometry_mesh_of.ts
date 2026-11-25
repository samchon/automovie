import { meshOf } from "@automovie/engine";
import type { IAutoMovieMesh } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * `meshOf(positions, indices, uvs?, normalGroups?)` adopts a builder's arrays
 * as a rigid mesh whose vertex normals are the normalized sums of incident
 * unnormalized face normals, pooled across declared seam groups.
 *
 * Fixture: triangle A (0,0,0), (2,0,0), (0,2,0) with face normal (0, 0, 4);
 * triangle B on its own copy of the origin (vertex 5), (0,0,1), (1,0,0), with
 * face normal (0, 1, 0); vertex 6 used by no triangle.
 *
 * Scenarios:
 *
 * 1. Without groups, A's vertices face +z, B's +y, vertex 6 keeps (0, 0, 0); the
 *    arrays are adopted, UVs null, skin null.
 * 2. Grouping vertices 0 and 5 gives both (0, 1, 4) / sqrt 17, the larger face
 *    weighing more; the other vertices keep their own normals.
 */
export function test_engine_geometry_mesh_of(): void {
  const positions = (): number[] => [
    0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 9, 9, 9,
  ];
  const indices: number[] = [0, 1, 2, 5, 3, 4];

  // 1.
  const own: number[] = positions();
  const plain: IAutoMovieMesh = meshOf(own, indices);
  TestValidator.equals(
    "normals",
    plain.normals,
    [0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0],
  );
  TestValidator.predicate(
    "adopted",
    plain.positions === own && plain.indices === indices,
  );
  TestValidator.equals("attributes", [plain.uvs, plain.skin], [null, null]);

  // 2.
  const pooled: number[] = meshOf(positions(), indices, null, [
    [0, 5],
  ]).normals!;
  const n: number = Math.sqrt(17);
  for (const v of [0, 5])
    TestValidator.predicate(
      `pooled ${v}`,
      Math.abs(pooled[3 * v]!) <= 1e-15 &&
        Math.abs(pooled[3 * v + 1]! - 1 / n) <= 1e-15 &&
        Math.abs(pooled[3 * v + 2]! - 4 / n) <= 1e-15,
    );
  TestValidator.equals(
    "others",
    [pooled.slice(3, 9), pooled.slice(9, 15)],
    [plain.normals!.slice(3, 9), plain.normals!.slice(9, 15)],
  );
}
