import { createAutoMovieSignedMeshQuery } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { createSignedOctahedron } from "../internal/createSignedMeshFixture";
import { throwsError } from "../internal/predicates";

/**
 * Malformed or unrepresentable distance inputs fail before a misleading result.
 * Scenarios:
 * 1. Empty, incomplete, nonfinite and out-of-range buffers refuse.
 * 2. Collapsed triangles, zero pseudonormals, lost Gram rank and overflow refuse.
 * 3. Non-XYZ, nonfinite and overflowing query coordinates refuse.
 */
export const test_geometry_signed_mesh_refusals = (): void => {
  const source = createSignedOctahedron();
  const invalid = [
    { ...source, positions: [], indices: [] },
    { ...source, positions: [0] },
    {
      ...source,
      positions: source.positions.map((v, i) => (i === 0 ? NaN : v)),
    },
    { ...source, indices: [0, 1] },
    { ...source, indices: [0, 1, 99] },
    { ...source, indices: [0, 1, 1.5] },
    { ...source, indices: [0, 0, 0] },
    {
      ...source,
      positions: [0, 0, 0, 1, 0, 0, 0, 1, 0],
      indices: [0, 1, 2, 0, 2, 1],
    },
    {
      ...source,
      positions: [0, 0, 0, 1, 0, 0, 1, 1e-12, 0],
      indices: [0, 1, 2],
    },
    { ...source, positions: source.positions.map((v) => v * 1e100) },
    { ...source, positions: source.positions.map((v) => v * 1e200) },
  ];
  for (const mesh of invalid)
    TestValidator.predicate(
      "invalid metric surface refused",
      throwsError(() => createAutoMovieSignedMeshQuery(mesh)),
    );
  const sample = createAutoMovieSignedMeshQuery(source);
  for (const point of [
    [],
    [0, 0],
    [0, 0, 0, 0],
    [NaN, 0, 0],
    [0, Infinity, 0],
    [1e308, 0, 0],
  ])
    TestValidator.predicate(
      "invalid query refused",
      throwsError(() => sample(point)),
    );
};
