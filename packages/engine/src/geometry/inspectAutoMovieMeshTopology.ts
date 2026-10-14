import { IAutoMovieMesh } from "@automovie/interface";

import { MESH_WELD_GRID } from "../constants/MESH_WELD_GRID";
import { IAutoMovieResolvedPhysicalVertices } from "../math/IAutoMovieResolvedPhysicalVertices";
import { resolveAutoMovieMeshPhysicalVertices } from "../math/resolveAutoMovieMeshPhysicalVertices";
import { IAutoMovieMeshTopology } from "./IAutoMovieMeshTopology";
import { triangleIndicesOf } from "./triangleIndicesOf";

/**
 * Measure a mesh's triangle topology and signed volume from its actual buffers instead of assuming them.
 *
 * Without physical source correspondence, vertices weld by position on the `MESH_WELD_GRID` lattice, so face-local corners can still form one shell. A mesh that declares physical sources instead keeps their incidence across contact: two different sources stay distinct even where they touch. A triangle whose corners collapse onto fewer than three grid cells is counted degenerate, by ordinal, and contributes no edges in either mode. A closed solid reports `watertight`; an assembly whose members share faces, or a surface meant to stay open, reports its boundary and non-manifold edge counts rather than passing. Non-finite components are counted across positions, normals, UVs, colours and relief weights. Coordinates are metres and the volume, by the divergence theorem, is cubic metres, positive for an outward-wound closed shell.
 *
 * This measures; it does not judge. `validateMeshTopology` is the verdict on the same surface, adding winding consistency and an `expectClosed` declaration, and `validateModel` runs it on every mesh a model carries. A malformed index buffer and invalid physical correspondence throw their own named refusals. The mesh is only read.
 *
 * @param mesh Mesh to measure.
 * @returns Counts, degenerate ordinals, closure and volume.
 *
 * @evidence contracts/common.md#principled-implementation Count undirected edge incidence over physical ids or rounded-position keys: one use is boundary and more than two is nonmanifold. The nonempty two-use census supplies watertight, not a full vertex-manifold, winding, nondegeneracy or finiteness proof; volume sums signed tetrahedra against the origin, subject to binary64 overflow and cancellation.
 * @evidence contracts/common.md#clear-and-simple-design Measurement only; the pass/fail verdict lives in `validateMeshTopology`, index admission in `triangleIndicesOf`, and physical identity in `resolveAutoMovieMeshPhysicalVertices`, which this reads instead of reinterpreting.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The weld grid is the shared `MESH_WELD_GRID` constant rather than a local tolerance, degenerate triangles are reported instead of dropped silently, and an empty mesh is not watertight because having no edges is not having no holes.
 * @evidence contracts/common.md#meaningful-documentation States identity modes, coordinate-weld degeneracy, attribute finiteness, edge-census limits, units and signed volume, the separate validator and named index/physical-source refusals.
 * @evidence contracts/performance.md#efficient-algorithms Linear in vertices and triangles: one finiteness pass per attribute without concatenating them, and one hashed edge count per triangle edge keyed by welded corner strings.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each call measures the mesh it is given and keeps nothing, so a caller that needs the report twice keeps the first one.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Call-local storage includes at most three edge keys per triangle, a generated index run for nonindexed input and the optional physical-vertex correspondence. Only the returned degenerate ordinal list and scalar report survive; no mesh or topology cache is retained.
 * @author Samchon
 */
export const inspectAutoMovieMeshTopology: (mesh: IAutoMovieMesh) => IAutoMovieMeshTopology = (
  mesh: IAutoMovieMesh,
): IAutoMovieMeshTopology => {
  const nonFinite: number =
    countNonFinite(mesh.positions) +
    countNonFinite(mesh.normals) +
    countNonFinite(mesh.uvs) +
    countNonFinite(mesh.colors ?? null) +
    countNonFinite(mesh.reliefWeights ?? null);
  const indices: number[] = triangleIndicesOf(mesh, "mesh topology");
  const physical: IAutoMovieResolvedPhysicalVertices | undefined =
    mesh.physicalVertices === undefined
      ? undefined
      : resolveAutoMovieMeshPhysicalVertices(mesh);
  const key: (at: number) => string = (at: number): string =>
    [0, 1, 2]
      .map((axis: number): number =>
        Math.round(mesh.positions[at * 3 + axis]! * MESH_WELD_GRID),
      )
      .join(",");
  const edges: Map<string, number> = new Map();
  const degenerateTriangles: number[] = [];
  for (let index: number = 0; index < indices.length; index += 3) {
    const coordinateCorners: string[] = [0, 1, 2].map(
      (corner: number): string => key(indices[index + corner]!),
    );
    if (new Set(coordinateCorners).size < 3) {
      degenerateTriangles.push(index / 3);
      continue;
    }
    const corners: string[] =
      physical === undefined
        ? coordinateCorners
        : [0, 1, 2].map((corner: number): string =>
            String(physical.vertices[indices[index + corner]!]),
          );
    for (let edge: number = 0; edge < 3; ++edge) {
      // The degenerate skip above leaves three distinct corner keys, so the
      // two ends of an edge can never compare equal here.
      const name: string = [corners[edge]!, corners[(edge + 1) % 3]!]
        .sort((left: string, right: string): number =>
          left < right ? -1 : 1,
        )
        .join("|");
      edges.set(name, (edges.get(name) ?? 0) + 1);
    }
  }
  let boundaryEdges: number = 0;
  let nonManifoldEdges: number = 0;
  for (const count of edges.values())
    if (count === 1) boundaryEdges += 1;
    else if (count > 2) nonManifoldEdges += 1;
  let sixVolume: number = 0;
  const p: number[] = mesh.positions;
  for (let index: number = 0; index < indices.length; index += 3) {
    const a: number = indices[index]! * 3;
    const b: number = indices[index + 1]! * 3;
    const c: number = indices[index + 2]! * 3;
    sixVolume +=
      p[a]! * (p[b + 1]! * p[c + 2]! - p[b + 2]! * p[c + 1]!) +
      p[a + 1]! * (p[b + 2]! * p[c]! - p[b]! * p[c + 2]!) +
      p[a + 2]! * (p[b]! * p[c + 1]! - p[b + 1]! * p[c]!);
  }
  return {
    triangles: indices.length / 3,
    degenerate: degenerateTriangles.length,
    degenerateTriangles,
    nonFinite,
    boundaryEdges,
    nonManifoldEdges,
    watertight: edges.size > 0 && boundaryEdges === 0 && nonManifoldEdges === 0,
    volume: sixVolume / 6,
  };
};

/**
 * How many components of one optional attribute buffer are not finite numbers, counted in place so measuring a merged building never allocates a second copy of its buffers.
 */
const countNonFinite: (values: readonly number[] | null) => number = (values: readonly number[] | null): number => {
  if (values === null) return 0;
  let count: number = 0;
  for (const value of values) if (Number.isFinite(value) === false) ++count;
  return count;
};
