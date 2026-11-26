import { validateMeshTopology, AutoMovieEngineMath } from "@automovie/engine";
import type {
  IAutoMovieConstraintViolation,
  IAutoMovieMesh,
  IAutoMovieValidation,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { createPhysicalMesh } from "../../internal/createPhysicalMesh";

/**
 * `resolveAutoMovieMeshPhysicalVertices` refuses a malformed source
 * correspondence by name ("physicalVertices") instead of falling back to
 * coincidence, and `validateMeshTopology` reports it at the mesh's
 * `physicalVertices` path.
 *
 * Fixture: the unit right triangle with sources 0, 1, 2
 * (`createPhysicalMesh`), broken one field at a time.
 *
 * Scenarios:
 *
 * 1. A missing position component, a missing vertex reference, source id -1 and
 *    MAX_SAFE_INTEGER + 1, a vertex referring to source -1 or 3, and a second
 *    vertex aliasing the first across the triangle are each refused, and
 *    topology validation names `$model.parts[0].mesh.physicalVertices`.
 * 2. The valid triangle resolves and validates.
 * 3. An empty mesh with a dangling vertex reference still fails validation.
 * 4. Two sources 0.49 nm apart in one cell resolve to one vertex (0, 0); moved
 *    to 0.51 nm they cross the grid and are refused.
 */
export function test_engine_geometry_physical_vertices_refusals(): void {
  const valid = (): IAutoMovieMesh =>
    createPhysicalMesh([0, 0, 0, 1, 0, 0, 0, 1, 0], [0, 1, 2], [0, 1, 2]);
  const refused = (mesh: IAutoMovieMesh): boolean => {
    try {
      AutoMovieEngineMath.resolveMeshPhysicalVertices(mesh);
      return false;
    } catch (error: unknown) {
      return error instanceof Error && error.message.includes("physicalVertices");
    }
  };
  const broken = (edit: (mesh: IAutoMovieMesh) => void): IAutoMovieMesh => {
    const mesh: IAutoMovieMesh = valid();
    edit(mesh);
    return mesh;
  };

  // 1.
  const cases: [string, IAutoMovieMesh][] = [
    ["position component", broken((m) => void m.positions.pop())],
    ["vertex reference", broken((m) => void m.physicalVertices!.vertices.pop())],
    ...[-1, Number.MAX_SAFE_INTEGER + 1].map((id: number): [string, IAutoMovieMesh] => [
      `source id ${id}`,
      broken((m) => {
        m.physicalVertices!.sources[0]!.id = id;
      }),
    ]),
    ...[-1, 3].map((reference: number): [string, IAutoMovieMesh] => [
      `reference ${reference}`,
      broken((m) => {
        m.physicalVertices!.vertices[0] = reference;
      }),
    ]),
    [
      "alias across the triangle",
      broken((m) => {
        m.physicalVertices!.vertices[1] = 0;
      }),
    ],
  ];
  for (const [label, mesh] of cases) {
    TestValidator.predicate(`${label} refused`, refused(mesh));
    const result: IAutoMovieValidation = validateMeshTopology({ mesh, path: "$model.parts[0].mesh" });
    TestValidator.predicate(
      `${label} reported`,
      !result.success &&
        result.violations.some(
          (v: IAutoMovieConstraintViolation): boolean =>
            v.path === "$model.parts[0].mesh.physicalVertices",
        ),
    );
  }

  // 2.
  TestValidator.equals("valid resolves", refused(valid()), false);
  TestValidator.equals("valid validates", validateMeshTopology({ mesh: valid() }), { success: true });

  // 3.
  const empty: IAutoMovieMesh = createPhysicalMesh([], [], []);
  empty.physicalVertices!.vertices.push(0);
  TestValidator.equals("empty with a reference", validateMeshTopology({ mesh: empty }).success, false);

  // 4.
  const cell: IAutoMovieMesh = createPhysicalMesh([0, 0, 0, 0.49e-9, 0, 0], [], [0, 0]);
  TestValidator.equals("one cell", AutoMovieEngineMath.resolveMeshPhysicalVertices(cell).vertices, [0, 0]);
  cell.positions[3] = 0.51e-9;
  TestValidator.predicate("across the grid", refused(cell));
}
