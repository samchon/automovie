import { validateMeshTopology } from "@automovie/engine";
import { resolveAutoMovieMeshPhysicalVertices } from "@automovie/engine/math/resolveAutoMovieMeshPhysicalVertices";
import type {
  IAutoMovieMesh,
  IAutoMovieMeshPhysicalSource,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { createPhysicalMesh } from "../internal/createPhysicalMesh";

/**
 * Invalid source correspondence is an explicit refusal, never legacy fallback.
 * Scenarios:
 * 1. Dense cardinality, source shape/domain/ID and resident references are armed.
 * 2. Nonfinite or incomplete coordinates and separated source aliases refuse.
 * 3. The adjacent valid triangle passes every corresponding input boundary.
 * 4. Model-style topology collection names physicalVertices even on an empty mesh.
 */
export const test_geometry_physical_refusals = (): void => {
  const valid = () =>
    createPhysicalMesh([0, 0, 0, 1, 0, 0, 0, 1, 0], [0, 1, 2], [0, 1, 2]);
  const refuses = (mesh: IAutoMovieMesh): boolean => {
    try {
      resolveAutoMovieMeshPhysicalVertices(mesh);
      return false;
    } catch (error) {
      return String(error).includes("physicalVertices");
    }
  };
  const invalid: IAutoMovieMesh[] = [];
  const add = (edit: (mesh: IAutoMovieMesh) => void) => {
    const mesh = valid();
    edit(mesh);
    invalid.push(mesh);
  };
  add((mesh) => {
    mesh.positions.pop();
  });
  for (const value of [NaN, Infinity])
    add((mesh) => {
      mesh.positions[0] = value;
    });
  add((mesh) => {
    mesh.positions = new Array<number>(9);
  });
  add((mesh) => {
    mesh.physicalVertices!.vertices.pop();
  });
  add((mesh) => {
    mesh.physicalVertices!.vertices = new Array<number | null>(3);
  });
  add((mesh) => {
    mesh.physicalVertices!.sources = new Array<IAutoMovieMeshPhysicalSource>(3);
  });
  for (const id of [-1, 0.5, Number.MAX_SAFE_INTEGER + 1, NaN])
    add((mesh) => {
      mesh.physicalVertices!.sources[0].id = id;
    });
  for (const domain of ["", " \t"])
    add((mesh) => {
      mesh.physicalVertices!.sources[0].domain = domain;
    });
  for (const reference of [-1, 0.5, 3, NaN])
    add((mesh) => {
      mesh.physicalVertices!.vertices[0] = reference;
    });
  add((mesh) => {
    mesh.physicalVertices!.vertices[1] = 0;
  });
  for (const metadata of [
    null,
    {},
    { sources: null, vertices: [] },
    { sources: [], vertices: null },
  ])
    add((mesh) => {
      mesh.physicalVertices =
        metadata as unknown as IAutoMovieMesh["physicalVertices"];
    });
  for (const source of [null, { domain: 1, id: 0 }])
    add((mesh) => {
      mesh.physicalVertices!.sources[0] =
        source as unknown as IAutoMovieMeshPhysicalSource;
    });
  for (const mesh of invalid) {
    TestValidator.predicate("named refusal", refuses(mesh));
    const result = validateMeshTopology({ mesh, path: "$model.parts[0].mesh" });
    TestValidator.predicate(
      "collector names correspondence",
      !result.success &&
        result.violations.some(
          (fault) => fault.path === "$model.parts[0].mesh.physicalVertices",
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
  const empty = createPhysicalMesh([], [], []);
  empty.physicalVertices!.vertices.push(0);
  TestValidator.equals(
    "empty still refuses metadata",
    validateMeshTopology({ mesh: empty }).success,
    false,
  );
  const sameCell = createPhysicalMesh([0, 0, 0, 0.49e-9, 0, 0], [], [0, 0]);
  TestValidator.equals(
    "alias inside existing cell",
    resolveAutoMovieMeshPhysicalVertices(sameCell).vertices,
    [0, 0],
  );
  sameCell.positions[3] = 0.51e-9;
  TestValidator.predicate("alias crosses existing grid", refuses(sameCell));
};
