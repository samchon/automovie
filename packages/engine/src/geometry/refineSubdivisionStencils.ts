import { ISubdivisionTopology } from "./ISubdivisionTopology";
import { ISubdivisionVertexMask } from "./ISubdivisionVertexMask";
import { subdivisionEdgeSmoothness } from "./subdivisionEdgeSmoothness";
import { subdivisionVertexMask } from "./subdivisionVertexMask";

/**
 * Compose one Catmull-Clark refinement with sparse affine source stencils.
 * Vertex, edge and face output order agrees with refineSubdivisionPoints.
 * Coefficients come from topology and sharpness, never from basis probing.
 *
 * @evidence contracts/common.md#principled-implementation Applies the same face averages, edge smoothness and vertex masks as refineSubdivisionPoints, composing their affine maps with the incoming source rows; this preserves source vertex identity across a refinement hierarchy.
 * @evidence contracts/common.md#clear-and-simple-design This function owns symbolic point placement only; refineSubdivisionLevel owns the matching topology and attributes.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No sampled coefficients, geometry tolerances, caller names or finite difference probes are used.
 * @evidence contracts/common.md#meaningful-documentation States source-row composition, output order and the distinction from topology refinement; rows and their maps are newly owned by the result.
 * @evidence contracts/performance.md#efficient-algorithms Work is proportional to the source-row terms visited by each local mask; sparse maps merge repeated source indices without a dense V-by-V matrix.
 * @evidence contracts/performance.md#reuse-equivalent-work Face stencils are computed once and shared by edge and vertex rules; mask classification reuses the maintained vertex-mask function.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returns one sparse row per refined vertex; temporary local maps become result rows and no module state is retained.
 */
export function refineSubdivisionStencils(topology: ISubdivisionTopology, source: ReadonlyArray<ReadonlyMap<number, number>>): Array<Map<number, number>> {
  const count: number = topology.vertexCount;
  const edges: number = topology.edgeSharpness.length;
  const faceBase: number = count + edges;
  const output: Array<Map<number, number>> = Array.from(
    { length: faceBase + topology.faceOffsets.length - 1 },
    (): Map<number, number> => new Map(),
  );
  const add: (row: Map<number, number>, input: ReadonlyMap<number, number>, weight: number) => void = (
    row: Map<number, number>,
    input: ReadonlyMap<number, number>,
    weight: number,
  ): void => {
    if (weight === 0) return;
    for (const [index, value] of input)
      row.set(index, (row.get(index) ?? 0) + value * weight);
  };
  for (let f: number = 0; f < topology.faceOffsets.length - 1; f++) {
    const begin: number = topology.faceOffsets[f]!;
    const end: number = topology.faceOffsets[f + 1]!;
    for (let c: number = begin; c < end; c++)
      add(output[faceBase + f]!, source[topology.faceVertices[c]!]!, 1 / (end - begin));
  }
  for (let e: number = 0; e < edges; e++) {
    const smooth: number = subdivisionEdgeSmoothness(topology.edgeSharpness[e]!);
    const row: Map<number, number> = output[count + e]!;
    add(row, source[topology.edgeVertices[2 * e]!]!, (2 - smooth) / 4);
    add(row, source[topology.edgeVertices[2 * e + 1]!]!, (2 - smooth) / 4);
    if (smooth !== 0) {
      add(row, output[faceBase + topology.cornerFaces[topology.edgeCorners[2 * e]!]!]!, smooth / 4);
      add(row, output[faceBase + topology.cornerFaces[topology.edgeCorners[2 * e + 1]!]!]!, smooth / 4);
    }
  }
  for (let v: number = 0; v < count; v++) {
    const fanEdges: number[] = topology.fanEdges.slice(topology.fanEdgeOffsets[v], topology.fanEdgeOffsets[v + 1]);
    const corners: number[] = topology.fanCorners.slice(topology.fanCornerOffsets[v], topology.fanCornerOffsets[v + 1]);
    const mask: ISubdivisionVertexMask = subdivisionVertexMask(fanEdges.map((e: number): number => topology.edgeSharpness[e]!), corners.length);
    const row: Map<number, number> = output[v]!;
    add(row, source[v]!, mask.vertex);
    fanEdges.forEach((e: number, k: number): void => {
      const far: number = topology.edgeVertices[2 * e]! + topology.edgeVertices[2 * e + 1]! - v;
      add(row, source[far]!, mask.edges[k]!);
    });
    corners.forEach((c: number, k: number): void => {
      add(row, output[faceBase + topology.cornerFaces[c]!]!, mask.faces[k]!);
    });
  }
  return output;
}