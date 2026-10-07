import { resolveAutoMovieMeshPhysicalVertices } from "@automovie/engine/math/resolveAutoMovieMeshPhysicalVertices";
import { TestValidator } from "@nestia/e2e";

import { createPhysicalMesh } from "../internal/createPhysicalMesh";

/**
 * Actual source aliases share incidence while independent contact stays distinct.
 * Scenarios:
 * 1. Legacy coincidence follows the existing grid, including signed zero.
 * 2. Duplicate source rows alias; maximal safe IDs and delimiter-like domains
 *    remain opaque pairs, not array bounds or concatenated collision keys.
 * 3. Null legacy vertices share current coordinate cells without aliasing source.
 * 4. Owned resolved output cannot rewrite another evaluation's correspondence.
 */
export const test_geometry_physical_vertices = (): void => {
  const positions = [0, 0, 0, -0, 0, 0, 0, 0, 0, 1, 0, 0];
  const legacy = createPhysicalMesh(positions, [0, 1, 3]);
  TestValidator.equals(
    "legacy grid",
    resolveAutoMovieMeshPhysicalVertices(legacy),
    {
      labels: ["0,0,0", "1000000000,0,0"],
      vertices: [0, 0, 0, 1],
    },
  );
  const mesh = createPhysicalMesh(
    positions,
    [0, 1, 3],
    [Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER, 7, 7],
  );
  mesh.physicalVertices!.sources[3].domain = "another-instance";
  const first = resolveAutoMovieMeshPhysicalVertices(mesh);
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
  const pairs = createPhysicalMesh([0, 0, 0, 0, 0, 0], [], [23, 3]);
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
};
