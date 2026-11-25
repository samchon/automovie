import {
  IAutoMovieMesh,
  type IAutoMovieMeshPiece,
  type IAutoMovieMeshTopology,
} from "@automovie/interface";

import { createMeshEdgeKey } from "../math/createMeshEdgeKey";
import { measureWeldedMeshPieces } from "./measureWeldedMeshPieces";
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
export function inspectAutoMovieMeshTopology(
  mesh: IAutoMovieMesh,
): IAutoMovieMeshTopology {
  return inspectWeldedTopology(
    mesh,
    countMeshNonFinite(mesh),
    weldAutoMovieMeshCorners(mesh, "mesh topology"),
  );
}

/** Paired topology and piece inspection over one mesh's corner weld. */
export namespace inspectAutoMovieMeshTopology {
  /**
   * Inspect the mesh and prepare a piece census over the same welded corners.
   * Request `pieces()` after reading `topology` when both reports are needed.
   * The prepared function owns only the corner identities and retains no census
   * result. Invalid meshes produce the same standalone refusals.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Both diagnostics use the same explicit incidence identities. CGAL Polygon Soup Repair documents that representation at https://doc.cgal.org/6.2/PMP_Mesh_repair/index.html.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The topology value and piece reader share corner identities. Each report retains its established edge and winding algorithm.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Both diagnostics use the existing index, physical-source, finiteness and degeneracy rules. The whole-mesh edge counts do not replace the piece winding test.
   * @evidence contracts/development/implementation.md#efficient-algorithms This preparation validates and represents every corner once. The piece census performs its ordinary incidence work only when called.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The two reports share the weld created for this mesh inspection. No mesh-keyed lookup or piece result is retained.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The piece reader holds the identity array and count but no mesh attribute or incidence map. Dropping the reader releases that state.
   * @evidence contracts/development/common.md#meaningful-documentation States when to prepare both reports, what they share and how malformed input is refused.
   */
  export function prepare(mesh: IAutoMovieMesh): {
    readonly topology: IAutoMovieMeshTopology;
    readonly pieces: () => IAutoMovieMeshPiece[];
  } {
    const nonFinite: number = countMeshNonFinite(mesh);
    const welded: weldAutoMovieMeshCorners.IResult = weldAutoMovieMeshCorners(
      mesh,
      "mesh topology",
    );
    const { corners, identities } = welded;
    const cornerWeld = { corners, identities };
    return {
      topology: inspectWeldedTopology(mesh, nonFinite, welded),
      pieces: () => measureWeldedMeshPieces(cornerWeld),
    };
  }
}

/** Measure edge incidence and signed volume after the corner identities exist. */
function inspectWeldedTopology(
  mesh: IAutoMovieMesh,
  nonFinite: number,
  {
    indices,
    corners,
    degenerate,
    identities,
  }: weldAutoMovieMeshCorners.IResult,
): IAutoMovieMeshTopology {
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
    degenerate: degenerate.length,
    degenerateTriangles: degenerate,
    nonFinite,
    boundaryEdges,
    nonManifoldEdges,
    watertight: edges.size > 0 && boundaryEdges === 0 && nonManifoldEdges === 0,
    volume: sixVolume / 6,
  };
}

/** Count non-finite components across the mesh's render attribute buffers. */
function countMeshNonFinite(mesh: IAutoMovieMesh): number {
  return (
    countNonFinite(mesh.positions) +
    countNonFinite(mesh.normals) +
    countNonFinite(mesh.uvs) +
    countNonFinite(mesh.colors ?? null) +
    countNonFinite(mesh.reliefWeights ?? null)
  );
}

/**
 * How many components of one optional attribute buffer are not finite numbers,
 * counted in place so measuring a merged building never allocates a second copy
 * of its buffers.
 */
const countNonFinite: (values: readonly number[] | null) => number = (
  values: readonly number[] | null,
): number => {
  if (values === null) return 0;
  let count: number = 0;
  for (const value of values) if (Number.isFinite(value) === false) ++count;
  return count;
};
