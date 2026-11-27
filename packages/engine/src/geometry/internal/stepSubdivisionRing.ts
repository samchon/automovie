import type {
  IAutoMovieSubdivisionRing,
  IAutoMovieSubdivisionVertexMask,
} from "@automovie/interface";

import { decaySubdivisionSharpness } from "./decaySubdivisionSharpness";
import { subdivisionEdgeSmoothness } from "./subdivisionEdgeSmoothness";
import { subdivisionVertexMask } from "./subdivisionVertexMask";

/*
 * Refine a vertex's quad one-ring once, giving the one-ring of the vertex's
 * child.
 *
 * The child's diagonals are the new face points `(C + E_i + D_i + E_{i+1}) /
 * 4`, its edge neighbours the new edge points of the ring edges, and its centre
 * the new vertex point, by the same rules as `refineSubdivisionPoints`. Every
 * point it needs lies inside the ring's quads, so the ring refines without the
 * rest of the mesh.
 * Parameter ring: The current one-ring.
 * Returns: The child's one-ring with decayed sharpness.
 */
export const stepSubdivisionRing = (
  ring: IAutoMovieSubdivisionRing,
): IAutoMovieSubdivisionRing => {
  const edgeCount: number = ring.sharpness.length;
  const faceCount: number = ring.diagonals.length / 3;
  const diagonals: number[] = new Array<number>(faceCount * 3);
  for (let i: number = 0; i < faceCount; ++i)
    for (let axis: number = 0; axis < 3; ++axis)
      diagonals[i * 3 + axis] =
        (ring.centre[axis]! +
          ring.edges[i * 3 + axis]! +
          ring.diagonals[i * 3 + axis]! +
          ring.edges[((i + 1) % edgeCount) * 3 + axis]!) /
        4;
  const edges: number[] = new Array<number>(edgeCount * 3);
  for (let i: number = 0; i < edgeCount; ++i) {
    const smooth: number = subdivisionEdgeSmoothness(ring.sharpness[i]!);
    const before: number = (i + edgeCount - 1) % edgeCount;
    for (let axis: number = 0; axis < 3; ++axis) {
      const ends: number = ring.centre[axis]! + ring.edges[i * 3 + axis]!;
      edges[i * 3 + axis] =
        smooth === 0
          ? ends / 2
          : smooth *
              ((ends +
                diagonals[before * 3 + axis]! +
                diagonals[i * 3 + axis]!) /
                4) +
            (1 - smooth) * (ends / 2);
    }
  }
  const mask: IAutoMovieSubdivisionVertexMask = subdivisionVertexMask(
    ring.sharpness,
    faceCount,
  );
  const centre: number[] = [0, 0, 0];
  for (let axis: number = 0; axis < 3; ++axis) {
    let sum: number = mask.vertex * ring.centre[axis]!;
    for (let i: number = 0; i < edgeCount; ++i)
      sum += mask.edges[i]! * ring.edges[i * 3 + axis]!;
    for (let i: number = 0; i < faceCount; ++i)
      sum += mask.faces[i]! * diagonals[i * 3 + axis]!;
    centre[axis] = sum;
  }
  return {
    centre,
    edges,
    diagonals,
    sharpness: ring.sharpness.map(decaySubdivisionSharpness),
  };
};
