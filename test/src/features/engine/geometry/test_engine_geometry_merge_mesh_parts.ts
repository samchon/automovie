import { AutoMovieEngineGeometry } from "@automovie/engine";
import type {
  IAutoMovieMesh,
  IAutoMovieMeshAssembly,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../internal/throwsError";

/**
 * `mergeMeshParts(parts)` places each member by its transform, merges
 * them, and reports each member's range of the merged index buffer (an
 * unindexed member counting one index per vertex).
 *
 * Fixture: the unit right triangle with +z normals, indexed as "tread" and
 * unindexed as "riser" lifted 2 m in z.
 *
 * Scenarios:
 *
 * 1. Groups tread {0, 3} and riser {3, 3}; six merged vertices, the riser's at z =
 *    2; the parts are unchanged.
 * 2. A repeated id ("mesh part id "tread" must be unique") and a member with two
 *    indices ("mesh part "riser" needs triangle indices in threes") are
 *    refused.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names rigid placement, index ranges for indexed and implicit members, source preservation and malformed members.
 * @evidence contracts/development/testing.md#behavioral-verification Merges a positioned indexed triangle and implicit triangle and compares resulting positions, group ranges and input values.
 * @evidence contracts/development/testing.md#independent-expectations Each triangle contributes exactly three indices. The second starts at 3 and its z coordinate is 2 because of its written transform.
 */
export function test_engine_geometry_merge_mesh_parts(): void {
  const triangle = (indices: number[] | null): IAutoMovieMesh => ({
    positions: [0, 0, 0, 1, 0, 0, 0, 1, 0],
    indices,
    normals: [0, 0, 1, 0, 0, 1, 0, 0, 1],
    uvs: null,
    skin: null,
  });
  const lift = { translation: { x: 0, y: 0, z: 2 } };

  // 1.
  const parts = [
    { id: "tread", mesh: triangle([0, 1, 2]) },
    { id: "riser", mesh: triangle(null), transform: lift },
  ];
  const before: string = JSON.stringify(parts);
  const merged: IAutoMovieMeshAssembly = AutoMovieEngineGeometry.mergeMeshParts(parts);
  TestValidator.equals("groups", merged.groups, [
    { id: "tread", start: 0, count: 3 },
    { id: "riser", start: 3, count: 3 },
  ]);
  TestValidator.equals(
    "positions",
    merged.mesh.positions,
    [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 2, 1, 0, 2, 0, 1, 2],
  );
  TestValidator.equals("parts kept", JSON.stringify(parts), before);

  // 2.
  TestValidator.predicate(
    "repeated id",
    throwsError(
      (): unknown =>
        AutoMovieEngineGeometry.mergeMeshParts([
          parts[0]!,
          { id: "tread", mesh: triangle(null) },
        ]),
      'mesh part id "tread" must be unique',
    ),
  );
  TestValidator.predicate(
    "malformed",
    throwsError(
      (): unknown =>
        AutoMovieEngineGeometry.mergeMeshParts([
          parts[0]!,
          { id: "riser", mesh: triangle([0, 1]) },
        ]),
      'mesh part "riser" needs triangle indices in threes',
    ),
  );
}
