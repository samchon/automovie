import {
  createAutoMovieMeshDeformer,
  createMeshPhysicalPartitionMatcher,
  mergeAutoMovieMeshes,
  resolveAutoMovieMeshPhysicalVertices,
  transformAutoMovieMesh,
} from "@automovie/engine";
import type {
  IAutoMovieMesh,
  IAutoMovieMeshDeformationInfluence,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { createPhysicalMesh } from "../../../internal/createPhysicalMesh";
import { throwsError } from "../../../internal/throwsError";

/**
 * Placement and deformation retain source identity and refuse separated aliases.
 * Scenarios:
 * 1. A mirrored placement copies source pairs; scale may not separate grid aliases.
 * 2. Common displacement retains aliases; per-vertex influence may not split them.
 * 3. Mixed legacy entries remain dynamically welded after real field evaluation.
 * 4. Invalid correspondence refuses before work; source IDs cannot excuse zero area.
 */
export function test_unit_engine_geometry_geometry_physical_deformation(): void {
  const mesh: IAutoMovieMesh = createPhysicalMesh(
    [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0],
    [0, 1, 2],
    [0, 1, 2, 0],
  );
  const placed: IAutoMovieMesh = transformAutoMovieMesh(mesh, {
    scale: { x: -1, y: 2, z: 1 },
  });
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
  const gridAliases: IAutoMovieMesh = createPhysicalMesh(
    [0, 0, 0, 0.49e-9, 0, 0],
    [],
    [0, 0],
  );
  TestValidator.equals(
    "supported alias grid before scale",
    resolveAutoMovieMeshPhysicalVertices(gridAliases).vertices,
    [0, 0],
  );
  TestValidator.predicate(
    "scale must not split declared aliases",
    throwsError(
      (): IAutoMovieMesh =>
        transformAutoMovieMesh(gridAliases, { scale: { x: 10, y: 1, z: 1 } }),
      ["physicalVertices", "aliases disagree"],
    ),
  );
  const deform: (
    mesh: IAutoMovieMesh,
    influence?: readonly IAutoMovieMeshDeformationInfluence[],
  ) => IAutoMovieMesh = createAutoMovieMeshDeformer([
    {
      center: { x: 0, y: 0, z: 0 },
      radius: { x: 2, y: 2, z: 2 },
      displacement: { x: 0, y: 0, z: 0.1 },
      stretch: { x: 0, y: 0, z: 0 },
    },
  ]);
  const deformed: IAutoMovieMesh = deform(mesh);
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
  const influence: { weight: number; gradient: IAutoMovieVector3 }[] =
    Array.from(
      { length: 4 },
      (): { weight: number; gradient: IAutoMovieVector3 } => ({
        weight: 1,
        gradient: { x: 0, y: 0, z: 0 },
      }),
    );
  influence[3].weight = 0;
  TestValidator.predicate(
    "actual aliases cannot separate",
    throwsError(
      (): IAutoMovieMesh => deform(mesh, influence),
      ["physicalVertices", "aliases disagree"],
    ),
  );
  const legacy: IAutoMovieMesh = createPhysicalMesh(
    [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0],
    [0, 1, 2],
  );
  const mixed: IAutoMovieMesh = mergeAutoMovieMeshes([mesh, legacy]);
  const mask: { weight: number; gradient: IAutoMovieVector3 }[] = Array.from(
    { length: 8 },
    (): { weight: number; gradient: IAutoMovieVector3 } => ({
      weight: 1,
      gradient: { x: 0, y: 0, z: 0 },
    }),
  );
  mask[7].weight = 0;
  const changed: IAutoMovieMesh = deform(mixed, mask);
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
  const invalid: IAutoMovieMesh = createPhysicalMesh(
    mesh.positions,
    mesh.indices,
    [0, 1, 2, 0],
  );
  invalid.physicalVertices!.vertices[0] = -1;
  TestValidator.predicate(
    "transform refuses invalid metadata",
    throwsError(
      (): IAutoMovieMesh => transformAutoMovieMesh(invalid, {}),
      "physicalVertices",
    ),
  );
  TestValidator.predicate(
    "deformer refuses invalid metadata",
    throwsError((): IAutoMovieMesh => deform(invalid), "physicalVertices"),
  );
  const collapsed: IAutoMovieMesh = createPhysicalMesh(
    [0, 0, 0, 0, 0, 0, 1, 0, 0],
    [0, 1, 2],
    [0, 1, 2],
  );
  TestValidator.predicate(
    "source IDs do not excuse zero area",
    throwsError(
      (): IAutoMovieMesh => deform(collapsed),
      "finite nonzero source and output area",
    ),
  );
}
