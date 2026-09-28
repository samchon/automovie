import { weldMeshVertices } from "./weldMeshVertices";

/**
 * Capture a point population's welded equivalence classes, independently of its
 * absolute positions. A match with unchanged triangle indices has exactly the
 * same edge incidence and winding as the captured mesh. It can reuse an earlier
 * successful topology admission; a mismatch must take the ordinary validator.
 *
 * This is not a topology validator itself. Even an empty or non-manifold mesh
 * can retain its partition. Callers must admit the initial mesh and keep its
 * connectivity fixed. Finite XYZ/cardinality are checked for both populations;
 * source mutation cannot change the captured classes.
 *
 * @evidence requirements/asset-authoring/validation.md#asset-geometry-validation Detects both splitting and merging of welded identities before reusing a topology verdict.
 * @evidence specifications/asset-and-representation/fidelity-and-validation.md#asset-spec-validation-numeric-structure Reuses only an unchanged finite vertex equivalence partition, with one shared quantization owner.
 */
export function createMeshWeldPartitionMatcher(positions: readonly number[]) {
  const finite = (values: readonly number[]): boolean => {
    for (const value of values) if (!Number.isFinite(value)) return false;
    return true;
  };
  if (positions.length % 3 !== 0 || !finite(positions))
    throw new Error("A mesh weld partition needs finite XYZ tuples.");
  const length = positions.length;
  const expected = weldMeshVertices(positions).vertices;
  return (candidate: readonly number[]): boolean => {
    if (candidate.length !== length || !finite(candidate)) return false;
    const actual = weldMeshVertices(candidate).vertices;
    return actual.every((id, index) => id === expected[index]);
  };
}
