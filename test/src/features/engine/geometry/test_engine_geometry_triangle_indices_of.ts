import { AutoMovieEngineGeometry } from "@automovie/engine";
import type { IAutoMovieMesh } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../internal/throwsError";

/**
 * `triangleIndicesOf(mesh, label)` returns a mesh's triangle index run (its own
 * array, or 0, 1, 2, ... when it has none), refusing a run it cannot read.
 *
 * Scenarios:
 *
 * 1. Nine positions without indices read as [0, 1, 2].
 * 2. Given indices are returned as the same array.
 * 3. Four coordinates ("whole xyz triples"), two indices ("in threes"), index 3 of
 *    three vertices, index -1 and a sparse run ("does not carry") are refused
 *    under the label.
 */
export function test_engine_geometry_triangle_indices_of(): void {
  const mesh: IAutoMovieMesh = {
    positions: [0, 0, 0, 1, 0, 0, 0, 1, 0],
    indices: null,
    normals: null,
    uvs: null,
    skin: null,
  };

  // 1.
  TestValidator.equals("implicit", AutoMovieEngineGeometry.triangleIndicesOf(mesh, "probe"), [0, 1, 2]);

  // 2.
  const indices: number[] = [2, 1, 0];
  TestValidator.predicate(
    "own array",
    AutoMovieEngineGeometry.triangleIndicesOf({ ...mesh, indices }, "probe") === indices,
  );

  // 3.
  for (const [label, bad, message] of [
    [
      "coordinates",
      { ...mesh, positions: [0, 0, 0, 1] },
      "probe needs positions in whole xyz triples",
    ],
    [
      "two indices",
      { ...mesh, indices: [0, 1] },
      "probe needs triangle indices in threes",
    ],
    [
      "index 3",
      { ...mesh, indices: [0, 1, 3] },
      "probe indexes a vertex the mesh does not carry",
    ],
    [
      "index -1",
      { ...mesh, indices: [0, 1, -1] },
      "probe indexes a vertex the mesh does not carry",
    ],
    [
      "sparse",
      { ...mesh, indices: new Array<number>(3) },
      "probe indexes a vertex the mesh does not carry",
    ],
  ] satisfies [string, IAutoMovieMesh, string][])
    TestValidator.predicate(
      label,
      throwsError((): unknown => AutoMovieEngineGeometry.triangleIndicesOf(bad, "probe"), message),
    );
}
