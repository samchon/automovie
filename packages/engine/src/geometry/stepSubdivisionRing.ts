import { ISubdivisionRing } from "./ISubdivisionRing";
import { ISubdivisionVertexMask } from "./ISubdivisionVertexMask";
import { decaySubdivisionSharpness } from "./decaySubdivisionSharpness";
import { subdivisionEdgeSmoothness } from "./subdivisionEdgeSmoothness";
import { subdivisionVertexMask } from "./subdivisionVertexMask";

/**
 * Refine a vertex's quad one-ring once, giving the one-ring of the vertex's
 * child.
 *
 * The child's diagonals are the new face points `(C + E_i + D_i + E_{i+1}) / 4`,
 * its edge neighbours the new edge points of the ring edges, and its centre
 * the new vertex point, by the same rules as `refineSubdivisionPoints`. Every
 * point it needs lies inside the ring's quads, so the ring refines without the
 * rest of the mesh.
 *
 * @param ring The current one-ring.
 * @returns The child's one-ring with decayed sharpness.
 *
 * @evidence contracts/common.md#principled-implementation Catmull-Clark's face, edge and vertex rules restricted to the faces around one vertex, which contain every point the child's one-ring is made of; this makes semi-sharp sharpness that outlasts the requested level exact in the limit.
 * @evidence contracts/common.md#clear-and-simple-design Reuses the shared vertex mask, edge smoothness and decay rules, so the ring ages a crease exactly as a full level does.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No approximation of the sharp-to-smooth transition; the ring is refined until its sharpness is spent.
 * @evidence contracts/common.md#meaningful-documentation States the three child point kinds and why the ring refines on its own.
 * @evidence contracts/performance.md#efficient-algorithms Linear in the valence: one pass each for diagonals, edges and the centre.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each step consumes the previous ring; nothing is shared across vertices.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Returns a ring of the same size and retains nothing.
 */
export const stepSubdivisionRing = (
  ring: ISubdivisionRing,
): ISubdivisionRing => {
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
  const mask: ISubdivisionVertexMask = subdivisionVertexMask(
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
