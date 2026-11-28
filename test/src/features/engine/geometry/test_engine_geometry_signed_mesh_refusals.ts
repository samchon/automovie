import { AutoMovieEngineGeometry } from "@automovie/engine";
import type {
  IAutoMovieMesh,
  IAutoMovieSignedMeshQueryHit,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { createSignedOctahedron } from "../../internal/createSignedMeshFixture";
import { throwsError } from "../../internal/predicates";

/**
 * `createSignedMeshQuery` refuses a surface it cannot measure, and a
 * query that is not an xyz point, instead of returning a misleading distance.
 *
 * Scenarios:
 *
 * 1. An octahedron with no positions and no indices, with a single position
 *    component, with two indices, with an index 99 beyond the vertices, with
 *    the triangle (0,0,0) collapsed, with two coincident opposed triangles on
 *    one base, and with a sliver whose third vertex is 1e-12 off the edge, is
 *    refused with a message naming "Signed".
 * 2. The octahedron scaled by 1e100 and by 1e200, whose squares overflow, is
 *    refused likewise.
 * 3. Malformed query length, a nonfinite coordinate and finite distance
 *    arithmetic overflow are refused.
 * 4. A nonfinite unused vertex and a misspelled boundary mode are rejected.
 *    Omitting the mode gives the same result as explicit closed mode.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names invalid topology, unusable numerical scales, malformed points and admitted boundary modes.
 * @evidence contracts/development/testing.md#behavioral-verification Creates queries on empty, collapsed, opposed, sliver and extreme inputs, then exercises point cardinality and overflow failures.
 * @evidence contracts/development/testing.md#independent-expectations A signed distance needs complete oriented triangles and a finite XYZ query. The named scale products cannot produce representable distances for those cases.
 */
export function test_engine_geometry_signed_mesh_refusals(): void {
  const source: IAutoMovieMesh = createSignedOctahedron();
  const invalid: IAutoMovieMesh[] = [
    { ...source, positions: [], indices: [] },
    { ...source, positions: [0] },
    { ...source, positions: [...source.positions, NaN, 0, 0] },
    { ...source, indices: [0, 1] },
    { ...source, indices: [0, 1, 99] },
    { ...source, indices: [0, 0, 0] },
    {
      ...source,
      positions: [0, 0, 0, 1, 0, 0, 0, 1, 0],
      indices: [0, 1, 2, 0, 2, 1],
    },
    {
      ...source,
      positions: [0, 0, 0, 1, 0, 0, 1, 1e-12, 0],
      indices: [0, 1, 2],
    },
    {
      ...source,
      positions: source.positions.map((v: number): number => v * 1e100),
    },
    {
      ...source,
      positions: source.positions.map((v: number): number => v * 1e200),
    },
  ];
  invalid.forEach((mesh: IAutoMovieMesh, index: number): void => {
    TestValidator.predicate(
      `surface ${index}`,
      throwsError(() => AutoMovieEngineGeometry.createSignedMeshQuery(mesh), ["Signed"]),
    );
  });
  const sample: (point: readonly number[]) => IAutoMovieSignedMeshQueryHit =
    AutoMovieEngineGeometry.createSignedMeshQuery(source);
  const closed = AutoMovieEngineGeometry.createSignedMeshQuery(source, { boundary: "closed" });
  TestValidator.equals("default and explicit closed", sample([0, 0, 0]), closed([0, 0, 0]));
  TestValidator.predicate(
    "unknown boundary mode",
    throwsError(
      () => AutoMovieEngineGeometry.createSignedMeshQuery(source, { boundary: "typo" as unknown as "open" }),
      "boundary mode closed or open",
    ),
  );
  const queries: number[][] = [
    [], [0, 0], [0, 0, 0, 0], [1e308, 0, 0], [NaN, 0, 0], [0, Infinity, 0],
    new Array<number>(3),
  ];
  queries.forEach((point: number[], index: number): void => {
    TestValidator.predicate(
      `query ${index}`,
      throwsError(() => sample(point), ["Signed mesh"]),
    );
  });
}
