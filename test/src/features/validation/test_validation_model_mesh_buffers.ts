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

import { createModel } from "../internal/fixtures";
import { hasViolation } from "../internal/predicates";
import { withoutArraySlot } from "../internal/withoutArraySlot";

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
 * 7. Isolated non-finite and missing positions report despite valid indices;
 *    sparse indices and optional attribute/skin slots report their own fields
 *    instead of escaping through topology or passing a skipped row.
 * 8. Dense finite relief and normalized skin buffers remain admitted.
 *
 * @evidence contracts/testing.md#behavioral-verification The real model gate returns located structural findings for resident mesh buffers, catching skipped sparse slots and escaped weld errors while retaining valid indexed/nonindexed and fully populated optional attributes.
 * @evidence contracts/testing.md#independent-expectations Three xyz vertices require nine finite position scalars, triangle references require three in-range integers, relief requires one finite nonnegative scalar per vertex, and four finite skin influences per vertex sum to one. Missing a required slot cannot supply any of these values.
 * @evidence contracts/testing.md#distinguishing-cases Preserve valid/minimal and combined malformed tuple/index cases, adding isolated NaN/Infinity and sparse position/index/relief/skin-joint/skin-index/skin-weight cases beside a dense normalized control; explicit physical partition and closed-boundary semantics remain owning topology cases.
 * @evidence contracts/testing.md#execution-ownership Portable CPU unit discovered as test_validation_model_mesh_buffers; existing model/rig record builders supply only source data and validateModel owns all observed results, without a mesh uploader, browser, GPU or Human inspection host.
 */
export function test_validation_model_mesh_buffers(): void {
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
      positions: [0, 0, 0, 1, Number.NaN, 0, 0, 1, 0],
      normals: [0, 0, 1],
      indices: [0, -1, 3, 0, 1.5, 2],
    }),
  });

  TestValidator.equals("malformed mesh fails", invalid.success, false);
  TestValidator.predicate(
    "non-finite position violation",
    hasViolation(
      invalid,
      "range",
      "$input.parts[0].geometry.mesh.positions[4]",
    ),
  );
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
  TestValidator.predicate(
    "fractional index violation",
    hasViolation(invalid, "range", "$input.parts[0].geometry.mesh.indices[4]"),
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

  for (const value of [Number.NaN, Number.POSITIVE_INFINITY]) {
    const positions: number[] = [...VALID_MESH.positions];
    positions[4] = value;
    const result: IAutoMovieValidation = validateModel({
      model: modelWithMesh({ ...VALID_MESH, positions }),
    });
    TestValidator.predicate(
      "nonfinite positions report before topology",
      hasViolation(
        result,
        "range",
        "$input.parts[0].geometry.mesh.positions[4]",
      ),
    );
  }
  const missingPosition: number[] = withoutArraySlot(VALID_MESH.positions, 4);
  const missingIndex: number[] = withoutArraySlot([0, 1, 2], 1);
  const missingRelief: number[] = withoutArraySlot([0, 1, 0], 1);
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
  const missingWeights: number[] = withoutArraySlot(skin.weights, 3);
  const missingBoneIndex: number[] = withoutArraySlot(skin.boneIndices, 3);
  const missingJoint: AutoMovieHumanoidBone[] =
    new Array<AutoMovieHumanoidBone>(1);
  const cases: {
    mesh: IAutoMovieMesh;
    kind: "range" | "type";
    field: string;
  }[] = [
    {
      mesh: { ...VALID_MESH, positions: missingPosition },
      kind: "range",
      field: "positions[4]",
    },
    {
      mesh: { ...VALID_MESH, indices: missingIndex },
      kind: "range",
      field: "indices[1]",
    },
    {
      mesh: { ...VALID_MESH, reliefWeights: missingRelief },
      kind: "range",
      field: "reliefWeights[1]",
    },
    {
      mesh: { ...VALID_MESH, skin: { ...skin, weights: missingWeights } },
      kind: "range",
      field: "skin.weights[3]",
    },
    {
      mesh: { ...VALID_MESH, skin: { ...skin, boneIndices: missingBoneIndex } },
      kind: "range",
      field: "skin.boneIndices[3]",
    },
    {
      mesh: { ...VALID_MESH, skin: { ...skin, joints: missingJoint } },
      kind: "type",
      field: "skin.joints[0]",
    },
  ];
  for (const entry of cases) {
    const result: IAutoMovieValidation = validateModel({
      model: modelWithMesh(entry.mesh),
    });
    TestValidator.predicate(
      "each required resident slot is admitted by index",
      hasViolation(
        result,
        entry.kind,
        "$input.parts[0].geometry.mesh." + entry.field,
      ),
    );
  }
}
