import { ISubdivisionLevel } from "./ISubdivisionLevel";
import { ISubdivisionRing } from "./ISubdivisionRing";
import { ISubdivisionTopology } from "./ISubdivisionTopology";
import { decaySubdivisionSharpness } from "./decaySubdivisionSharpness";
import { limitSubdivisionRing } from "./limitSubdivisionRing";
import { refineSubdivisionPoints } from "./refineSubdivisionPoints";
import { stepSubdivisionRing } from "./stepSubdivisionRing";

/**
 * Evaluate the limit position and face-varying limit normals of every vertex
 * of a level.
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
 *
 * @param level The final level.
 * @returns Packed limit positions, packed unit normals, and each corner's normal index.
 *
 * @evidence contracts/common.md#principled-implementation The limit point of a vertex is invariant under refinement, so evaluating it on the child's ring is exact and lets the quad-only limit masks serve any polygon; refining the ring until semi-sharp sharpness is spent follows DeRose, Kass and Truong's rule sequence to the point where only the published smooth, crease and corner limits remain.
 * @evidence contracts/common.md#clear-and-simple-design Ring gathering and normal numbering live here, ring refinement and the masks in their own functions, so the level loop stays a gather, iterate and write.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Semi-sharp creases are not treated as infinitely sharp in the limit; the ring is refined until their sharpness is gone.
 * @evidence contracts/common.md#meaningful-documentation States why the child ring is used, the semi-sharp iteration and its bound, and how normals and corners are numbered.
 * @evidence contracts/performance.md#efficient-algorithms Linear in the level: one point refinement, then per vertex a ring gather, at most ten ring steps linear in its valence, and the masks; a dart or three-face crease side adds `subdivisionRingEigenbasis`'s fixed iteration, quadratic in its ring size, which bounds it per vertex.
 * @evidence contracts/performance.md#reuse-equivalent-work The one point refinement is shared by every vertex's ring instead of each vertex computing its own edge and face points.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The refined points, about four times the level's positions, are released on return; the result holds three numbers per vertex, three per normal and one per corner.
 */
export const limitSubdivisionLevel = (
  level: ISubdivisionLevel,
): { positions: number[]; normals: number[]; cornerNormals: number[] } => {
  const topology: ISubdivisionTopology = level.topology;
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
    let ring: ISubdivisionRing = {
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
