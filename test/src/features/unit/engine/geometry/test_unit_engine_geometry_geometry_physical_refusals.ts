import {
  resolveAutoMovieMeshPhysicalVertices,
  validateMeshTopology,
} from "@automovie/engine";
import {
  type IAutoMovieConstraintViolation,
  type IAutoMovieMesh,
  type IAutoMovieValidation,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { createPhysicalMesh } from "../../../internal/createPhysicalMesh";

/**
 * Invalid source correspondence is an explicit refusal, never legacy fallback.
 * Scenarios:
 *
 * 1. Dense cardinality, source shape/domain/ID and resident references are armed.
 * 2. Nonfinite or incomplete coordinates and separated source aliases refuse.
 * 3. The adjacent valid triangle passes every corresponding input boundary.
 * 4. Model-style topology collection names physicalVertices even on an empty mesh.
 */
export function test_unit_engine_geometry_geometry_physical_refusals(): void {
  const valid: () => IAutoMovieMesh = (): IAutoMovieMesh =>
    createPhysicalMesh([0, 0, 0, 1, 0, 0, 0, 1, 0], [0, 1, 2], [0, 1, 2]);
  const refuses: (mesh: IAutoMovieMesh) => boolean = (
    mesh: IAutoMovieMesh,
  ): boolean => {
    try {
      resolveAutoMovieMeshPhysicalVertices(mesh);
      return false;
    } catch (error) {
      return (
        error instanceof Error && error.message.includes("physicalVertices")
      );
    }
  };
  const invalid: IAutoMovieMesh[] = [];
  const add: (edit: (mesh: IAutoMovieMesh) => void) => void = (
    edit: (mesh: IAutoMovieMesh) => void,
  ): void => {
    const mesh: IAutoMovieMesh = valid();
    edit(mesh);
    invalid.push(mesh);
  };
  add((mesh: IAutoMovieMesh): void => {
    mesh.positions.pop();
  });

  add((mesh: IAutoMovieMesh): void => {
    mesh.physicalVertices!.vertices.pop();
  });
  for (const id of [-1, Number.MAX_SAFE_INTEGER + 1])
    add((mesh: IAutoMovieMesh): void => {
      mesh.physicalVertices!.sources[0].id = id;
    });
  for (const reference of [-1, 3])
    add((mesh: IAutoMovieMesh): void => {
      mesh.physicalVertices!.vertices[0] = reference;
    });
  add((mesh: IAutoMovieMesh): void => {
    mesh.physicalVertices!.vertices[1] = 0;
  });

  for (const mesh of invalid) {
    TestValidator.predicate("named refusal", refuses(mesh));
    const result: IAutoMovieValidation = validateMeshTopology({
      mesh,
      path: "$model.parts[0].mesh",
    });
    TestValidator.predicate(
      "collector names correspondence",
      !result.success &&
        result.violations.some(
          (fault: IAutoMovieConstraintViolation): boolean =>
            fault.path === "$model.parts[0].mesh.physicalVertices",
        ),
    );
    TestValidator.equals(
      "adjacent valid triangle",
      validateMeshTopology({ mesh: valid() }),
      { success: true },
    );
  }
  TestValidator.equals(
    "valid correspondence does not refuse",
    refuses(valid()),
    false,
  );
  const empty: IAutoMovieMesh = createPhysicalMesh([], [], []);
  empty.physicalVertices!.vertices.push(0);
  TestValidator.equals(
    "empty still refuses metadata",
    validateMeshTopology({ mesh: empty }).success,
    false,
  );
  const sameCell: IAutoMovieMesh = createPhysicalMesh(
    [0, 0, 0, 0.49e-9, 0, 0],
    [],
    [0, 0],
  );
  TestValidator.equals(
    "alias inside existing cell",
    resolveAutoMovieMeshPhysicalVertices(sameCell).vertices,
    [0, 0],
  );
  sameCell.positions[3] = 0.51e-9;
  TestValidator.predicate("alias crosses existing grid", refuses(sameCell));
}
