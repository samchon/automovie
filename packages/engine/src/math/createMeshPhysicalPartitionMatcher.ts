import type { IAutoMovieMesh } from "@automovie/interface";

import { triangleIndicesOf } from "../geometry/triangleIndicesOf";
import { weldedDegenerateTriangles } from "../geometry/weldedDegenerateTriangles";
import { resolveAutoMovieMeshPhysicalVertices } from "./resolveAutoMovieMeshPhysicalVertices";

/**
 * Capture mesh connectivity, physical source meaning and the legacy partition
 * before reusing an earlier topology admission. Source aliases still need
 * current-grid agreement; legacy vertices are rewelded on every candidate.
 * Coordinate-collapsed face ordinals are also captured: a formerly redundant
 * triangle becoming active changes incidence even with fixed source identities.
 * A source ID/domain mutation invalidates reuse even if incidence is unchanged.
 * Absolute positions and source-table numbering may change without changing
 * these facts. Capture owns its arrays, so later caller mutations cannot rewrite
 * its expectation. This matcher does not admit the initial topology or certify
 * any geometry, area, material, normal or intersection.
 *
 * The positions-only createMeshWeldPartitionMatcher retains its legacy API.
 * This mesh matcher also checks connectivity because its candidate includes it.
 * Invalid capture throws; malformed candidates return false for ordinary
 * validation rather than reusing a cached verdict. XYZ units are metres.
 *
 * @evidence requirements/asset-authoring/validation.md#asset-geometry-validation Invalidates topology reuse on changed connectivity, source meaning, legacy equivalence or coordinate-collapsed face participation.
 * @evidence specifications/asset-and-representation/fidelity-and-validation.md#asset-spec-validation-numeric-structure Captures owned equivalence and participation data through the shared physical resolver and coordinate-degeneracy owner.
 */
export function createMeshPhysicalPartitionMatcher(mesh: IAutoMovieMesh) {
  const capture = (input: IAutoMovieMesh) => {
    if (Array.from(input.positions).some((value) => !Number.isFinite(value)))
      throw new Error("A mesh physical partition needs finite XYZ tuples.");
    const indices = triangleIndicesOf(input, "mesh physical partition").slice();
    const resolved = resolveAutoMovieMeshPhysicalVertices(input);
    const degenerate = weldedDegenerateTriangles(input);
    const sources = resolved.vertices.map((identity, vertex) =>
      input.physicalVertices === undefined ||
      input.physicalVertices.vertices[vertex] === null
        ? null
        : resolved.labels[identity],
    );
    return { indices, vertices: resolved.vertices, sources, degenerate };
  };
  const expected = capture(mesh);
  return (candidate: IAutoMovieMesh): boolean => {
    try {
      const actual = capture(candidate);
      const equal = <T>(a: readonly T[], b: readonly T[]): boolean =>
        a.length === b.length && a.every((value, index) => value === b[index]);
      return (
        equal(expected.indices, actual.indices) &&
        equal(expected.vertices, actual.vertices) &&
        equal(expected.sources, actual.sources) &&
        equal(expected.degenerate, actual.degenerate)
      );
    } catch {
      return false;
    }
  };
}
