import {
  mergeAutoMovieMeshes,
  transformAutoMovieMesh,
  validateMeshTopology,
} from "@automovie/engine";
import { resolveAutoMovieMeshPhysicalVertices } from "@automovie/engine/math/resolveAutoMovieMeshPhysicalVertices";
import { TestValidator } from "@nestia/e2e";

import { createPhysicalMesh } from "../internal/createPhysicalMesh";
import { throwsError } from "../internal/predicates";

/**
 * Composition retains physical lineage and dynamically position-derived legacy.
 * Scenarios:
 * 1. Same-instance opposite faces share an edge; different domains keep it apart.
 * 2. Merge/remerge and operand regrouping retain original pair meaning and order.
 * 3. Mixed inputs keep one legacy cohort separate from explicit source points.
 * 4. Placement of the same physical pair to different cells refuses on merge.
 * 5. Legacy-only/empty output keeps metadata absent, and arrays remain owned.
 */
export const test_geometry_physical_merge = (): void => {
  const a = createPhysicalMesh(
    [0, 0, 0, 1, 0, 0, 0, 1, 0],
    [0, 1, 2],
    [11, 12, 13],
    "actual-instance",
  );
  const b = createPhysicalMesh(
    [1, 0, 0, 0, 0, 0, 0, -1, 0],
    [0, 1, 2],
    [12, 11, 14],
    "actual-instance",
  );
  const combined = mergeAutoMovieMeshes([a, b]);
  TestValidator.equals(
    "original edge aliases",
    resolveAutoMovieMeshPhysicalVertices(combined).vertices,
    [0, 1, 2, 1, 0, 3],
  );
  TestValidator.equals(
    "opposite direction shared edge",
    validateMeshTopology({ mesh: combined }),
    { success: true },
  );
  const remerged = mergeAutoMovieMeshes([combined, a]);
  TestValidator.equals(
    "remerge sees original A",
    resolveAutoMovieMeshPhysicalVertices(remerged).vertices,
    [0, 1, 2, 1, 0, 3, 0, 1, 2],
  );
  TestValidator.equals(
    "nested composition",
    remerged.physicalVertices,
    mergeAutoMovieMeshes([a, mergeAutoMovieMeshes([b, a])]).physicalVertices,
  );
  const independent = createPhysicalMesh(
    b.positions,
    b.indices,
    [12, 11, 14],
    "other-instance",
  );
  TestValidator.equals(
    "same integers another domain",
    resolveAutoMovieMeshPhysicalVertices(mergeAutoMovieMeshes([a, independent]))
      .vertices,
    [0, 1, 2, 3, 4, 5],
  );
  const bare = createPhysicalMesh(a.positions, a.indices);
  const mixed = mergeAutoMovieMeshes([
    a,
    bare,
    createPhysicalMesh(bare.positions, null),
  ]);
  TestValidator.equals(
    "nullable dynamic legacy",
    mixed.physicalVertices!.vertices,
    [0, 1, 2, null, null, null, null, null, null],
  );
  TestValidator.equals(
    "legacy cohort across members",
    resolveAutoMovieMeshPhysicalVertices(mixed).vertices,
    [0, 1, 2, 3, 4, 5, 3, 4, 5],
  );
  mixed.positions[18] = 2;
  TestValidator.equals(
    "legacy recomputes after mutation",
    resolveAutoMovieMeshPhysicalVertices(mixed).vertices,
    [0, 1, 2, 3, 4, 5, 6, 4, 5],
  );
  const placed = transformAutoMovieMesh(a, {
    translation: { x: 2, y: 0, z: 0 },
  });
  TestValidator.predicate(
    "same point cannot occupy another placement",
    throwsError(() => mergeAutoMovieMeshes([a, placed])),
  );
  const malformed = createPhysicalMesh(a.positions, a.indices, [11, 12, 13]);
  malformed.physicalVertices!.vertices[0] = -1;
  TestValidator.predicate(
    "invalid operand not lost",
    throwsError(() => mergeAutoMovieMeshes([a, malformed])),
  );
  combined.physicalVertices!.sources[0].domain = "mutated-output";
  combined.physicalVertices!.vertices[0] = null;
  TestValidator.equals(
    "merge owns source records",
    a.physicalVertices!.sources[0].domain,
    "actual-instance",
  );
  TestValidator.equals(
    "merge owns vertex mapping",
    a.physicalVertices!.vertices[0],
    0,
  );
  TestValidator.equals(
    "legacy remains absent",
    mergeAutoMovieMeshes([bare]).physicalVertices,
    undefined,
  );
  TestValidator.equals(
    "empty remains absent",
    mergeAutoMovieMeshes([]).physicalVertices,
    undefined,
  );
};
