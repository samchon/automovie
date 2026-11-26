import type {
  IAutoMovieMesh,
  IAutoMovieResolvedPhysicalVertices,
} from "@automovie/interface";

import { MESH_WELD_GRID } from "../constants/MESH_WELD_GRID";
import { resolveAutoMovieMeshPhysicalVertices } from "../math/internal/resolveAutoMovieMeshPhysicalVertices";
import { triangleIndicesOf } from "./internal/triangleIndicesOf";

/**
 * Weld a mesh's triangle corners into the identities its topology is measured
 * over, the one weld `inspectAutoMovieMeshTopology` and
 * `measureAutoMovieMeshPieces` share.
 *
 * Without physical source correspondence, a corner is identified by its
 * position rounded on the `MESH_WELD_GRID` lattice, so face-local corners at
 * one point join. A mesh that declares physical sources is identified by those
 * sources instead, so two sources stay distinct where they touch. Either way, a
 * triangle whose corners round onto fewer than three lattice cells is
 * degenerate: its ordinal is listed and its corners carry no identity. The mesh
 * is only read.
 *
 * @param mesh Mesh to weld.
 * @param label Name the refusals give the mesh.
 * @returns The index run, each corner's identity and the degenerate ordinals.
 * @throws The `triangleIndicesOf` refusal for a malformed index buffer, and the
 *   physical correspondence refusals.
 */
export const weldAutoMovieMeshCorners: (
  mesh: IAutoMovieMesh,
  label: string,
) => weldAutoMovieMeshCorners.IResult = (
  mesh: IAutoMovieMesh,
  label: string,
): weldAutoMovieMeshCorners.IResult => {
  const indices: number[] = triangleIndicesOf(mesh, label);
  const physical: IAutoMovieResolvedPhysicalVertices | undefined =
    mesh.physicalVertices === undefined
      ? undefined
      : resolveAutoMovieMeshPhysicalVertices(mesh);
  const cells: Map<string, number> = new Map();
  const key: (at: number) => string = (at: number): string =>
    [0, 1, 2]
      .map((axis: number): number =>
        Math.round(mesh.positions[at * 3 + axis]! * MESH_WELD_GRID),
      )
      .join(",");
  const corners: number[] = [];
  const degenerate: number[] = [];
  for (let at: number = 0; at < indices.length; at += 3) {
    const keys: string[] = [0, 1, 2].map((corner: number): string =>
      key(indices[at + corner]!),
    );
    if (new Set(keys).size < 3) {
      degenerate.push(at / 3);
      corners.push(-1, -1, -1);
      continue;
    }
    for (let corner: number = 0; corner < 3; ++corner) {
      if (physical !== undefined) {
        corners.push(physical.vertices[indices[at + corner]!]!);
        continue;
      }
      let cell: number | undefined = cells.get(keys[corner]!);
      if (cell === undefined) {
        cell = cells.size;
        cells.set(keys[corner]!, cell);
      }
      corners.push(cell);
    }
  }
  return {
    indices,
    corners,
    degenerate,
    identities: physical === undefined ? cells.size : physical.labels.length,
  };
};

/** The result of welding one mesh's triangle corners. */
export namespace weldAutoMovieMeshCorners {
  /** One mesh's corners welded into topology identities. */
  export interface IResult {
    /**
     * The mesh's triangle index run, borrowed as `triangleIndicesOf` returns
     * it.
     */
    indices: number[];

    /**
     * Each index entry's identity, an integer in `[0, identities)`, or -1 for
     * every corner of a degenerate triangle.
     */
    corners: number[];

    /** Ascending ordinals of the degenerate triangles. */
    degenerate: number[];

    /** How many identities the corners range over. */
    identities: number;
  }
}
