import { validateModel } from "@automovie/engine";
import {
  IAutoMovieConstraintViolation,
  IAutoMovieMesh,
  IAutoMovieModel,
  IAutoMovieModelPart,
  IAutoMovieValidation,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { createModel } from "../internal/fixtures";
import { hasViolation, namedFacts } from "../internal/predicates";

const modelWithMesh: (mesh: IAutoMovieMesh) => IAutoMovieModel = (
  mesh: IAutoMovieMesh,
): IAutoMovieModel => {
  const base: IAutoMovieModel = createModel(null);
  return {
    ...base,
    origin: "imported",
    parts: base.parts.map(
      (part: IAutoMovieModelPart): IAutoMovieModelPart => ({
        ...part,
        geometry: { type: "mesh", mesh },
      }),
    ),
  };
};

/**
 * An empty position buffer is a multiple of 3, so the tuple-length check
 * accepts it and every downstream buffer stays "consistent" at vertexCount 0: a
 * mesh with no vertices used to validate clean and only degenerate at
 * render/export. validateModel now rejects it, mirroring a primitive's
 * strictly-positive extents, so the correction round catches empty geometry.
 *
 * Scenarios:
 *
 * 1. Empty positions, all optional buffers null: a positions type violation (the
 *    dependent buffers are absent, so nothing masks the empty-vertex fault).
 * 2. Empty positions with empty normals/uvs/indices: each is length 0, so the
 *    per-vertex length checks all pass at vertexCount 0; the only violation is
 *    the empty positions itself (the dependent buffers do not drift).
 * 3. A single-vertex mesh (the minimum) still validates: the check is "at least
 *    one", not "at least a triangle".
 *
 * @evidence contracts/testing.md#behavioral-verification Calls validateModel for empty position buffers with absent or empty dependent buffers and requires a positions type finding, then admits the single-vertex neighbor. The empty-dependent case rejects any finding at another path, catching both missing emptiness admission and spurious buffer-length faults.
 * @evidence contracts/testing.md#independent-expectations A mesh requires at least one vertex; zero-length dependent arrays match zero vertices but cannot supply the missing position. Literal paths and the one-vertex control follow that admission contract; the test does not demand an exact duplicate-finding count or a renderable triangle.
 * @evidence contracts/testing.md#distinguishing-cases Contrasts empty positions with null versus zero-length normals/UVs/indices and the smallest nonempty position triple. Malformed numeric tuples, topology and skin packing are owned by other mesh validation entries.
 * @evidence contracts/testing.md#execution-ownership The named synchronous unit supplies the existing skeleton-free model fixture and local numeric buffers to portable validation, with no export process, decoder, renderer or filesystem fixture.
 */
export function test_validation_model_mesh_empty(): void {
  const bare: IAutoMovieValidation = validateModel({
    model: modelWithMesh({
      positions: [],
      normals: null,
      uvs: null,
      indices: null,
      skin: null,
    }),
  });
  TestValidator.equals("empty mesh fails", bare.success, false);
  TestValidator.predicate(
    "empty positions violation",
    hasViolation(bare, "type", "$input.parts[0].geometry.mesh.positions"),
  );

  const withEmptyBuffers: IAutoMovieValidation = validateModel({
    model: modelWithMesh({
      positions: [],
      normals: [],
      uvs: [],
      indices: [],
      skin: null,
    }),
  });
  TestValidator.equals(
    "empty mesh with empty dependent buffers fails",
    withEmptyBuffers.success,
    false,
  );
  TestValidator.equals(
    "empty positions is the only fault",
    namedFacts([
      [
        "hasViolationWithEmptyBuffersType",
        (): boolean =>
          hasViolation(
            withEmptyBuffers,
            "type",
            "$input.parts[0].geometry.mesh.positions",
          ),
      ],
      [
        "withEmptyBuffersSuccess",
        (): boolean => withEmptyBuffers.success === false,
      ],
      [
        "withEmptyBuffersViolationsViolation",
        (): boolean =>
          withEmptyBuffers.success === false &&
          withEmptyBuffers.violations.every(
            (violation: IAutoMovieConstraintViolation): boolean =>
              violation.path === "$input.parts[0].geometry.mesh.positions",
          ),
      ],
    ]),
    {
      hasViolationWithEmptyBuffersType: true,
      withEmptyBuffersSuccess: true,
      withEmptyBuffersViolationsViolation: true,
    },
  );

  TestValidator.equals(
    "single-vertex mesh succeeds",
    validateModel({
      model: modelWithMesh({
        positions: [0, 0, 0],
        normals: null,
        uvs: null,
        indices: null,
        skin: null,
      }),
    }).success,
    true,
  );
}
