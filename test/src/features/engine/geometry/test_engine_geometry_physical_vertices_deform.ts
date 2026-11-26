import { mergeAutoMovieMeshes, transformAutoMovieMesh, AutoMovieEngineMath, AutoMovieEngineGeometry } from "@automovie/engine";
import type { IAutoMovieMesh, IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { createPhysicalMesh } from "../../internal/createPhysicalMesh";
import { throwsError } from "../../internal/throwsError";

/**
 * Placement (`transformAutoMovieMesh`) and deformation
 * (`createAutoMovieMeshDeformer`) keep each vertex's physical source and refuse
 * to separate declared aliases.
 *
 * Fixture: the unit right triangle plus a fourth vertex at the origin aliasing
 * vertex 0 (sources 0, 1, 2, 0); a field lifting z by 0.1 within radius 2.
 *
 * Scenarios:
 *
 * 1. A mirroring placement (-1, 2, 1) copies the lineage and reverses the winding
 *    to (0, 2, 1); editing its lineage changes the source's none.
 * 2. Two aliases 0.49 nm apart share a vertex; scaling x by 10 would split them
 *    and is refused ("physicalVertices", "aliases disagree").
 * 3. The common field keeps the aliases (0, 1, 2, 0) and the partition
 *    (`createMeshPhysicalPartitionMatcher`); its lineage is a copy; a
 *    per-vertex influence zero at the alias would split it and is refused.
 * 4. Beside a legacy copy, an influence zero at the legacy vertex 7 keeps null
 *    legacy entries, recomputes them to 0, 1, 2, 0, 3, 4, 5, 6 and no longer
 *    matches the partition.
 * 5. A reference -1 is refused by both; a zero-area triangle is refused despite
 *    its sources ("finite nonzero source and output area").
 */
export function test_engine_geometry_physical_vertices_deform(): void {
  const mesh: IAutoMovieMesh = createPhysicalMesh(
    [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0],
    [0, 1, 2],
    [0, 1, 2, 0],
  );
  const vertices = (m: IAutoMovieMesh): number[] =>
    AutoMovieEngineMath.resolveMeshPhysicalVertices(m).vertices;
  const deform = AutoMovieEngineGeometry.createMeshDeformer([
    {
      center: { x: 0, y: 0, z: 0 },
      radius: { x: 2, y: 2, z: 2 },
      displacement: { x: 0, y: 0, z: 0.1 },
      stretch: { x: 0, y: 0, z: 0 },
    },
  ]);
  const influence = (
    n: number,
    zero: number,
  ): { weight: number; gradient: IAutoMovieVector3 }[] =>
    Array.from({ length: n }, (_: unknown, i: number) => ({
      weight: i === zero ? 0 : 1,
      gradient: { x: 0, y: 0, z: 0 },
    }));
  const owned = (label: string, out: IAutoMovieMesh): void => {
    out.physicalVertices!.sources[0]!.id = 99;
    out.physicalVertices!.vertices[0] = null;
    TestValidator.equals(
      `${label} sources kept`,
      mesh.physicalVertices!.sources[0]!.id,
      0,
    );
    TestValidator.equals(
      `${label} vertices kept`,
      mesh.physicalVertices!.vertices[0],
      0,
    );
  };

  // 1.
  const placed: IAutoMovieMesh = transformAutoMovieMesh(mesh, {
    scale: { x: -1, y: 2, z: 1 },
  });
  TestValidator.equals(
    "mirror lineage",
    placed.physicalVertices,
    mesh.physicalVertices,
  );
  TestValidator.equals("mirror winding", placed.indices, [0, 2, 1]);
  owned("placement", placed);

  // 2.
  const grid: IAutoMovieMesh = createPhysicalMesh(
    [0, 0, 0, 0.49e-9, 0, 0],
    [],
    [0, 0],
  );
  TestValidator.equals("grid aliases", vertices(grid), [0, 0]);
  TestValidator.predicate(
    "scale splits",
    throwsError(
      (): unknown =>
        transformAutoMovieMesh(grid, { scale: { x: 10, y: 1, z: 1 } }),
      ["physicalVertices", "aliases disagree"],
    ),
  );

  // 3.
  const deformed: IAutoMovieMesh = deform(mesh);
  TestValidator.equals("common field", vertices(deformed), [0, 1, 2, 0]);
  TestValidator.equals(
    "partition kept",
    AutoMovieEngineMath.createMeshPhysicalPartitionMatcher(mesh)(deformed),
    true,
  );
  owned("deformation", deformed);
  TestValidator.predicate(
    "influence splits",
    throwsError(
      (): unknown => deform(mesh, influence(4, 3)),
      ["physicalVertices", "aliases disagree"],
    ),
  );

  // 4.
  const mixed: IAutoMovieMesh = mergeAutoMovieMeshes([
    mesh,
    createPhysicalMesh(mesh.positions, [0, 1, 2]),
  ]);
  const changed: IAutoMovieMesh = deform(mixed, influence(8, 7));
  TestValidator.equals(
    "legacy null",
    changed.physicalVertices!.vertices.slice(4),
    [null, null, null, null],
  );
  TestValidator.equals(
    "legacy recomputed",
    vertices(changed),
    [0, 1, 2, 0, 3, 4, 5, 6],
  );
  TestValidator.equals(
    "partition changed",
    AutoMovieEngineMath.createMeshPhysicalPartitionMatcher(mixed)(changed),
    false,
  );

  // 5.
  const invalid: IAutoMovieMesh = createPhysicalMesh(
    mesh.positions,
    mesh.indices,
    [0, 1, 2, 0],
  );
  invalid.physicalVertices!.vertices[0] = -1;
  TestValidator.predicate(
    "placement refuses",
    throwsError(
      (): unknown => transformAutoMovieMesh(invalid, {}),
      "physicalVertices",
    ),
  );
  TestValidator.predicate(
    "deformer refuses",
    throwsError((): unknown => deform(invalid), "physicalVertices"),
  );
  TestValidator.predicate(
    "zero area",
    throwsError(
      (): unknown =>
        deform(
          createPhysicalMesh([0, 0, 0, 0, 0, 0, 1, 0, 0], [0, 1, 2], [0, 1, 2]),
        ),
      "finite nonzero source and output area",
    ),
  );
}
