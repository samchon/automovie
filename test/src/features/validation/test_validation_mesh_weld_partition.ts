import { createMeshWeldPartitionMatcher } from "@automovie/engine/math/createMeshWeldPartitionMatcher";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../internal/predicates";

/**
 * Topology reuse needs the same vertex equivalence classes, not the same coordinates.
 *
 * Scenarios:
 * 1. Translation, reflection and sub-grid motion retain the captured partition.
 * 2. Both a split and a merge change it; crossing the quantization boundary is detectable.
 * 3. Source mutation cannot rewrite the expectation, and malformed/absent numbers refuse.
 * 4. Empty populations match each other without implying a valid nonempty mesh.
 */
export const test_validation_mesh_weld_partition = (): void => {
  const source = [0, 0, 0, 1, 0, 0, 0, 0, 0];
  const matches = createMeshWeldPartitionMatcher(source);
  for (const x of [3, -4])
    TestValidator.equals(
      "absolute positions do not own incidence",
      matches([x, 0, 0, x + 1, 0, 0, x, 0, 0]),
      true,
    );
  for (const x of [-0.49e-9, 0, 0.49e-9])
    TestValidator.equals(
      "same quantized cell",
      matches([0, 0, 0, 1, 0, 0, x, 0, 0]),
      true,
    );
  for (const x of [-0.51e-9, 0.51e-9])
    TestValidator.equals(
      "a former duplicate splits",
      matches([0, 0, 0, 1, 0, 0, x, 0, 0]),
      false,
    );
  TestValidator.equals(
    "new coincidence merges classes",
    matches([0, 0, 0, 0, 0, 0, 0, 0, 0]),
    false,
  );
  source.fill(0);
  TestValidator.equals(
    "capture owns its expectation",
    matches([0, 0, 0, 1, 0, 0, 0, 0, 0]),
    true,
  );
  TestValidator.equals("different population", matches([0, 0, 0]), false);
  for (const value of [Infinity, NaN]) {
    TestValidator.equals(
      "nonfinite candidate",
      matches([0, 0, 0, 1, 0, 0, value, 0, 0]),
      false,
    );
    TestValidator.predicate(
      "nonfinite origin",
      throwsError(() => createMeshWeldPartitionMatcher([value, 0, 0])),
    );
  }
  TestValidator.predicate(
    "incomplete XYZ origin",
    throwsError(() => createMeshWeldPartitionMatcher([0, 0])),
  );
  TestValidator.predicate(
    "holes are not finite coordinates",
    throwsError(() => createMeshWeldPartitionMatcher(new Array<number>(3))),
  );
  TestValidator.equals(
    "empty partition",
    createMeshWeldPartitionMatcher([])([]),
    true,
  );
};
