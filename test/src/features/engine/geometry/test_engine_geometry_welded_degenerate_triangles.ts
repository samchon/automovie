import { AutoMovieEngineGeometry } from "@automovie/engine";
import type { IAutoMovieMesh } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../internal/throwsError";

/**
 * `weldedDegenerateTriangles(mesh)` lists, ascending, the triangles two of
 * whose corners fall in one cell of the nanometre weld grid, by index or by
 * position.
 *
 * Fixture: vertices 0 (0,0,0), 1 (1,0,0), 2 (0,1,0) and 3, a second vertex at
 * (1, 0, 0).
 *
 * Scenarios:
 *
 * 1. Triangles (0,1,2), (0,0,2), (1,3,2) and (2,1,0): [1, 2], repeating an index
 *    and a welded position respectively.
 * 2. An index past the vertices ("does not carry") is refused.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names repeated index and coincident-position weld degeneracy, retained ordinals and invalid index rejection.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the actual welded mesh diagnostic on a four-vertex explicit index run and on a broken address.
 * @evidence contracts/development/testing.md#independent-expectations The second and third triangles each have two corners in one grid cell, once by duplicate index and once by equal positions. Reversing a nondegenerate face does not duplicate a corner.
 */
export function test_engine_geometry_welded_degenerate_triangles(): void {
  const mesh: IAutoMovieMesh = {
    positions: [0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0],
    indices: [0, 1, 2, 0, 0, 2, 1, 3, 2, 2, 1, 0],
    normals: null,
    uvs: null,
    skin: null,
  };

  // 1.
  TestValidator.equals("degenerate", AutoMovieEngineGeometry.weldedDegenerateTriangles(mesh), [1, 2]);

  // 2.
  TestValidator.predicate(
    "index",
    throwsError(
      (): unknown => AutoMovieEngineGeometry.weldedDegenerateTriangles({ ...mesh, indices: [0, 1, 4] }),
      "does not carry",
    ),
  );
}
