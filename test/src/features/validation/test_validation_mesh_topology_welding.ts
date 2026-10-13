import { validateMeshTopology } from "@automovie/engine";
import { weldMeshVertices } from "@automovie/engine/math/weldMeshVertices";
import type { IAutoMovieMesh, IAutoMovieConstraintViolation } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";
import { throwsError } from "../internal/predicates";

/**
 * Topology identities are current quantized positions, not original vertex IDs.
 *
 * Scenarios:
 * 1. Each possible repeated triangle corner contributes no edge incidence.
 * 2. Separate source vertices inside one nanometre cell share edge identities.
 * 3. Moving those vertices across cells changes the next topology verdict.
 * 4. Boundary diagnostics retain traversal order and lexical coordinate labels.
 * 5. Huge finite coordinates remain distinct on their large axis while ordinary axes still weld by the nanometre grid; malformed tuples refuse instead of becoming origin vertices.
 *
 * @evidence contracts/testing.md#behavioral-verification Runs topology admission on repeated/nearby triangle corners and direct shared welding on huge and malformed tuples; catches merged unrelated vertices while retaining valid seam welding.
 * @evidence contracts/testing.md#independent-expectations Duplicate directed triangles contribute three repeated edges, and distinct finite metre coordinates beyond safe grid integers cannot share a nanometre cell; hand-built ordinary-axis 0.4nm offsets remain in cell zero.
 * @evidence contracts/testing.md#distinguishing-cases Repeated corners, within/across-grid motion, lexical diagnostics, huge positive/negative coordinates, mixed small axes, signed zero, empty tuples, sparse holes, nonfinite values and incomplete XYZ distinguish intended welding from coercion or overflow; explicit physical aliases belong to the physical-vertices suite.
 * @evidence contracts/testing.md#execution-ownership Portable unit test discovered through test_validation_mesh_topology_welding; this export owns all cases and needs neither a native artifact nor renderer/consumer host.
 */
export function test_validation_mesh_topology_welding(): void {
  const mesh: IAutoMovieMesh = {
    positions: [0, 0, 0, 1, 0, 0, 0, 1, 0],
    indices: [],
    normals: null,
    uvs: null,
    skin: null,
  };
  for (const indices of [
    [0, 0, 1],
    [0, 1, 1],
    [0, 1, 0],
  ])
    TestValidator.equals(
      "collapsed corner has no boundary",
      validateMeshTopology({ mesh: { ...mesh, indices }, expectClosed: true }),
      { success: true },
    );
  const duplicated: IAutoMovieMesh = {
    ...mesh,
    positions: [...mesh.positions, 0.4e-9, 0, 0, 1, 0.4e-9, 0, 0, 1, 0.4e-9],
    indices: [0, 1, 2, 3, 4, 5],
  };
  const overlap: ReturnType<typeof validateMeshTopology> = validateMeshTopology({ mesh: duplicated });
  if (overlap.success) throw new Error("Expected duplicate directed edges.");
  TestValidator.equals("three welded edges", overlap.violations.length, 3);
  TestValidator.equals(
    "each direction appears twice",
    overlap.violations.map((item: IAutoMovieConstraintViolation): unknown => item.value),
    [2, 2, 2],
  );
  for (let offset: number = 9; offset < duplicated.positions.length; offset += 3)
    duplicated.positions[offset + 2] += 2e-9;
  TestValidator.equals(
    "positions are reevaluated",
    validateMeshTopology({ mesh: duplicated }),
    { success: true },
  );
  const boundary: ReturnType<typeof validateMeshTopology> = validateMeshTopology({
    mesh: {
      ...mesh,
      positions: [2, 0, 0, -1, 0, 0, 0, 3, 0],
      indices: [0, 1, 2],
    },
    path: "$face",
    expectClosed: true,
  });
  if (boundary.success) throw new Error("Expected three boundary edges.");
  TestValidator.equals(
    "ordered lexical coordinate identities",
    boundary.violations.map((item: IAutoMovieConstraintViolation): unknown => item.value),
    [
      "-1000000000,0,0|2000000000,0,0",
      "-1000000000,0,0|0,3000000000,0",
      "0,3000000000,0|2000000000,0,0",
    ],
  );
  TestValidator.predicate(
    "diagnostic paths retained",
    boundary.violations.every((item: IAutoMovieConstraintViolation): boolean => item.path === "$face.indices"),
  );
  TestValidator.equals("large coordinate identity preserves small-axis welding", weldMeshVertices([
    1e308, 0, 0, 1e308, 0.4e-9, 0, 1.1e308, 0, 0,
    -1e308, 0, 0, -1.1e308, 0, 0,
  ]).vertices, [0, 0, 1, 2, 3]);
  TestValidator.equals("signed zero shares one cell", weldMeshVertices([0, -0, 0, -0, 0, -0]).vertices, [0, 0]);
  TestValidator.equals("empty input remains empty", weldMeshVertices([]), { labels: [], vertices: [] });
  for (const invalid of [[0, 0], new Array<number>(3), [Number.NaN, 0, 0], [Number.POSITIVE_INFINITY, 0, 0]])
    TestValidator.predicate("malformed XYZ never becomes origin", throwsError((): ReturnType<typeof weldMeshVertices> => weldMeshVertices(invalid), "complete finite XYZ tuples"));
}
