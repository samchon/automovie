import { resolveAutoMovieMeshPhysicalVertices } from "@automovie/engine/math/resolveAutoMovieMeshPhysicalVertices";
import { type IAutoMovieMesh } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { type IAutoMovieResolvedPhysicalVertices } from "../../../../packages/engine/src/math/IAutoMovieResolvedPhysicalVertices";
import { createPhysicalMesh } from "../internal/createPhysicalMesh";

/**
 * Actual source aliases share incidence while independent contact stays distinct.
 * Scenarios:
 * 1. Legacy coincidence follows the existing grid, including signed zero.
 * 2. Duplicate source rows alias; maximal safe IDs and delimiter-like domains
 *    remain opaque pairs, not array bounds or concatenated collision keys.
 * 3. Null legacy vertices share current coordinate cells without aliasing source.
 * 4. Owned resolved output cannot rewrite another evaluation's correspondence.
 *
 * @evidence contracts/testing.md#behavioral-verification Resolves legacy and explicit source-point correspondence, asserting alias ordinals, separate domains and legacy cohorts, empty output and independence from mutations of a prior result. It catches coordinate-only merging of distinct authored source pairs.
 * @evidence contracts/testing.md#independent-expectations Coincident legacy coordinates occupy one declared nanometre grid cell, while equality of opaque domain/ID pairs alone determines explicit aliases. Expected ordinals follow first render occurrence and are authored directly. These discrete identities do not establish triangle area, manifoldness or rendered contact.
 * @evidence contracts/testing.md#distinguishing-cases Preserves signed zero, duplicate source rows, maximum safe IDs, similar delimiter-containing domains, null legacy references, output ownership and an empty explicit population. Invalid source admission, placement and cache invalidation belong to companion physical tests.
 * @evidence contracts/testing.md#execution-ownership The discoverable named entry directly invokes the portable product resolver through the existing physical-mesh fixture; it installs no consumer, builds no native artifact and starts no host, browser or GPU. It owns all of its cases without dynamic registration.
 */
export function test_geometry_physical_vertices(): void {
  const positions: number[] = [0, 0, 0, -0, 0, 0, 0, 0, 0, 1, 0, 0];
  const legacy: IAutoMovieMesh = createPhysicalMesh(positions, [0, 1, 3]);
  TestValidator.equals(
    "legacy grid",
    resolveAutoMovieMeshPhysicalVertices(legacy),
    {
      labels: ["0,0,0", "1000000000,0,0"],
      vertices: [0, 0, 0, 1],
    },
  );
  const mesh: IAutoMovieMesh = createPhysicalMesh(
    positions,
    [0, 1, 3],
    [Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER, 7, 7],
  );
  mesh.physicalVertices!.sources[3].domain = "another-instance";
  const first: IAutoMovieResolvedPhysicalVertices =
    resolveAutoMovieMeshPhysicalVertices(mesh);
  TestValidator.equals(
    "actual alias and contact",
    first.vertices,
    [0, 0, 1, 2],
  );
  first.vertices.fill(42);
  TestValidator.equals(
    "owned output",
    resolveAutoMovieMeshPhysicalVertices(mesh).vertices,
    [0, 0, 1, 2],
  );
  mesh.physicalVertices!.vertices = [0, null, null, null];
  TestValidator.equals(
    "separate legacy cohort",
    resolveAutoMovieMeshPhysicalVertices(mesh).vertices,
    [0, 1, 1, 2],
  );
  const pairs: IAutoMovieMesh = createPhysicalMesh(
    [0, 0, 0, 0, 0, 0],
    [],
    [23, 3],
  );
  pairs.physicalVertices!.sources[0].domain = "instance/1";
  pairs.physicalVertices!.sources[1].domain = "instance/12";
  TestValidator.equals(
    "pair boundaries",
    resolveAutoMovieMeshPhysicalVertices(pairs).vertices,
    [0, 1],
  );
  TestValidator.equals(
    "empty explicit population",
    resolveAutoMovieMeshPhysicalVertices({
      positions: [],
      physicalVertices: { sources: [], vertices: [] },
    }),
    { labels: [], vertices: [] },
  );
}
