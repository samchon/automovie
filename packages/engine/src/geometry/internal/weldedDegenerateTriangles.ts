import {
  IAutoMovieMesh,
  type IAutoMovieWeldMeshVertices,
} from "@automovie/interface";

import { weldMeshVertices } from "../../math/internal/weldMeshVertices";
import { triangleIndicesOf } from "./triangleIndicesOf";

/*
 * Original ordinals of the triangles whose corners repeat a vertex on the
 * topology weld grid.
 *
 * Two corners repeat when their positions round to the same cell of the
 * engine's shared nanometre grid, `MESH_WELD_GRID`, even if they are different
 * index entries, so a seam pole or a collapsed fan counts. The portrait Float32
 * gate uses these ordinals to tell an existing seam or pole from a face newly
 * collapsed by single precision, the physical partition matcher requires a
 * repartitioned mesh to keep the same population, and the human local frame
 * skips them when it checks face directions. Only the triangle population is
 * answered, without the edge incidence or signed volume of a complete topology
 * report. Positions are local metres; neither the mesh nor its connectivity is
 * changed.
 * Parameter mesh: Mesh to inspect.
 * Returns: Ascending ordinals of degenerate triangles.
 * Error when the index run is malformed.
 */
export function weldedDegenerateTriangles(mesh: IAutoMovieMesh): number[] {
  const indices: number[] = triangleIndicesOf(mesh, "mesh topology");
  const { vertices }: IAutoMovieWeldMeshVertices.IResult = weldMeshVertices(
    mesh.positions,
  );
  const degenerate: number[] = [];
  for (let at: number = 0; at < indices.length; at += 3) {
    const a: number = vertices[indices[at]!]!;
    const b: number = vertices[indices[at + 1]!]!;
    const c: number = vertices[indices[at + 2]!]!;
    if (a === b || b === c || c === a) degenerate.push(at / 3);
  }
  return degenerate;
}
