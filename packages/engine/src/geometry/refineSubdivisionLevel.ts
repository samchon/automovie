import type {
  IAutoMovieSubdivisionLevel,
  IAutoMovieSubdivisionTopology,
  IAutoMovieSubdivisionVertexMask,
} from "@automovie/interface";

import { buildSubdivisionTopology } from "./buildSubdivisionTopology";
import { decaySubdivisionSharpness } from "./decaySubdivisionSharpness";
import { refineSubdivisionPoints } from "./refineSubdivisionPoints";
import { refineSubdivisionUvs } from "./refineSubdivisionUvs";

/**
 * Refine a subdivision level once into an all-quad level.
 *
 * Parent corner `c`, at vertex `v` of face `f`, becomes child face `c` with
 * corners `v`, the point of its out-edge, the point of `f`, and the point of
 * its in-edge, which keeps the parent winding. The two halves of a parent edge
 * take its decayed sharpness and the edges inside a parent face are smooth.
 *
 * Corner parameters halve: a child corner takes its parent corner's value, the
 * midpoint towards the neighbouring corner, or the face centroid. The cage's
 * non-quad faces instead give each child quad its own unit square on sub-face
 * `k`, as `IAutoMovieSubdivisionParameter` documents.
 *
 * @param level The level to refine.
 * @returns The next level.
 */
export const refineSubdivisionLevel = (
  level: IAutoMovieSubdivisionLevel,
): IAutoMovieSubdivisionLevel => {
  const topology: IAutoMovieSubdivisionTopology = level.topology;
  const vertexCount: number = topology.vertexCount;
  const edgeCount: number = topology.edgeSharpness.length;
  const cornerCount: number = topology.faceVertices.length;
  const faceOffsets: number[] = topology.faceOffsets;
  const refined: {
    points: number[];
    masks: IAutoMovieSubdivisionVertexMask[];
  } = refineSubdivisionPoints(topology, level.positions);

  const childOffsets: number[] = new Array<number>(cornerCount + 1);
  const childVertices: number[] = new Array<number>(cornerCount * 4);
  const parameterFaces: number[] = new Array<number>(cornerCount * 4);
  const parameterCorners: number[] = new Array<number>(cornerCount * 4);
  const parameterU: number[] = new Array<number>(cornerCount * 4);
  const parameterV: number[] = new Array<number>(cornerCount * 4);
  childOffsets[0] = 0;
  for (let f: number = 0; f < faceOffsets.length - 1; ++f) {
    const start: number = faceOffsets[f]!;
    const size: number = faceOffsets[f + 1]! - start;
    let centreU: number = 0;
    let centreV: number = 0;
    for (let c: number = start; c < start + size; ++c) {
      centreU += level.parameterU[c]! / size;
      centreV += level.parameterV[c]! / size;
    }
    for (let k: number = 0; k < size; ++k) {
      const c: number = start + k;
      const after: number = start + ((k + 1) % size);
      const before: number = start + ((k + size - 1) % size);
      childOffsets[c + 1] = (c + 1) * 4;
      childVertices[c * 4] = topology.faceVertices[c]!;
      childVertices[c * 4 + 1] = vertexCount + topology.cornerEdges[c]!;
      childVertices[c * 4 + 2] = vertexCount + edgeCount + f;
      childVertices[c * 4 + 3] = vertexCount + topology.cornerEdges[before]!;
      const split: boolean = level.cage && size !== 4;
      const us: number[] = split
        ? [0, 1, 1, 0]
        : [
            level.parameterU[c]!,
            (level.parameterU[c]! + level.parameterU[after]!) / 2,
            centreU,
            (level.parameterU[c]! + level.parameterU[before]!) / 2,
          ];
      const vs: number[] = split
        ? [0, 0, 1, 1]
        : [
            level.parameterV[c]!,
            (level.parameterV[c]! + level.parameterV[after]!) / 2,
            centreV,
            (level.parameterV[c]! + level.parameterV[before]!) / 2,
          ];
      for (let j: number = 0; j < 4; ++j) {
        parameterFaces[c * 4 + j] = level.parameterFaces[c]!;
        parameterCorners[c * 4 + j] = split ? k : level.parameterCorners[c]!;
        parameterU[c * 4 + j] = us[j]!;
        parameterV[c * 4 + j] = vs[j]!;
      }
    }
  }

  const child: IAutoMovieSubdivisionTopology = buildSubdivisionTopology(
    vertexCount + edgeCount + faceOffsets.length - 1,
    childOffsets,
    childVertices,
    (a: number, b: number): number => {
      const corner: number = Math.min(a, b);
      const middle: number = Math.max(a, b);
      return corner < vertexCount &&
        middle >= vertexCount &&
        middle < vertexCount + edgeCount
        ? decaySubdivisionSharpness(
            topology.edgeSharpness[middle - vertexCount]!,
          )
        : 0;
    },
  );
  const uvs: { uvs: number[]; cornerUvs: number[] } | null =
    level.uvs === null || level.cornerUvs === null
      ? null
      : refineSubdivisionUvs(
          topology,
          level.uvs,
          level.cornerUvs,
          refined.masks,
        );
  return {
    topology: child,
    positions: refined.points,
    uvs: uvs?.uvs ?? null,
    cornerUvs: uvs?.cornerUvs ?? null,
    cage: false,
    parameterFaces,
    parameterCorners,
    parameterU,
    parameterV,
  };
};
