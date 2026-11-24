import { createMeshEdgeKey } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../../internal/predicates";

/**
 * `createMeshEdgeKey` encodes an ordered vertex pair injectively.
 *
 * Scenarios:
 *
 * 1. A population of 10 gives from * 10 + to: (2, 3) is 23 and (0, 0) is 0.
 * 2. A population of 2^27 squares past the safe integers and keys the pair as
 *    `from/to`.
 * 3. A negative population is refused.
 */
export function test_unit_engine_math_create_mesh_edge_key(): void {
  const small = createMeshEdgeKey(10);
  TestValidator.equals("pair", small(2, 3), 23);
  TestValidator.equals("reverse differs", small(3, 2), 32);
  TestValidator.equals("zero", small(0, 0), 0);
  TestValidator.equals("large", createMeshEdgeKey(2 ** 27)(1, 2), "1/2");
  TestValidator.predicate(
    "negative",
    throwsError(() => createMeshEdgeKey(-1)),
  );
}
