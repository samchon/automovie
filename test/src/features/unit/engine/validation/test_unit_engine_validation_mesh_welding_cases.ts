import { validateMeshTopology, weldMeshVertices } from "@automovie/engine";
import type {
  IAutoMovieConstraintViolation,
  IAutoMovieMesh,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../../internal/predicates";

/**
 * Topology identities are current quantized positions, not original vertex IDs.
 *
 * Scenarios:
 *
 * 1. Each possible repeated triangle corner contributes no edge incidence.
 * 2. Separate source vertices inside one nanometre cell share edge identities.
 * 3. Moving those vertices across cells changes the next topology verdict.
 * 4. Boundary diagnostics retain traversal order and lexical coordinate labels.
 * 5. Huge finite coordinates remain distinct on their large axis while ordinary
 *    axes still weld by the nanometre grid; malformed tuples refuse instead of
 *    becoming origin vertices.
 */
export function test_unit_engine_validation_mesh_welding_cases(): void {
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
  const overlap: ReturnType<typeof validateMeshTopology> = validateMeshTopology(
    { mesh: duplicated },
  );
  if (overlap.success) throw new Error("Expected duplicate directed edges.");
  TestValidator.equals("three welded edges", overlap.violations.length, 3);
  TestValidator.equals(
    "each direction appears twice",
    overlap.violations.map(
      (item: IAutoMovieConstraintViolation): unknown => item.value,
    ),
    [2, 2, 2],
  );
  for (
    let offset: number = 9;
    offset < duplicated.positions.length;
    offset += 3
  )
    duplicated.positions[offset + 2] += 2e-9;
  TestValidator.equals(
    "positions are reevaluated",
    validateMeshTopology({ mesh: duplicated }),
    { success: true },
  );
  const boundary: ReturnType<typeof validateMeshTopology> =
    validateMeshTopology({
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
    boundary.violations.map(
      (item: IAutoMovieConstraintViolation): unknown => item.value,
    ),
    [
      "-1000000000,0,0|2000000000,0,0",
      "-1000000000,0,0|0,3000000000,0",
      "0,3000000000,0|2000000000,0,0",
    ],
  );
  TestValidator.predicate(
    "diagnostic paths retained",
    boundary.violations.every(
      (item: IAutoMovieConstraintViolation): boolean =>
        item.path === "$face.indices",
    ),
  );
  TestValidator.equals(
    "large coordinate identity preserves small-axis welding",
    weldMeshVertices([
      1e308, 0, 0, 1e308, 0.4e-9, 0, 1.1e308, 0, 0, -1e308, 0, 0, -1.1e308, 0,
      0,
    ]).vertices,
    [0, 0, 1, 2, 3],
  );
  TestValidator.equals(
    "signed zero shares one cell",
    weldMeshVertices([0, -0, 0, -0, 0, -0]).vertices,
    [0, 0],
  );
  TestValidator.equals("empty input remains empty", weldMeshVertices([]), {
    labels: [],
    vertices: [],
  });
  for (const invalid of [[0, 0]])
    TestValidator.predicate(
      "malformed XYZ never becomes origin",
      throwsError(
        (): ReturnType<typeof weldMeshVertices> => weldMeshVertices(invalid),
        "complete finite XYZ tuples",
      ),
    );
}
