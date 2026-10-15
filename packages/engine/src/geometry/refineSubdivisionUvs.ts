import { ISubdivisionTopology } from "./ISubdivisionTopology";
import { ISubdivisionVertexMask } from "./ISubdivisionVertexMask";
import { subdivisionEdgeSmoothness } from "./subdivisionEdgeSmoothness";

/**
 * Apply one Catmull-Clark step to face-varying UVs with every UV boundary
 * pinned, OpenSubdiv's `FVAR_LINEAR_BOUNDARIES` and Blender's "Keep
 * Boundaries".
 *
 * An edge is UV-continuous when it has two faces that name the same UV values
 * at both ends; a mesh boundary edge or a seam is a UV boundary. A UV value at a
 * vertex touching any UV boundary keeps its value, a UV boundary edge gives each
 * side the midpoint of that side's two values, and everything else follows the
 * same rules and masks as the positions, so creases sharpen UVs alike. Each
 * chart's boundary therefore stays the piecewise-linear polygon of its cage
 * UVs at every level while its interior smooths with the surface.
 *
 * Child values are numbered as positions are: one per parent UV value, then
 * one per continuous edge or one per side of a UV boundary edge in edge order,
 * then one per face. Child corner `4 c + j` belongs to the child quad of parent
 * corner `c`, in the order vertex, out-edge, face, in-edge.
 *
 * @param topology Connectivity of the current level.
 * @param uvs Packed UV values of the current level.
 * @param cornerUvs UV value of every corner.
 * @param masks Vertex masks the positions used, one per vertex.
 * @returns Packed next-level UV values and the UV value of every child corner.
 *
 * @evidence contracts/common.md#principled-implementation Face-varying refinement as OpenSubdiv defines it: UV topology follows corner indices, continuous regions take the vertex rules, and the linear-boundaries option fixes boundary values and halves boundary edges, which keeps an authored chart outline exact.
 * @evidence contracts/common.md#clear-and-simple-design The vertex masks come from the position step, so UVs never reclassify sharpness; only UV continuity, which positions do not have, is decided here.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Seams are found from corner indices, never from comparing UV values, and a pinned value is kept exactly rather than smoothed and snapped back.
 * @evidence contracts/common.md#meaningful-documentation States the continuity test, the pinning and boundary rules, the interior rule, the effect on charts, and the numbering of child values and corners.
 * @evidence contracts/performance.md#efficient-algorithms Linear in corners, edges and UV values: one continuity test per edge, one pin pass per fan, and one rule application per child value.
 * @evidence contracts/performance.md#reuse-equivalent-work Reuses the position step's vertex masks, which depend only on the sharpness the UV interior shares.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returns the child values and four corner indices per parent corner; the continuity, pin and owner tables are released on return.
 */
export const refineSubdivisionUvs = (
  topology: ISubdivisionTopology,
  uvs: readonly number[],
  cornerUvs: readonly number[],
  masks: readonly ISubdivisionVertexMask[],
): { uvs: number[]; cornerUvs: number[] } => {
  const faceOffsets: number[] = topology.faceOffsets;
  const faceCount: number = faceOffsets.length - 1;
  const edgeCount: number = topology.edgeSharpness.length;
  const uvCount: number = uvs.length / 2;
  const next: (c: number) => number = (c: number): number =>
    c + 1 < faceOffsets[topology.cornerFaces[c]! + 1]!
      ? c + 1
      : faceOffsets[topology.cornerFaces[c]!]!;
  const previous: (c: number) => number = (c: number): number =>
    c > faceOffsets[topology.cornerFaces[c]!]!
      ? c - 1
      : faceOffsets[topology.cornerFaces[c]! + 1]! - 1;

  const continuous: boolean[] = new Array<boolean>(edgeCount);
  for (let e: number = 0; e < edgeCount; ++e) {
    const first: number = topology.edgeCorners[e * 2]!;
    const second: number = topology.edgeCorners[e * 2 + 1]!;
    continuous[e] =
      second !== -1 &&
      cornerUvs[first] === cornerUvs[next(second)] &&
      cornerUvs[next(first)] === cornerUvs[second];
  }

  const edgeUvs: number[] = new Array<number>(topology.cornerEdges.length);
  let edgeBase: number = uvCount;
  for (let e: number = 0; e < edgeCount; ++e) {
    const first: number = topology.edgeCorners[e * 2]!;
    const second: number = topology.edgeCorners[e * 2 + 1]!;
    edgeUvs[first] = edgeBase++;
    if (second !== -1)
      edgeUvs[second] = continuous[e] ? edgeUvs[first]! : edgeBase++;
  }
  const faceBase: number = edgeBase;
  const out: number[] = new Array<number>(2 * (faceBase + faceCount)).fill(0);

  for (let f: number = 0; f < faceCount; ++f) {
    const weight: number = 1 / (faceOffsets[f + 1]! - faceOffsets[f]!);
    for (let c: number = faceOffsets[f]!; c < faceOffsets[f + 1]!; ++c)
      for (let axis: number = 0; axis < 2; ++axis)
        out[(faceBase + f) * 2 + axis]! +=
          weight * uvs[cornerUvs[c]! * 2 + axis]!;
  }

  for (let e: number = 0; e < edgeCount; ++e) {
    const first: number = topology.edgeCorners[e * 2]!;
    const second: number = topology.edgeCorners[e * 2 + 1]!;
    const smooth: number = continuous[e]
      ? subdivisionEdgeSmoothness(topology.edgeSharpness[e]!)
      : 0;
    for (const side of second === -1 || continuous[e]
      ? [first]
      : [first, second])
      for (let axis: number = 0; axis < 2; ++axis) {
        const ends: number =
          uvs[cornerUvs[side]! * 2 + axis]! +
          uvs[cornerUvs[next(side)]! * 2 + axis]!;
        const faces: number =
          smooth === 0
            ? 0
            : out[(faceBase + topology.cornerFaces[first]!) * 2 + axis]! +
              out[(faceBase + topology.cornerFaces[second]!) * 2 + axis]!;
        out[edgeUvs[side]! * 2 + axis] =
          smooth * ((ends + faces) / 4) + (1 - smooth) * (ends / 2);
      }
  }

  const pinned: boolean[] = new Array<boolean>(topology.vertexCount).fill(
    false,
  );
  for (let v: number = 0; v < topology.vertexCount; ++v)
    for (
      let at: number = topology.fanEdgeOffsets[v]!;
      at < topology.fanEdgeOffsets[v + 1]!;
      ++at
    )
      if (continuous[topology.fanEdges[at]!] === false) pinned[v] = true;
  const done: boolean[] = new Array<boolean>(uvCount).fill(false);
  for (let c: number = 0; c < topology.cornerEdges.length; ++c) {
    const value: number = cornerUvs[c]!;
    if (done[value]) continue;
    done[value] = true;
    const v: number = topology.faceVertices[c]!;
    if (pinned[v]) {
      out[value * 2] = uvs[value * 2]!;
      out[value * 2 + 1] = uvs[value * 2 + 1]!;
      continue;
    }
    const mask: ISubdivisionVertexMask = masks[v]!;
    const fanStart: number = topology.fanCornerOffsets[v]!;
    for (let axis: number = 0; axis < 2; ++axis) {
      let sum: number = mask.vertex * uvs[value * 2 + axis]!;
      for (let i: number = 0; i < mask.faces.length; ++i) {
        const corner: number = topology.fanCorners[fanStart + i]!;
        sum +=
          mask.edges[i]! * uvs[cornerUvs[next(corner)]! * 2 + axis]! +
          mask.faces[i]! *
            out[(faceBase + topology.cornerFaces[corner]!) * 2 + axis]!;
      }
      out[value * 2 + axis] = sum;
    }
  }

  const children: number[] = new Array<number>(topology.cornerEdges.length * 4);
  for (let c: number = 0; c < topology.cornerEdges.length; ++c) {
    children[c * 4] = cornerUvs[c]!;
    children[c * 4 + 1] = edgeUvs[c]!;
    children[c * 4 + 2] = faceBase + topology.cornerFaces[c]!;
    children[c * 4 + 3] = edgeUvs[previous(c)]!;
  }
  return { uvs: out, cornerUvs: children };
};
