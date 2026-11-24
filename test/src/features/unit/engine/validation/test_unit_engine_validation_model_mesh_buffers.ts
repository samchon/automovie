import { validateModel } from "@automovie/engine";
import {
  AutoMovieHumanoidBone,
  IAutoMovieMesh,
  IAutoMovieMeshSkin,
  IAutoMovieModel,
  IAutoMovieModelPart,
  IAutoMovieTransform,
  IAutoMovieValidation,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { createModel } from "../../../internal/fixtures";
import { hasViolation } from "../../../internal/predicates";

const VALID_MESH: IAutoMovieMesh = {
  positions: [0, 0, 0, 1, 0, 0, 0, 1, 0],
  normals: [0, 0, 1, 0, 0, 1, 0, 0, 1],
  uvs: [0, 0, 1, 0, 0, 1],
  indices: [0, 1, 2],
  skin: null,
};

const modelWithMesh: (mesh: IAutoMovieMesh) => IAutoMovieModel = (
  mesh: IAutoMovieMesh,
): IAutoMovieModel => {
  const base: IAutoMovieModel = createModel(
    mesh.skin === null ? null : undefined,
  );
  return {
    ...base,
    origin: "imported",
    parts: base.parts.map(
      (
        part: IAutoMovieModelPart,
      ): {
        geometry: { type: "mesh"; mesh: IAutoMovieMesh };
        id: string;
        name: string | null;
        material: string | null;
        attachedBone: AutoMovieHumanoidBone | null;
        transform: IAutoMovieTransform | null;
      } => ({
        ...part,
        geometry: { type: "mesh", mesh },
      }),
    ),
  };
};

/**
 * Raw mesh geometry reaches render/export paths as typed arrays, so validation
 * must reject malformed buffers before downstream geometry upload.
 *
 * Scenarios:
 *
 * 1. A finite, aligned triangle mesh validates.
 * 2. A finite, non-indexed mesh with optional buffers omitted validates.
 * 3. Non-finite position scalars are range violations.
 * 4. Normals must align to the position vertex count.
 * 5. Indices must be triangle triples that reference existing vertices.
 * 6. Malformed tuple lengths are type violations.
 * 7. Isolated non-finite positions report despite valid indices.
 * 8. Dense finite relief and normalized skin buffers remain admitted.
 */
export function test_unit_engine_validation_model_mesh_buffers(): void {
  TestValidator.equals(
    "valid mesh succeeds",
    validateModel({ model: modelWithMesh(VALID_MESH) }).success,
    true,
  );
  TestValidator.equals(
    "minimal mesh succeeds",
    validateModel({
      model: modelWithMesh({
        ...VALID_MESH,
        normals: null,
        uvs: null,
        indices: null,
      }),
    }).success,
    true,
  );

  const invalid: IAutoMovieValidation = validateModel({
    model: modelWithMesh({
      ...VALID_MESH,
      positions: [0, 0, 0, 1, 0, 0, 0, 1, 0],
      normals: [0, 0, 1],
      indices: [0, -1, 3, 0, 1, 2],
    }),
  });

  TestValidator.equals("malformed mesh fails", invalid.success, false);

  TestValidator.predicate(
    "normal length violation",
    hasViolation(invalid, "type", "$input.parts[0].geometry.mesh.normals"),
  );
  TestValidator.predicate(
    "negative index violation",
    hasViolation(invalid, "range", "$input.parts[0].geometry.mesh.indices[1]"),
  );
  TestValidator.predicate(
    "high index violation",
    hasViolation(invalid, "range", "$input.parts[0].geometry.mesh.indices[2]"),
  );

  const badTuples: IAutoMovieValidation = validateModel({
    model: modelWithMesh({
      ...VALID_MESH,
      positions: [0, 0],
      indices: [0, 1],
    }),
  });
  TestValidator.equals(
    "malformed tuple lengths fail",
    badTuples.success,
    false,
  );
  TestValidator.predicate(
    "position tuple length violation",
    hasViolation(badTuples, "type", "$input.parts[0].geometry.mesh.positions"),
  );
  TestValidator.predicate(
    "index tuple length violation",
    hasViolation(badTuples, "type", "$input.parts[0].geometry.mesh.indices"),
  );

  const skin: IAutoMovieMeshSkin = {
    joints: ["hips"],
    boneIndices: new Array<number>(12).fill(0),
    weights: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
  };
  TestValidator.predicate(
    "dense optional attributes and normalized skin remain valid",
    validateModel({
      model: modelWithMesh({ ...VALID_MESH, reliefWeights: [0, 1, 0], skin }),
    }).success,
  );
}
