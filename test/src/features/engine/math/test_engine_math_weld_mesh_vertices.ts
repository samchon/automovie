import { AutoMovieEngineMath } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../internal/predicates";

/**
 * `weldMeshVertices` interns XYZ tuples within one nanometre in
 * first-occurrence order.
 *
 * Scenarios:
 *
 * 1. Tuples A, A, B give vertex ids 0, 0, 1 and two labels.
 * 2. A tuple 1e-10 from A welds to A; one 1e-6 from A does not.
 * 3. A position list that is not whole tuples is refused.
 */
export function test_engine_math_weld_mesh_vertices(): void {
  const same = AutoMovieEngineMath.weldMeshVertices([0, 0, 0, 0, 0, 0, 1, 0, 0]);
  TestValidator.equals("ids", same.vertices, [0, 0, 1]);
  TestValidator.equals("labels", same.labels.length, 2);
  TestValidator.equals(
    "within a nanometre",
    AutoMovieEngineMath.weldMeshVertices([0, 0, 0, 1e-10, 0, 0]).vertices,
    [0, 0],
  );
  TestValidator.equals(
    "beyond a nanometre",
    AutoMovieEngineMath.weldMeshVertices([0, 0, 0, 1e-6, 0, 0]).vertices,
    [0, 1],
  );
  TestValidator.predicate(
    "incomplete",
    throwsError(() => AutoMovieEngineMath.weldMeshVertices([0, 0, 0, 1])),
  );
}
