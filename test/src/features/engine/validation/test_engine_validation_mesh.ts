import { AutoMovieEngineViolationCollector, AutoMovieEngineValidation } from "@automovie/engine";
import type { IAutoMovieMesh } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * `validateMesh` admits buffer layout and cardinality, vertex references and
 * vertex colours of a mesh, reporting each fault at its buffer path.
 *
 * Base mesh: one triangle, positions (0,0,0), (1,0,0), (0,1,0), indices 0, 1,
 * 2.
 *
 * Scenarios:
 *
 * 1. The base mesh reports nothing.
 * 2. A position buffer of four numbers reports `m.positions`.
 * 3. An empty position buffer reports `m.positions` (a mesh needs a vertex).
 * 4. Four uv numbers for three vertices report `m.uvs`.
 * 5. An index 3 for three vertices reports `m.indices[2]`.
 * 6. A colour component of 2 reports `m.colors[0]`.
 */
export function test_engine_validation_mesh(): void {
  const base = (): IAutoMovieMesh => ({
    positions: [0, 0, 0, 1, 0, 0, 0, 1, 0],
    normals: null,
    uvs: null,
    indices: [0, 1, 2],
    skin: null,
  });
  const paths = (mesh: IAutoMovieMesh): string[] => {
    const collector: AutoMovieEngineViolationCollector = new AutoMovieEngineViolationCollector();
    AutoMovieEngineValidation.validateMesh(mesh, "m", new Set<string>(), collector);
    return collector.items.map((row: { path: string }): string => row.path);
  };
  TestValidator.equals("base", paths(base()), []);
  TestValidator.predicate(
    "positions arity",
    paths({ ...base(), positions: [0, 0, 0, 1], indices: null }).includes(
      "m.positions",
    ),
  );
  TestValidator.equals(
    "empty",
    paths({ ...base(), positions: [], indices: null }),
    ["m.positions"],
  );
  TestValidator.equals("uvs", paths({ ...base(), uvs: [0, 0, 1, 0] }), [
    "m.uvs",
  ]);
  TestValidator.equals("index", paths({ ...base(), indices: [0, 1, 3] }), [
    "m.indices[2]",
  ]);
  TestValidator.equals(
    "colour",
    paths({ ...base(), colors: [2, 0, 0, 0, 0, 0, 0, 0, 0] }),
    ["m.colors[0]"],
  );
}
