import {
  mergeAutoMovieMeshes,
  resolveAutoMovieMeshPhysicalVertices,
  transformAutoMovieMesh,
  validateMeshTopology,
} from "@automovie/engine";
import type { IAutoMovieMesh } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { createPhysicalMesh } from "../../../internal/createPhysicalMesh";
import { throwsError } from "../../../internal/throwsError";

/**
 * `mergeAutoMovieMeshes` keeps each member's physical source lineage, and legacy
 * (source-less) vertices stay a position-derived cohort.
 *
 * Fixture: triangle A (0,0,0), (1,0,0), (0,1,0) with sources 11, 12, 13 and
 * triangle B (1,0,0), (0,0,0), (0,-1,0) with 12, 11, 14, both in the domain
 * `actual-instance`: they share the edge 11-12 wound oppositely.
 *
 * Scenarios:
 *
 * 1. A + B resolves to 0, 1, 2, 1, 0, 3 and validates as a manifold; (A + B) + A
 *    resolves to 0, 1, 2, 1, 0, 3, 0, 1, 2 with the same lineage as A + (B + A).
 * 2. B's sources in another domain share nothing with A: 0..5.
 * 3. A beside a legacy copy and its unindexed twin publishes null for the legacy
 *    vertices and resolves them as one cohort, 0, 1, 2, 3, 4, 5, 3, 4, 5; moving
 *    a legacy position recomputes it (6 at the moved vertex).
 * 4. A merged with itself moved 2 m is refused ("physicalVertices", "aliases
 *    disagree"); a member with a negative reference is refused.
 * 5. Editing the merged lineage changes no member's; legacy-only and empty
 *    merges carry no lineage.
 */
export function test_unit_engine_geometry_physical_vertices_merge(): void {
  const a: IAutoMovieMesh = createPhysicalMesh([0, 0, 0, 1, 0, 0, 0, 1, 0], [0, 1, 2], [11, 12, 13], "actual-instance");
  const b: IAutoMovieMesh = createPhysicalMesh([1, 0, 0, 0, 0, 0, 0, -1, 0], [0, 1, 2], [12, 11, 14], "actual-instance");
  const vertices = (mesh: IAutoMovieMesh): number[] => resolveAutoMovieMeshPhysicalVertices(mesh).vertices;

  // 1.
  const combined: IAutoMovieMesh = mergeAutoMovieMeshes([a, b]);
  TestValidator.equals("shared edge", vertices(combined), [0, 1, 2, 1, 0, 3]);
  TestValidator.equals("manifold", validateMeshTopology({ mesh: combined }), { success: true });
  const remerged: IAutoMovieMesh = mergeAutoMovieMeshes([combined, a]);
  TestValidator.equals("remerge", vertices(remerged), [0, 1, 2, 1, 0, 3, 0, 1, 2]);
  TestValidator.equals(
    "regrouped",
    remerged.physicalVertices,
    mergeAutoMovieMeshes([a, mergeAutoMovieMeshes([b, a])]).physicalVertices,
  );

  // 2.
  const other: IAutoMovieMesh = createPhysicalMesh(b.positions, b.indices, [12, 11, 14], "other-instance");
  TestValidator.equals("other domain", vertices(mergeAutoMovieMeshes([a, other])), [0, 1, 2, 3, 4, 5]);

  // 3.
  const bare: IAutoMovieMesh = createPhysicalMesh(a.positions, a.indices);
  const mixed: IAutoMovieMesh = mergeAutoMovieMeshes([a, bare, createPhysicalMesh(bare.positions, null)]);
  TestValidator.equals("null legacy", mixed.physicalVertices!.vertices, [0, 1, 2, null, null, null, null, null, null]);
  TestValidator.equals("legacy cohort", vertices(mixed), [0, 1, 2, 3, 4, 5, 3, 4, 5]);
  mixed.positions[18] = 2;
  TestValidator.equals("recomputed", vertices(mixed), [0, 1, 2, 3, 4, 5, 6, 4, 5]);

  // 4.
  const moved: IAutoMovieMesh = transformAutoMovieMesh(a, { translation: { x: 2, y: 0, z: 0 } });
  TestValidator.predicate(
    "moved alias",
    throwsError((): unknown => mergeAutoMovieMeshes([a, moved]), ["physicalVertices", "aliases disagree"]),
  );
  const malformed: IAutoMovieMesh = createPhysicalMesh(a.positions, a.indices, [11, 12, 13]);
  malformed.physicalVertices!.vertices[0] = -1;
  TestValidator.predicate(
    "malformed member",
    throwsError((): unknown => mergeAutoMovieMeshes([a, malformed]), "physicalVertices"),
  );

  // 5.
  combined.physicalVertices!.sources[0]!.domain = "mutated-output";
  combined.physicalVertices!.vertices[0] = null;
  TestValidator.equals("member sources kept", a.physicalVertices!.sources[0]!.domain, "actual-instance");
  TestValidator.equals("member vertices kept", a.physicalVertices!.vertices[0], 0);
  TestValidator.equals("legacy only", mergeAutoMovieMeshes([bare]).physicalVertices, undefined);
  TestValidator.equals("empty", mergeAutoMovieMeshes([]).physicalVertices, undefined);
}
