import { resolveAutoMovieMeshPhysicalVertices } from "@automovie/engine";
import type {
  IAutoMovieMesh,
  IAutoMovieResolvedPhysicalVertices,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { createPhysicalMesh } from "../../../internal/createPhysicalMesh";

/**
 * `resolveAutoMovieMeshPhysicalVertices` maps mesh vertices to physical
 * vertices: source aliases share incidence while independent contact stays
 * distinct.
 *
 * Mesh: positions (0,0,0), (-0,0,0), (0,0,0), (1,0,0), indices 0, 1, 3.
 *
 * Scenarios:
 *
 * 1. Legacy coincidence follows the nanometre grid, signed zero included: labels
 *    "0,0,0" and "1000000000,0,0", vertices 0, 0, 0, 1.
 * 2. With explicit sources (the first two sharing a maximal safe id) the resolved
 *    vertices are 0, 0, 1, 2; editing the returned array does not change the
 *    next resolution.
 * 3. With null legacy vertices after the first, the null cohort forms its own
 *    cells: 0, 1, 1, 2.
 * 4. Two coincident vertices of domains "instance/1" (id 23) and "instance/12" (id
 *    3) stay distinct: 0, 1.
 * 5. An empty explicit population resolves to empty labels and vertices.
 */
export function test_unit_engine_geometry_physical_vertices(): void {
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
  mesh.physicalVertices!.sources[3]!.domain = "another-instance";
  const first: IAutoMovieResolvedPhysicalVertices =
    resolveAutoMovieMeshPhysicalVertices(mesh);
  TestValidator.equals("alias and contact", first.vertices, [0, 0, 1, 2]);
  first.vertices.fill(42);
  TestValidator.equals(
    "owned output",
    resolveAutoMovieMeshPhysicalVertices(mesh).vertices,
    [0, 0, 1, 2],
  );
  mesh.physicalVertices!.vertices = [0, null, null, null];
  TestValidator.equals(
    "null cohort",
    resolveAutoMovieMeshPhysicalVertices(mesh).vertices,
    [0, 1, 1, 2],
  );
  const pairs: IAutoMovieMesh = createPhysicalMesh(
    [0, 0, 0, 0, 0, 0],
    [],
    [23, 3],
  );
  pairs.physicalVertices!.sources[0]!.domain = "instance/1";
  pairs.physicalVertices!.sources[1]!.domain = "instance/12";
  TestValidator.equals(
    "pair boundaries",
    resolveAutoMovieMeshPhysicalVertices(pairs).vertices,
    [0, 1],
  );
  TestValidator.equals(
    "empty",
    resolveAutoMovieMeshPhysicalVertices({
      positions: [],
      physicalVertices: { sources: [], vertices: [] },
    }),
    { labels: [], vertices: [] },
  );
}
