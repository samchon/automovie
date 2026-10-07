import {
  createAutoMovieMeshDeformer,
  mergeAutoMovieMeshes,
  transformAutoMovieMesh,
} from "@automovie/engine";
import { createMeshPhysicalPartitionMatcher } from "@automovie/engine/math/createMeshPhysicalPartitionMatcher";
import { resolveAutoMovieMeshPhysicalVertices } from "@automovie/engine/math/resolveAutoMovieMeshPhysicalVertices";
import { TestValidator } from "@nestia/e2e";

import { createPhysicalMesh } from "../internal/createPhysicalMesh";
import { throwsError } from "../internal/predicates";

/**
 * Placement and deformation retain source identity and refuse separated aliases.
 * Scenarios:
 * 1. A mirrored placement copies source pairs; scale may not separate grid aliases.
 * 2. Common displacement retains aliases; per-vertex influence may not split them.
 * 3. Mixed legacy entries remain dynamically welded after real field evaluation.
 * 4. Invalid correspondence refuses before work; source IDs cannot excuse zero area.
 */
export const test_geometry_physical_deformation = (): void => {
  const mesh = createPhysicalMesh(
    [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0],
    [0, 1, 2],
    [0, 1, 2, 0],
  );
  const placed = transformAutoMovieMesh(mesh, { scale: { x: -1, y: 2, z: 1 } });
  TestValidator.equals(
    "mirror preserves actual pairs",
    placed.physicalVertices,
    mesh.physicalVertices,
  );
  TestValidator.equals("mirror reverses winding", placed.indices, [0, 2, 1]);
  placed.physicalVertices!.sources[0].id = 99;
  placed.physicalVertices!.vertices[0] = null;
  TestValidator.equals(
    "transform source ownership",
    mesh.physicalVertices!.sources[0].id,
    0,
  );
  TestValidator.equals(
    "transform mapping ownership",
    mesh.physicalVertices!.vertices[0],
    0,
  );
  const gridAliases = createPhysicalMesh([0, 0, 0, 0.49e-9, 0, 0], [], [0, 0]);
  TestValidator.equals(
    "supported alias grid before scale",
    resolveAutoMovieMeshPhysicalVertices(gridAliases).vertices,
    [0, 0],
  );
  TestValidator.predicate(
    "scale must not split declared aliases",
    throwsError(() =>
      transformAutoMovieMesh(gridAliases, { scale: { x: 10, y: 1, z: 1 } }),
    ),
  );
  const deform = createAutoMovieMeshDeformer([
    {
      center: { x: 0, y: 0, z: 0 },
      radius: { x: 2, y: 2, z: 2 },
      displacement: { x: 0, y: 0, z: 0.1 },
      stretch: { x: 0, y: 0, z: 0 },
    },
  ]);
  const deformed = deform(mesh);
  TestValidator.equals(
    "common field retains aliases",
    resolveAutoMovieMeshPhysicalVertices(deformed).vertices,
    [0, 1, 2, 0],
  );
  TestValidator.equals(
    "identity cache survives deformation",
    createMeshPhysicalPartitionMatcher(mesh)(deformed),
    true,
  );
  deformed.physicalVertices!.sources[0].id = 99;
  deformed.physicalVertices!.vertices[0] = null;
  TestValidator.equals(
    "deformer source ownership",
    mesh.physicalVertices!.sources[0].id,
    0,
  );
  TestValidator.equals(
    "deformer mapping ownership",
    mesh.physicalVertices!.vertices[0],
    0,
  );
  const influence = Array.from({ length: 4 }, () => ({
    weight: 1,
    gradient: { x: 0, y: 0, z: 0 },
  }));
  influence[3].weight = 0;
  TestValidator.predicate(
    "actual aliases cannot separate",
    throwsError(() => deform(mesh, influence)),
  );
  const legacy = createPhysicalMesh(
    [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0],
    [0, 1, 2],
  );
  const mixed = mergeAutoMovieMeshes([mesh, legacy]);
  const mask = Array.from({ length: 8 }, () => ({
    weight: 1,
    gradient: { x: 0, y: 0, z: 0 },
  }));
  mask[7].weight = 0;
  const changed = deform(mixed, mask);
  TestValidator.equals(
    "legacy null mapping survives",
    changed.physicalVertices!.vertices.slice(4),
    [null, null, null, null],
  );
  TestValidator.equals(
    "legacy aliases recompute",
    resolveAutoMovieMeshPhysicalVertices(changed).vertices,
    [0, 1, 2, 0, 3, 4, 5, 6],
  );
  TestValidator.equals(
    "legacy cache detects split",
    createMeshPhysicalPartitionMatcher(mixed)(changed),
    false,
  );
  const invalid = createPhysicalMesh(
    mesh.positions,
    mesh.indices,
    [0, 1, 2, 0],
  );
  invalid.physicalVertices!.vertices[0] = -1;
  TestValidator.predicate(
    "transform refuses invalid metadata",
    throwsError(() => transformAutoMovieMesh(invalid, {})),
  );
  TestValidator.predicate(
    "deformer refuses invalid metadata",
    throwsError(() => deform(invalid)),
  );
  const collapsed = createPhysicalMesh(
    [0, 0, 0, 0, 0, 0, 1, 0, 0],
    [0, 1, 2],
    [0, 1, 2],
  );
  TestValidator.predicate(
    "source IDs do not excuse zero area",
    throwsError(() => deform(collapsed)),
  );
};
