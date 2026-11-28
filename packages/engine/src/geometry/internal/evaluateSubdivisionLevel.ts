import type {
  IAutoMovieLimitSubdivisionLevel,
  IAutoMovieSubdivisionLevel,
  IAutoMovieSubdivisionParameter,
  IAutoMovieSubdivisionSurface,
} from "@automovie/interface";

import { limitSubdivisionLevel } from "./limitSubdivisionLevel";

/*
 * Evaluate a completed generating level without another topology refinement.
 *
 * This boundary lets a refined fitting domain emit its existing LOD instead of
 * multiplying render triangles merely because fitting added controls. Original
 * source-face parameters and indexed face-varying UV identities are copied from
 * the level unchanged. The quad level comes from cage admission or the
 * maintained refiner.
 */
export function evaluateSubdivisionLevel(
  level: IAutoMovieSubdivisionLevel,
): IAutoMovieSubdivisionSurface {
  const offsets: readonly number[] = level.topology.faceOffsets;
  for (let f: number = 0; f + 1 < offsets.length; ++f)
    if (offsets[f + 1]! - offsets[f]! !== 4)
      throw new Error(
        "Subdivision evaluation requires a quad generating level",
      );
  const limit: IAutoMovieLimitSubdivisionLevel.IResult =
    limitSubdivisionLevel(level);
  const parameters: IAutoMovieSubdivisionParameter[] =
    new Array<IAutoMovieSubdivisionParameter>(level.topology.vertexCount);
  level.topology.faceVertices.forEach((v: number, c: number): void => {
    if (parameters[v] !== undefined) return;
    parameters[v] = {
      face: level.parameterFaces[c]!,
      corner:
        level.parameterCorners[c] === -1 ? null : level.parameterCorners[c]!,
      u: level.parameterU[c]!,
      v: level.parameterV[c]!,
    };
  });
  return {
    positions: level.positions,
    limitPositions: limit.positions,
    faces: level.topology.faceVertices,
    normals: limit.normals,
    normalFaces: limit.cornerNormals,
    uvs: level.uvs,
    uvFaces: level.cornerUvs,
    parameters,
  };
}
