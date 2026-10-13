import type { IAutoMovieMesh as ImportedIAutoMovieMesh, IAutoMovieVector3 as ImportedIAutoMovieVector3 } from "@automovie/interface";
import { Vector3 } from "@automovie/engine";

import type { IHumanFaceMeasurementContext } from "./IHumanFaceMeasurementContext";
import type { IHumanFaceMeasurementGap } from "./IHumanFaceMeasurementGap";

/**
 * Read generated shaft count or sampled centreline length from final geometry.
 *
 * Connectivity, not requested count or card area, counts the independent tubes. The row producer's regular 8-column, 12-row shading lattice supplies one ring centre from its eight distinct angular points; the duplicated seam is excluded. The longest sum of the twelve straight centreline segments is reported in millimetres. This is a lower approximation to the analytic arc length and is not a photographic visible length or a biological follicle count. An explicitly empty generated row measures zero; retained cards give a named instrument gap.
 *
 * @evidence contracts/common.md#principled-implementation Used mesh connectivity supplies component count and the generated shaft ring layout supplies chord-summed lengths.
 * @evidence contracts/common.md#clear-and-simple-design Count and length read emitted geometry rather than authored lash-count requests or alpha-card area.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Length relies on producer-ordered 117-vertex shafts with thirteen nine-vertex rings; buffer divisibility does not independently prove that layout.
 * @evidence contracts/common.md#meaningful-documentation Missing shaft meshes remain gaps, empty emitted geometry reads zero, and polyline length converts metres to millimetres.
 * @evidence contracts/performance.md#efficient-algorithms Connectivity union/find uses path compression without rank balancing; length scans ring centres, with traversal cost dependent on the parent forest.
 * @evidence contracts/performance.md#reuse-equivalent-work One connectivity population and packed shaft layout serve the chosen metric instead of a separate requested-count fallback.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Parent/used sets and ring-centre arrays are temporary; the scalar result retains no mesh.
 */
export function readHumanFaceLashGeometry(
  context: IHumanFaceMeasurementContext,
  side: "left" | "right",
  row: "upper" | "lower",
  quantity: "shaftCount" | "longestSampledCentrelineLength",
): number | IHumanFaceMeasurementGap {
  const mesh: ImportedIAutoMovieMesh | null | undefined = context.lashMesh?.(side, row);
  const gap: (cause: string) => IHumanFaceMeasurementGap = (cause: string): IHumanFaceMeasurementGap => ({
    reason: `unread generated ${side} ${row} lashes: ${cause}`,
  });
  if (mesh === undefined || mesh === null)
    return gap("this build retains cards without individual shaft geometry");
  const vertices: number = mesh.positions.length / 3;
  if (vertices === 0 && mesh.indices?.length === 0) return 0;
  if (
    !Number.isSafeInteger(vertices) ||
    vertices % 117 !== 0 ||
    !mesh.positions.every(Number.isFinite) ||
    mesh.indices === null
  )
    return gap("the row's complete finite tube lattice is not present");
  const parent: number[] = Array.from({ length: vertices }, (_: unknown, vertex: number): number => vertex);
  const root: (vertex: number) => number = (vertex: number): number => {
    let current: number = vertex;
    while (parent[current] !== current) current = parent[current];
    while (parent[vertex] !== current) {
      const next: number = parent[vertex];
      parent[vertex] = current;
      vertex = next;
    }
    return current;
  };
  const used: Set<number> = new Set<number>();
  for (let at: number = 0; at < mesh.indices.length; at += 3) {
    const a: number = mesh.indices[at],
      b: number = mesh.indices[at + 1],
      c: number = mesh.indices[at + 2];
    if (
      [a, b, c].some(
        (vertex: number): boolean =>
          !Number.isSafeInteger(vertex) || vertex < 0 || vertex >= vertices,
      )
    )
      return gap("invalid triangle connectivity");
    used.add(a);
    used.add(b);
    used.add(c);
    parent[root(b)] = root(a);
    parent[root(c)] = root(a);
  }
  const count: number = new Set([...used].map(root)).size;
  if (quantity === "shaftCount") return count;
  let longest: number = 0;
  for (let shaft: number = 0; shaft * 117 < vertices; shaft++) {
    const points: ImportedIAutoMovieVector3[] = Array.from({ length: 13 }, (_: unknown, ring: number): ImportedIAutoMovieVector3 => {
      const sum: ImportedIAutoMovieVector3 = Vector3.create();
      for (let angular: number = 0; angular < 8; angular++) {
        const at: number = 3 * (shaft * 117 + ring * 9 + angular);
        sum.x += mesh.positions[at] / 8;
        sum.y += mesh.positions[at + 1] / 8;
        sum.z += mesh.positions[at + 2] / 8;
      }
      return sum;
    });
    const length: number = points
      .slice(1)
      .reduce(
        (sum: number, point: ImportedIAutoMovieVector3, at: number): number =>
          sum + Vector3.length(Vector3.subtract(point, points[at])),
        0,
      );
    longest = Math.max(longest, length * 1000);
  }
  return longest;
}
