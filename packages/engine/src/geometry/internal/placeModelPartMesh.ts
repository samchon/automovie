import type { IAutoMovieMesh, IAutoMovieVector3 } from "@automovie/interface";

import { transformDrawingPoint } from "../../drawing/internal/transformDrawingPoint";
import { triangleIndicesOf } from "./triangleIndicesOf";

/*
 * Carry one part's realized mesh into its model's frame.
 *
 * The matrix is the part's entry from `modelPartMatrices`: its own
 * transform, then its resolved bone's rest placement. A null matrix keeps the
 * mesh itself, so a part authored in the model frame keeps its coordinates bit
 * for bit. Only positions move; every other buffer is shared with the input,
 * which is only read. Model crossings, model contacts and the form expectation
 * check place their parts through this one function.
 * Parameter mesh: The part's realized mesh, in part-local metres.
 * Parameter matrix: The part's column-major placement, or null.
 * Parameter label: Name the index refusal gives the part.
 * Returns: The mesh with positions in model metres.
 * The `triangleIndicesOf` refusal for a malformed index buffer.
 */
export const placeModelPartMesh: (
  mesh: IAutoMovieMesh,
  matrix: readonly number[] | null,
  label: string,
) => IAutoMovieMesh = (
  mesh: IAutoMovieMesh,
  matrix: readonly number[] | null,
  label: string,
): IAutoMovieMesh => {
  triangleIndicesOf(mesh, label);
  if (matrix === null) return mesh;
  const positions: number[] = [];
  for (let at: number = 0; at < mesh.positions.length; at += 3) {
    const point: IAutoMovieVector3 = transformDrawingPoint(matrix, {
      x: mesh.positions[at]!,
      y: mesh.positions[at + 1]!,
      z: mesh.positions[at + 2]!,
    });
    positions.push(point.x, point.y, point.z);
  }
  return { ...mesh, positions };
};
