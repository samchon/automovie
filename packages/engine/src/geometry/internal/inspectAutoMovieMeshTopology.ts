import {
  IAutoMovieMesh,
  type IAutoMovieMeshTopology,
} from "@automovie/interface";

import { createMeshEdgeKey } from "../../math/internal/createMeshEdgeKey";
import { weldAutoMovieMeshCorners } from "./weldAutoMovieMeshCorners";

/**
 * Measure a mesh's triangle topology and signed volume from its actual buffers
 * instead of assuming them.
 *
 * Without physical source correspondence, vertices weld by position on the
 * `MESH_WELD_GRID` lattice, so face-local corners can still form one shell. A
 * mesh that declares physical sources instead keeps their incidence across
 * contact: two different sources stay distinct even where they touch. A
 * triangle whose corners collapse onto fewer than three grid cells is counted
 * degenerate, by ordinal, and contributes no edges in either mode. A closed
 * solid reports `watertight`; an assembly whose members share faces, or a
 * surface meant to stay open, reports its boundary and non-manifold edge counts
 * rather than passing. Non-finite components are counted across positions,
 * normals, UVs, colours and relief weights. Coordinates are metres and the
 * volume, by the divergence theorem, is cubic metres, positive for an
 * outward-wound closed shell.
 *
 * This measures; it does not judge. `validateMeshTopology` is the verdict on
 * the same surface, adding winding consistency and an `expectClosed`
 * declaration, and `validateModel` runs it on every mesh a model carries. A
 * malformed index buffer and invalid physical correspondence throw their own
 * named refusals. The mesh is only read.
 *
 * @param mesh Mesh to measure.
 * @returns Counts, degenerate ordinals, closure and volume.
 */
export const inspectAutoMovieMeshTopology: (
  mesh: IAutoMovieMesh,
) => IAutoMovieMeshTopology = (
  mesh: IAutoMovieMesh,
): IAutoMovieMeshTopology => {
  const {
    indices,
    corners,
    degenerate: degenerateTriangles,
    identities,
  }: weldAutoMovieMeshCorners.IResult = weldAutoMovieMeshCorners(
    mesh,
    "mesh topology",
  );
  const edgeKey: (from: number, to: number) => number | string =
    createMeshEdgeKey(identities);
  const edges: Map<number | string, number> = new Map();
  for (let index: number = 0; index < indices.length; index += 3) {
    if (corners[index]! < 0) continue;
    for (let edge: number = 0; edge < 3; ++edge) {
      const from: number = corners[index + edge]!;
      const to: number = corners[index + ((edge + 1) % 3)]!;
      const name: number | string = edgeKey(
        Math.min(from, to),
        Math.max(from, to),
      );
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
    boundaryEdges,
    nonManifoldEdges,
    watertight: edges.size > 0 && boundaryEdges === 0 && nonManifoldEdges === 0,
    volume: sixVolume / 6,
  };
};
