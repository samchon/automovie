import type { IAutoMovieSubdivisionTopology } from "@automovie/interface";

/**
 * Build the edges and vertex fans of polygon rows, refusing anything that is
 * not an oriented manifold.
 *
 * Edges are numbered by first appearance walking faces in order and corners in
 * order. Each fan is walked from its start by stepping to the opposite corner
 * of the current corner's in-edge, which is the counter-clockwise neighbour
 * when the two faces traverse the edge in opposite directions. Refused, by cage
 * vertex and face indices: an edge used by more than two faces, an edge two
 * faces traverse in the same direction, a vertex in no face, and a vertex whose
 * faces form more than one fan. Rows must already hold valid, distinct vertex
 * indices per face; `subdivideAutoMovieSurface` checks that before calling.
 *
 * @param vertexCount Number of vertices the rows index.
 * @param faceOffsets Row starts, one more entry than faces.
 * @param faceVertices Vertex of every corner.
 * @param sharpnessOf Sharpness of the interior edge between two vertices.
 * @returns The level's connectivity, with boundary edges at sharpness 10.
 */
export const buildSubdivisionTopology = (
  vertexCount: number,
  faceOffsets: number[],
  faceVertices: number[],
  sharpnessOf: (a: number, b: number) => number,
): IAutoMovieSubdivisionTopology => {
  const faceCount: number = faceOffsets.length - 1;
  const cornerCount: number = faceVertices.length;
  const cornerFaces: number[] = new Array<number>(cornerCount);
  for (let face: number = 0; face < faceCount; ++face)
    for (let c: number = faceOffsets[face]!; c < faceOffsets[face + 1]!; ++c)
      cornerFaces[c] = face;
  const next: (c: number) => number = (c: number): number =>
    c + 1 < faceOffsets[cornerFaces[c]! + 1]!
      ? c + 1
      : faceOffsets[cornerFaces[c]!]!;
  const previous: (c: number) => number = (c: number): number =>
    c > faceOffsets[cornerFaces[c]!]!
      ? c - 1
      : faceOffsets[cornerFaces[c]! + 1]! - 1;

  const edgeOf: Map<number, number> = new Map<number, number>();
  const cornerEdges: number[] = new Array<number>(cornerCount);
  const edgeVertices: number[] = [];
  const edgeCorners: number[] = [];
  for (let c: number = 0; c < cornerCount; ++c) {
    const a: number = faceVertices[c]!;
    const b: number = faceVertices[next(c)]!;
    const key: number = Math.min(a, b) * vertexCount + Math.max(a, b);
    const found: number | undefined = edgeOf.get(key);
    if (found === undefined) {
      edgeOf.set(key, edgeVertices.length / 2);
      cornerEdges[c] = edgeVertices.length / 2;
      edgeVertices.push(a, b);
      edgeCorners.push(c, -1);
      continue;
    }
    const first: number = cornerFaces[edgeCorners[found * 2]!]!;
    if (edgeCorners[found * 2 + 1] !== -1)
      throw new Error(
        `subdivision cage edge ${a}-${b} belongs to more than two faces`,
      );
    if (edgeVertices[found * 2] === a)
      throw new Error(
        `subdivision cage faces ${first} and ${cornerFaces[c]} traverse edge ${a}-${b} in the same direction`,
      );
    edgeCorners[found * 2 + 1] = c;
    cornerEdges[c] = found;
  }
  const edgeCount: number = edgeVertices.length / 2;
  const edgeSharpness: number[] = new Array<number>(edgeCount);
  for (let e: number = 0; e < edgeCount; ++e)
    edgeSharpness[e] =
      edgeCorners[e * 2 + 1] === -1
        ? 10
        : sharpnessOf(edgeVertices[e * 2]!, edgeVertices[e * 2 + 1]!);

  const vertexStarts: number[] = new Array<number>(vertexCount + 1).fill(0);
  for (let c: number = 0; c < cornerCount; ++c)
    ++vertexStarts[faceVertices[c]! + 1]!;
  for (let v: number = 0; v < vertexCount; ++v) {
    if (vertexStarts[v + 1] === 0)
      throw new Error(`subdivision cage vertex ${v} belongs to no face`);
    vertexStarts[v + 1]! += vertexStarts[v]!;
  }
  const vertexCorners: number[] = new Array<number>(cornerCount);
  const filled: number[] = vertexStarts.slice(0, vertexCount);
  for (let c: number = 0; c < cornerCount; ++c)
    vertexCorners[filled[faceVertices[c]!]!++] = c;

  const fanEdgeOffsets: number[] = [0];
  const fanEdges: number[] = [];
  const fanCornerOffsets: number[] = [0];
  const fanCorners: number[] = [];
  for (let v: number = 0; v < vertexCount; ++v) {
    let start: number = vertexCorners[vertexStarts[v]!]!;
    let boundaries: number = 0;
    for (let at: number = vertexStarts[v]!; at < vertexStarts[v + 1]!; ++at) {
      const c: number = vertexCorners[at]!;
      if (edgeCorners[cornerEdges[c]! * 2 + 1] === -1) {
        if (boundaries++ === 0) start = c;
      }
    }
    const total: number = vertexStarts[v + 1]! - vertexStarts[v]!;
    let visited: number = 0;
    let corner: number = start;
    while (true) {
      if (visited === total || boundaries > 1)
        throw new Error(
          `subdivision cage vertex ${v} joins more than one fan of faces`,
        );
      fanCorners.push(corner);
      fanEdges.push(cornerEdges[corner]!);
      ++visited;
      const entering: number = cornerEdges[previous(corner)]!;
      const opposite: number =
        edgeCorners[entering * 2] === previous(corner)
          ? edgeCorners[entering * 2 + 1]!
          : edgeCorners[entering * 2]!;
      if (opposite === -1) {
        if (boundaries === 0)
          throw new Error(
            `subdivision cage vertex ${v} joins more than one fan of faces`,
          );
        fanEdges.push(entering);
        break;
      }
      if (opposite === start) break;
      corner = opposite;
    }
    if (visited !== total)
      throw new Error(
        `subdivision cage vertex ${v} joins more than one fan of faces`,
      );
    fanEdgeOffsets.push(fanEdges.length);
    fanCornerOffsets.push(fanCorners.length);
  }
  return {
    vertexCount,
    faceOffsets,
    faceVertices,
    cornerFaces,
    cornerEdges,
    edgeVertices,
    edgeCorners,
    edgeSharpness,
    fanEdgeOffsets,
    fanEdges,
    fanCornerOffsets,
    fanCorners,
  };
};
