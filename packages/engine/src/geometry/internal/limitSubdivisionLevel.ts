import type {
  IAutoMovieLimitSubdivisionLevel,
  IAutoMovieSubdivisionLevel,
  IAutoMovieSubdivisionRing,
  IAutoMovieSubdivisionTopology,
} from "@automovie/interface";

import { decaySubdivisionSharpness } from "./decaySubdivisionSharpness";
import { limitSubdivisionRing } from "./limitSubdivisionRing";
import { refineSubdivisionPoints } from "./refineSubdivisionPoints";
import { stepSubdivisionRing } from "./stepSubdivisionRing";

/*
 * Evaluate the limit position and face-varying limit normals of every vertex of
 * a level.
 *
 * A vertex's limit is the limit of its child, so the level's points are refined
 * once without building the next level's connectivity, and each vertex reads
 * its child's quad one-ring from them: its vertex point, the edge points of its
 * fan edges and the face points of its fan faces. That ring is all quads even
 * when the level has other polygons. While any ring edge keeps a semi-sharp
 * sharpness between 0 and 10, the ring is refined on its own, so a crease that
 * outlasts the requested level still rounds off in the limit exactly as further
 * refinement would; at most ten such steps are needed. `limitSubdivisionRing`
 * then applies the limit masks.
 *
 * Normals are numbered vertex by vertex, sector by sector in fan order, and
 * each corner names the normal of the sector its face belongs to.
 * Parameter level: The final level.
 * Returns: Packed limit positions, packed unit normals, and each corner's
 * normal index.
 */
export const limitSubdivisionLevel = (
  level: IAutoMovieSubdivisionLevel,
): IAutoMovieLimitSubdivisionLevel.IResult => {
  const topology: IAutoMovieSubdivisionTopology = level.topology;
  const vertexCount: number = topology.vertexCount;
  const faceBase: number = vertexCount + topology.edgeSharpness.length;
  const points: number[] = refineSubdivisionPoints(
    topology,
    level.positions,
  ).points;
  const point: (index: number) => number[] = (index: number): number[] =>
    points.slice(index * 3, index * 3 + 3);
  const positions: number[] = new Array<number>(vertexCount * 3);
  const normals: number[] = [];
  const cornerNormals: number[] = new Array<number>(
    topology.faceVertices.length,
  );
  for (let v: number = 0; v < vertexCount; ++v) {
    const edges: number[] = topology.fanEdges.slice(
      topology.fanEdgeOffsets[v],
      topology.fanEdgeOffsets[v + 1],
    );
    const corners: number[] = topology.fanCorners.slice(
      topology.fanCornerOffsets[v],
      topology.fanCornerOffsets[v + 1],
    );
    let ring: IAutoMovieSubdivisionRing = {
      centre: point(v),
      edges: edges.flatMap((e: number): number[] => point(vertexCount + e)),
      diagonals: corners.flatMap((c: number): number[] =>
        point(faceBase + topology.cornerFaces[c]!),
      ),
      sharpness: edges.map((e: number): number =>
        decaySubdivisionSharpness(topology.edgeSharpness[e]!),
      ),
    };
    while (ring.sharpness.some((s: number): boolean => s > 0 && s < 10))
      ring = stepSubdivisionRing(ring);
    const limit: {
      position: number[];
      normals: number[][];
      sectors: number[];
    } = limitSubdivisionRing(ring, v);
    for (let axis: number = 0; axis < 3; ++axis)
      positions[v * 3 + axis] = limit.position[axis]!;
    const base: number = normals.length / 3;
    for (const normal of limit.normals) normals.push(...normal);
    corners.forEach((c: number, i: number): void => {
      cornerNormals[c] = base + limit.sectors[i]!;
    });
  }
  return { positions, normals, cornerNormals };
};
