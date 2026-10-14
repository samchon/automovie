import {
  type IAutoMovieSignedMeshQueryHit,
  createAutoMovieSignedMeshQuery,
} from "@automovie/engine";
import { type IAutoMovieMesh } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { createSignedOctahedron } from "../internal/createSignedMeshFixture";
import { throwsError } from "../internal/predicates";

/**
 * Malformed or unrepresentable distance inputs fail before a misleading result.
 * Scenarios:
 * 1. Empty, incomplete, nonfinite and out-of-range buffers refuse.
 * 2. Collapsed triangles, zero pseudonormals, lost Gram rank and overflow refuse.
 * 3. Non-XYZ, nonfinite and overflowing query coordinates refuse.
 *
 * @evidence contracts/testing.md#behavioral-verification Compiles each existing malformed surface and submits each malformed point to the valid compiled octahedron, requiring a named Signed geometry refusal. This catches unsupported rank, normals or coordinates becoming a misleading distance instead of rejecting the operation.
 * @evidence contracts/testing.md#independent-expectations Whole finite XYZ/index buffers, resident integer triangle references, finite nonzero feature normals, positive finite Gram rank and finite query-distance arithmetic are the boundary's contract. Authored collapsed/opposite/thin/extreme cases violate those premises. These refusal probes do not independently establish all admitted surfaces or distinguish every diagnostic beyond the Signed boundary name.
 * @evidence contracts/testing.md#distinguishing-cases Preserves eleven empty/ragged/nonfinite/index/collapse/opposed-normal/rank/overflow surface twins and six short/long/nonfinite/overflow query points. Analytic successful features and closed-manifold/sheet policy decisions are owned by companion entries.
 * @evidence contracts/testing.md#execution-ownership The discoverable named entry directly calls portable signed-query/index source with the existing octahedron fixture and exception observer. It installs no consumer, builds no native artifact and starts no process, browser or GPU; it owns all original failure rows without dynamic registration.
 */
export function test_geometry_signed_mesh_refusals(): void {
  const source: IAutoMovieMesh = createSignedOctahedron();
  const invalid: IAutoMovieMesh[] = [
    { ...source, positions: [], indices: [] },
    { ...source, positions: [0] },
    {
      ...source,
      positions: source.positions.map((v: number, i: number): number =>
        i === 0 ? NaN : v,
      ),
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
    {
      ...source,
      positions: source.positions.map((v: number): number => v * 1e100),
    },
    {
      ...source,
      positions: source.positions.map((v: number): number => v * 1e200),
    },
  ];
  for (const mesh of invalid)
    TestValidator.predicate(
      "invalid metric surface refused",
      throwsError(
        (): ((point: readonly number[]) => IAutoMovieSignedMeshQueryHit) =>
          createAutoMovieSignedMeshQuery(mesh),
        "Signed",
      ),
    );
  const sample: (point: readonly number[]) => IAutoMovieSignedMeshQueryHit =
    createAutoMovieSignedMeshQuery(source);
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
      throwsError(
        (): IAutoMovieSignedMeshQueryHit => sample(point),
        "Signed mesh",
      ),
    );
}
