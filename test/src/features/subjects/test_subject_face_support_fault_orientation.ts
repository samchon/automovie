import { TestValidator } from "@nestia/e2e";

import { faceSupportFaultTriangles } from "../../../scripts/face-review/faceSupportFaultTriangles";
import { faceSupportFaults } from "../../../scripts/face-review/faceSupportFaults";

/**
 * Count and triangle reports share the same source-relative orientation rule.
 * A unit triangle in XY has its normal along +Z. Reflecting its last vertex
 * across X points that normal along -Z; moving it into XZ makes it orthogonal.
 * A single triangle has no nonadjacent intersection pair.
 *
 * Scenarios:
 * 1. The reflected triangle is one orientation fault and its offset is zero.
 * 2. An unchanged triangle and the exact orthogonal boundary are not reversals.
 * 3. An empty selected support reports no orientation or intersection fault.
 */
export const test_subject_face_support_fault_orientation = (): void => {
  const source = [0, 0, 0, 1, 0, 0, 0, 1, 0];
  const input = { source, indices: [0, 1, 2], triangles: [0] };
  const reversed = { ...input, positions: [0, 0, 0, 1, 0, 0, 0, -1, 0] };
  TestValidator.equals("reversal count", faceSupportFaults(reversed), 1);
  TestValidator.equals(
    "reversal identity",
    [...faceSupportFaultTriangles(reversed)],
    [0],
  );
  for (const positions of [source, [0, 0, 0, 1, 0, 0, 0, 0, 1]]) {
    const state = { ...input, positions };
    TestValidator.equals(
      "no reversal at or before boundary",
      faceSupportFaults(state),
      0,
    );
    TestValidator.equals(
      "no reversed triangles",
      [...faceSupportFaultTriangles(state)],
      [],
    );
  }
  const empty = { ...reversed, triangles: [] };
  TestValidator.equals("empty support count", faceSupportFaults(empty), 0);
  TestValidator.equals(
    "empty support identities",
    [...faceSupportFaultTriangles(empty)],
    [],
  );
};
