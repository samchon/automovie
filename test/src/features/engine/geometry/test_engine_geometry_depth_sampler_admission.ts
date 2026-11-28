import { AutoMovieEngineGeometry } from "@automovie/engine";
import type { IAutoMovieMesh } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../internal/throwsError";

/**
 * A mesh depth sampler admits finite geometry and queries before indexing or
 * reading its copied triangle projection.
 *
 * Oppositely wound affine sheets supply distinct depths at one point. Mutating
 * the original mesh leaves that answer intact. An uncovered finite query or
 * zero-area projection returns null. Malformed coordinates and projected
 * arithmetic receive explicit refusals.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the depth interval, snapshot, finite misses and the separate mesh, query and arithmetic refusals.
 * @evidence contracts/development/testing.md#behavioral-verification Creates the public sampler with typed flat triangle arrays, mutates the original mesh and reads the actual envelope. Submits malformed coordinates and finite geometry with overflowing projections.
 * @evidence contracts/development/testing.md#independent-expectations The two affine Z depths are x + 2y and x + 2y + 4, giving 0.75 and 4.75 at (0.25,0.25). A point at (1,1) is outside both projected triangles. Opposite extreme projected bounds overflow only their total span.
 */
export function test_engine_geometry_depth_sampler_admission(): void {
  const create = AutoMovieEngineGeometry.createMeshDepthSampler;
  const fixture = (
    positions: number[],
    indices: number[] | null = null,
  ): IAutoMovieMesh => ({
    positions,
    indices,
    normals: null,
    uvs: null,
    skin: null,
  });
  const mesh = fixture(
    [0, 0, 0, 1, 0, 1, 0, 1, 2, 0, 0, 4, 0, 1, 6, 1, 0, 5],
    [0, 1, 2, 3, 4, 5],
  );
  const sampler = create(mesh, "z");
  const point = { minimum: 0.75, maximum: 4.75 };
  TestValidator.equals(
    "the affine sheets and their shared edge",
    [sampler(0.25, 0.25), sampler(0.5, 0.5), sampler(1, 1)],
    [point, { minimum: 1.5, maximum: 5.5 }, null],
  );
  mesh.positions.fill(1234);
  TestValidator.equals("copied geometry", sampler(0.25, 0.25), point);
  const empty = create(fixture([], []), "z");
  const flat = create(fixture([0, 0, 0, 1, 0, 1, 2, 0, 0]), "z");
  TestValidator.equals(
    "no projected faces",
    [empty(0, 0), flat(0.5, 0)],
    [null, null],
  );

  const maximum: number = Number.MAX_VALUE;
  const constant = create(
    fixture([0, 0, maximum, 1, 0, maximum, 0, 1, maximum]),
    "z",
  );
  TestValidator.equals("finite maximum depth", constant(0.5, 0.5), {
    minimum: maximum,
    maximum,
  });
  const invalid: [string, () => unknown, string][] = [
    ["NaN u", () => sampler(NaN, 0), "query coordinates must be finite"],
    [
      "infinite v",
      () => sampler(0, Infinity),
      "query coordinates must be finite",
    ],
    [
      "invalid empty query",
      () => empty(-Infinity, 0),
      "query coordinates must be finite",
    ],
    [
      "invalid projected position",
      () =>
        create(
          {
            ...mesh,
            positions: [NaN, ...mesh.positions.slice(1)],
          },
          "z",
        ),
      "finite mesh positions",
    ],
    [
      "unreferenced invalid depth",
      () =>
        create(
          {
            ...mesh,
            positions: [...mesh.positions, 0, 0, Infinity],
          },
          "z",
        ),
      "finite mesh positions",
    ],
    [
      "unrepresentable projection",
      () =>
        create(fixture([-maximum, 0, 0, maximum, 0, 0, -maximum, 0, 1]), "z"),
      "Projected triangle arithmetic",
    ],
    [
      "unrepresentable extent",
      () =>
        create(
          fixture([
            -1.2e308, 0, 0, -1e308, 0, 0, -1.2e308, 1, 0, 1e308, 0, 0, 1.2e308,
            0, 0, 1e308, 1, 0,
          ]),
          "z",
        ),
      "Projected mesh extent",
    ],
  ];
  TestValidator.equals(
    "invalid query, mesh or projection",
    invalid
      .filter(([, attempt, message]) => !throwsError(attempt, message))
      .map(([name]) => name),
    [],
  );
}
