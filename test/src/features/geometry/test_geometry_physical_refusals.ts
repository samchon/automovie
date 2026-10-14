import { validateMeshTopology } from "../../../../packages/engine/src/validation/validateMeshTopology";
import { resolveAutoMovieMeshPhysicalVertices } from "../../../../packages/engine/src/math/resolveAutoMovieMeshPhysicalVertices";
import { type IAutoMovieMesh, type IAutoMovieMeshPhysicalSource, type IAutoMovieValidation, type IAutoMovieConstraintViolation } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";
import { createPhysicalMesh } from "../internal/createPhysicalMesh";

/**
 * Invalid source correspondence is an explicit refusal, never legacy fallback.
 * Scenarios:
 * 1. Dense cardinality, source shape/domain/ID and resident references are armed.
 * 2. Nonfinite or incomplete coordinates and separated source aliases refuse.
 * 3. The adjacent valid triangle passes every corresponding input boundary.
 * 4. Model-style topology collection names physicalVertices even on an empty mesh.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls physical correspondence admission and topology collection on the existing valid triangle and each malformed twin, asserting named physicalVertices refusal rather than legacy fallback and retained structured violation on empty geometry. It catches silent reinterpretation of invalid explicit lineage.
 * @evidence contracts/testing.md#independent-expectations Dense one-reference-per-vertex tables, nonblank domains, safe nonnegative IDs, resident source references and coincident aliases are the physical correspondence contract. Each existing mutation violates one requirement beside the valid triangle. Exception/violation names identify the boundary; they do not prove general topology, physical precision or rendered validity.
 * @evidence contracts/testing.md#distinguishing-cases Preserves incomplete/nonfinite/sparse coordinates, sparse/cardinality tables, source shape/domain/ID errors, fractional/out-of-range references, separated aliases, the adjacent valid triangle and an empty-mesh structured violation. Composition, placement and cache semantics remain in other physical tests.
 * @evidence contracts/testing.md#execution-ownership The named entry directly reaches portable resolver and topology validation source with existing fixture records and no module replacement. It starts no process, browser, GPU or native build, installs no consumer and dynamically registers no new Human or geometry cases.
 */
export function test_geometry_physical_refusals(): void {
  const valid: () => IAutoMovieMesh = (): IAutoMovieMesh  =>
    createPhysicalMesh([0, 0, 0, 1, 0, 0, 0, 1, 0], [0, 1, 2], [0, 1, 2]);
  const refuses: (mesh: IAutoMovieMesh) => boolean = (mesh: IAutoMovieMesh): boolean => {
    try {
      resolveAutoMovieMeshPhysicalVertices(mesh);
      return false;
    } catch (error) {
      return error instanceof Error && error.message.includes("physicalVertices");
    }
  };
  const invalid: IAutoMovieMesh[] = [];
  const add: (edit: (mesh: IAutoMovieMesh) => void) => void = (edit: (mesh: IAutoMovieMesh) => void): void  => {
    const mesh: IAutoMovieMesh = valid();
    edit(mesh);
    invalid.push(mesh);
  };
  add((mesh: IAutoMovieMesh): void  => {
    mesh.positions.pop();
  });
  for (const value of [NaN, Infinity])
    add((mesh: IAutoMovieMesh): void  => {
      mesh.positions[0] = value;
    });
  add((mesh: IAutoMovieMesh): void  => {
    mesh.positions = new Array<number>(9);
  });
  add((mesh: IAutoMovieMesh): void  => {
    mesh.physicalVertices!.vertices.pop();
  });
  add((mesh: IAutoMovieMesh): void  => {
    mesh.physicalVertices!.vertices = new Array<number | null>(3);
  });
  add((mesh: IAutoMovieMesh): void  => {
    mesh.physicalVertices!.sources = new Array<IAutoMovieMeshPhysicalSource>(3);
  });
  for (const id of [-1, 0.5, Number.MAX_SAFE_INTEGER + 1, NaN])
    add((mesh: IAutoMovieMesh): void  => {
      mesh.physicalVertices!.sources[0].id = id;
    });
  for (const domain of ["", " \t"])
    add((mesh: IAutoMovieMesh): void  => {
      mesh.physicalVertices!.sources[0].domain = domain;
    });
  for (const reference of [-1, 0.5, 3, NaN])
    add((mesh: IAutoMovieMesh): void  => {
      mesh.physicalVertices!.vertices[0] = reference;
    });
  add((mesh: IAutoMovieMesh): void  => {
    mesh.physicalVertices!.vertices[1] = 0;
  });
  for (const metadata of [
    null,
    {},
    { sources: null, vertices: [] },
    { sources: [], vertices: null },
  ])
    add((mesh: IAutoMovieMesh): void  => {
      mesh.physicalVertices =
        metadata as unknown as IAutoMovieMesh["physicalVertices"];
    });
  for (const source of [null, { domain: 1, id: 0 }])
    add((mesh: IAutoMovieMesh): void  => {
      mesh.physicalVertices!.sources[0] =
        source as unknown as IAutoMovieMeshPhysicalSource;
    });
  for (const mesh of invalid) {
    TestValidator.predicate("named refusal", refuses(mesh));
    const result: IAutoMovieValidation = validateMeshTopology({ mesh, path: "$model.parts[0].mesh" });
    TestValidator.predicate(
      "collector names correspondence",
      !result.success &&
        result.violations.some(
          (fault: IAutoMovieConstraintViolation): boolean  => fault.path === "$model.parts[0].mesh.physicalVertices",
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
  const sameCell: IAutoMovieMesh = createPhysicalMesh([0, 0, 0, 0.49e-9, 0, 0], [], [0, 0]);
  TestValidator.equals(
    "alias inside existing cell",
    resolveAutoMovieMeshPhysicalVertices(sameCell).vertices,
    [0, 0],
  );
  sameCell.positions[3] = 0.51e-9;
  TestValidator.predicate("alias crosses existing grid", refuses(sameCell));
}
