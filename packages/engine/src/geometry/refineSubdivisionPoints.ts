import { ISubdivisionTopology } from "./ISubdivisionTopology";
import { ISubdivisionVertexMask } from "./ISubdivisionVertexMask";
import { subdivisionEdgeSmoothness } from "./subdivisionEdgeSmoothness";
import { subdivisionVertexMask } from "./subdivisionVertexMask";

/**
 * Apply one Catmull-Clark step to vertex positions: every vertex, edge and
 * face point of the next level.
 *
 * The output holds the vertex points in vertex order, then the edge points in
 * edge order, then the face points in face order. A face point is the average
 * of its corners. An edge point is `(A + B + F0 + F1) / 4`, the ends and the
 * two adjacent face points, blended towards the midpoint `(A + B) / 2` by
 * `subdivisionEdgeSmoothness`, so boundary and sharp edges take the midpoint.
 * A vertex point applies `subdivisionVertexMask` to the vertex, its edge
 * neighbours and the new face points of its fan.
 *
 * @param topology Connectivity of the current level.
 * @param positions Packed positions of the current level.
 * @returns Packed next-level points and the vertex mask used for each vertex.
 *
 * @evidence contracts/common.md#principled-implementation The face, edge and vertex rules of Catmull and Clark (1978) with the boundary, crease and fractional-sharpness rules of DeRose, Kass and Truong (1998), computed face points first because the edge and vertex rules read them.
 * @evidence contracts/common.md#clear-and-simple-design Only point placement lives here; connectivity is rebuilt by `refineSubdivisionLevel`, and the limit evaluation reuses these points as the one-ring of the next level without building it.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Every vertex and edge takes the rule its sharpness selects; there is no valence or position special case.
 * @evidence contracts/common.md#meaningful-documentation States the output order, each rule with its weights, and the role of the returned masks.
 * @evidence contracts/performance.md#efficient-algorithms Linear in corners, edges and vertices: each face point reads its corners once, each edge point four points, and each vertex point its fan once.
 * @evidence contracts/performance.md#reuse-equivalent-work The vertex masks are returned so face-varying UVs reuse them instead of reclassifying each vertex.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returns one packed array of `3 (V + E + F)` numbers and one mask per vertex; nothing else survives the call.
 */
export const refineSubdivisionPoints = (
  topology: ISubdivisionTopology,
  positions: readonly number[],
): { points: number[]; masks: ISubdivisionVertexMask[] } => {
  const vertexCount: number = topology.vertexCount;
  const edgeCount: number = topology.edgeSharpness.length;
  const faceCount: number = topology.faceOffsets.length - 1;
  const faceBase: number = vertexCount + edgeCount;
  const points: number[] = new Array<number>(
    3 * (faceBase + faceCount),
  ).fill(0);

  for (let f: number = 0; f < faceCount; ++f) {
    const start: number = topology.faceOffsets[f]!;
    const end: number = topology.faceOffsets[f + 1]!;
    const weight: number = 1 / (end - start);
    for (let c: number = start; c < end; ++c)
      for (let axis: number = 0; axis < 3; ++axis)
        points[(faceBase + f) * 3 + axis]! +=
          weight * positions[topology.faceVertices[c]! * 3 + axis]!;
  }

  for (let e: number = 0; e < edgeCount; ++e) {
    const a: number = topology.edgeVertices[e * 2]!;
    const b: number = topology.edgeVertices[e * 2 + 1]!;
    const smooth: number = subdivisionEdgeSmoothness(
      topology.edgeSharpness[e]!,
    );
    const left: number =
      faceBase + topology.cornerFaces[topology.edgeCorners[e * 2]!]!;
    const right: number =
      smooth === 0
        ? left
        : faceBase + topology.cornerFaces[topology.edgeCorners[e * 2 + 1]!]!;
    for (let axis: number = 0; axis < 3; ++axis) {
      const ends: number = positions[a * 3 + axis]! + positions[b * 3 + axis]!;
      points[(vertexCount + e) * 3 + axis] =
        smooth *
          ((ends + points[left * 3 + axis]! + points[right * 3 + axis]!) / 4) +
        (1 - smooth) * (ends / 2);
    }
  }

  const masks: ISubdivisionVertexMask[] = new Array<ISubdivisionVertexMask>(
    vertexCount,
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
    const mask: ISubdivisionVertexMask = subdivisionVertexMask(
      edges.map((e: number): number => topology.edgeSharpness[e]!),
      corners.length,
    );
    masks[v] = mask;
    for (let axis: number = 0; axis < 3; ++axis) {
      let sum: number = mask.vertex * positions[v * 3 + axis]!;
      edges.forEach((e: number, i: number): void => {
        const far: number =
          topology.edgeVertices[e * 2]! +
          topology.edgeVertices[e * 2 + 1]! -
          v;
        sum += mask.edges[i]! * positions[far * 3 + axis]!;
      });
      corners.forEach((c: number, i: number): void => {
        sum +=
          mask.faces[i]! *
          points[(faceBase + topology.cornerFaces[c]!) * 3 + axis]!;
      });
      points[v * 3 + axis] = sum;
    }
  }
  return { points, masks };
};
