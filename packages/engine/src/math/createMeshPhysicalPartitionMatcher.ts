import { IAutoMovieResolvedPhysicalVertices } from "./IAutoMovieResolvedPhysicalVertices";
import { IAutoMovieMesh } from "@automovie/interface";
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
 * Invalid capture throws; malformed candidates return false for ordinary
 * validation rather than reusing a cached verdict. XYZ units are metres.
 *
 * @evidence contracts/common.md#principled-implementation Captured connectivity, physical ordinals, explicit source labels and degenerate-face ordinals determine topology reuse; moved coordinates are equivalent only while those facts remain unchanged.
 * @evidence contracts/common.md#clear-and-simple-design Shared triangle admission, physical identity and welding own component checks; this matcher combines their captured facts.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Malformed candidates return false for ordinary validation, and changed source domains cannot hide behind unchanged incidence labels.
 * @evidence contracts/common.md#meaningful-documentation States captured facts, allowed coordinate/table changes, copied expectations and geometry properties the match does not certify.
 * @evidence contracts/performance.md#efficient-algorithms For V vertices and T triangles, capture and comparison cost O(V plus T), using linear weld maps and copied arrays.
 * @evidence contracts/performance.md#reuse-equivalent-work Expected connectivity and partitions are captured once for many candidates; equivalence includes source meaning and degenerate-face population rather than absolute positions.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The closure retains copied expected arrays; candidate maps are released after comparison, and releasing the closure releases its linear-size expectation.
 */
export function createMeshPhysicalPartitionMatcher(mesh: IAutoMovieMesh): (candidate: IAutoMovieMesh) => boolean {
  const capture: (input: IAutoMovieMesh) => { indices: number[]; vertices: number[]; sources: (string | null)[]; degenerate: number[]; } = (input: IAutoMovieMesh): { indices: number[]; vertices: number[]; sources: (string | null)[]; degenerate: number[]; } => {
    if (Array.from(input.positions).some((value: number): boolean => !Number.isFinite(value)))
      throw new Error("A mesh physical partition needs finite XYZ tuples.");
    const indices: number[] = triangleIndicesOf(input, "mesh physical partition").slice();
    const resolved: IAutoMovieResolvedPhysicalVertices = resolveAutoMovieMeshPhysicalVertices(input);
    const degenerate: number[] = weldedDegenerateTriangles(input);
    const sources: (string | null)[] = resolved.vertices.map((identity: number, vertex: number): string | null =>
      input.physicalVertices === undefined ||
      input.physicalVertices.vertices[vertex] === null
        ? null
        : resolved.labels[identity],
    );
    return { indices, vertices: resolved.vertices, sources, degenerate };
  };
  const expected: { indices: number[]; vertices: number[]; sources: (string | null)[]; degenerate: number[]; } = capture(mesh);
  return (candidate: IAutoMovieMesh): boolean => {
    try {
      const actual: { indices: number[]; vertices: number[]; sources: (string | null)[]; degenerate: number[]; } = capture(candidate);
      const equal: <T>(a: readonly T[], b: readonly T[]) => boolean = <T>(a: readonly T[], b: readonly T[]): boolean =>
        a.length === b.length && a.every((value: T, index: number): boolean => value === b[index]);
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
