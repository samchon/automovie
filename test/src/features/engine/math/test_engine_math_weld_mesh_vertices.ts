import { AutoMovieEngineMath } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../internal/predicates";

/**
 * `weldMeshVertices` interns equal grid-indexed XYZ tuples in first-occurrence
 * order.
 *
 * Scenarios:
 *
 * 1. Tuples A, A, B give vertex ids 0, 0, 1 and two labels.
 * 2. A tuple 1e-10 from A welds to A; one 1e-6 from A does not.
 * 3. The largest finite coordinates retain exact identity.
 * 4. Partial, sparse and nonfinite tuples are refused.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Covers grid identity in first-occurrence order and refusal of partial, sparse or nonfinite XYZ buffers.
 * @evidence contracts/development/testing.md#behavioral-verification Calls weldMeshVertices directly with duplicate, same-bin and separate-bin points. The same entry exercises malformed flat buffers.
 * @evidence contracts/development/testing.md#independent-expectations Duplicate origin tuples and the 0.1-nanometre offset occupy the same grid bin. A micrometre offset is in a different bin. A hole, nonfinite coordinate or partial tuple cannot represent a finite grid point.
 */
export function test_engine_math_weld_mesh_vertices(): void {
  const same = AutoMovieEngineMath.weldMeshVertices([0, 0, 0, 0, 0, 0, 1, 0, 0]);
  TestValidator.equals("ids", same.vertices, [0, 0, 1]);
  TestValidator.equals("labels", same.labels.length, 2);
  TestValidator.equals(
    "in the same grid bin",
    AutoMovieEngineMath.weldMeshVertices([0, 0, 0, 1e-10, 0, 0]).vertices,
    [0, 0],
  );
  TestValidator.equals(
    "in a distinct grid bin",
    AutoMovieEngineMath.weldMeshVertices([0, 0, 0, 1e-6, 0, 0]).vertices,
    [0, 1],
  );
  const maximum: number = Number.MAX_VALUE;
  TestValidator.equals(
    "finite coordinates beyond the numeric grid retain exact identity",
    AutoMovieEngineMath.weldMeshVertices([
      maximum, 0, 0,
      maximum, 0, 0,
      -maximum, 0, 0,
    ]).vertices,
    [0, 0, 1],
  );
  for (const positions of [
    [0, 0, 0, 1],
    new Array<number>(1).concat(0, 0),
    [NaN, 0, 0],
    [0, Infinity, 0],
    [0, 0, -Infinity],
  ])
    TestValidator.predicate(
      "invalid XYZ tuples are refused",
      throwsError(
        () => AutoMovieEngineMath.weldMeshVertices(positions),
        "complete finite XYZ tuples",
      ),
    );
}
