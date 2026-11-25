import type { IAutoMovieMesh, IAutoMovieMeshPiece } from "@automovie/interface";

import { measureWeldedMeshPieces } from "./measureWeldedMeshPieces";
import { weldAutoMovieMeshCorners } from "./weldAutoMovieMeshCorners";

/**
 * Report the topology of each piece of a mesh: its counts, boundary loops,
 * Euler characteristic, manifoldness, orientability, stored winding and genus.
 *
 * Corners are welded exactly as `inspectAutoMovieMeshTopology` welds them,
 * through the shared `weldAutoMovieMeshCorners`: on the `MESH_WELD_GRID`
 * lattice, or by declared physical sources. Degenerate triangles are skipped as
 * that report skips them. The remaining triangles split into pieces connected
 * through shared edges, so a cube whose faces carry their own corners is one
 * piece while two solids touching at one corner are two. Each piece reports its
 * welded vertex, undirected edge and triangle counts, its boundary loops as
 * connected components of the edges one triangle uses, and `euler = vertices -
 * edges + faces`.
 *
 * A piece is `manifold` when every edge has one or two triangles and each
 * vertex's triangles in the piece form one fan, joined through edges at that
 * vertex. Orientability is asked of the triangles, not of their stored order: a
 * manifold piece is orientable when its triangles can be flipped so every
 * two-triangle edge is traversed oppositely, which a breadth-first
 * two-colouring decides when the stored order does not already give a
 * compatible orientation. It is null for a piece that is not manifold.
 * `consistentlyWound` asks whether the stored order already does so: every edge
 * shared by several triangles is traversed as often in each direction. The
 * genus, `(2 - euler - boundaryLoops) / 2` by the classification of compact
 * surfaces, is reported only for a manifold orientable piece and is null
 * otherwise.
 *
 * Pieces are ordered by their lowest triangle ordinal. A mesh without
 * non-degenerate triangles has no piece. The mesh is only read. A malformed
 * index buffer and invalid physical correspondence throw the same refusals as
 * `inspectAutoMovieMeshTopology`.
 *
 * @param mesh Mesh to measure.
 * @returns One record per piece, in first-triangle order.
 */
export const measureAutoMovieMeshPieces: (
  mesh: IAutoMovieMesh,
) => IAutoMovieMeshPiece[] = (mesh: IAutoMovieMesh): IAutoMovieMeshPiece[] => {
  return measureWeldedMeshPieces(
    weldAutoMovieMeshCorners(mesh, "mesh topology"),
  );
};
