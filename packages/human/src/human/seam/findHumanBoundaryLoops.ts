/**
 * The open boundary of an oriented triangle mesh as directed loops.
 *
 * A directed edge `a -> b` of a triangle is on the boundary when no triangle
 * holds `b -> a`, so the boundary is read from the winding alone and needs no
 * position. Each loop lists its vertices in the direction its edges run in
 * the triangles that own them, which puts the surface on the left of a loop
 * seen from the side its normals face. A seam between two surfaces therefore
 * knows which way to walk each loop before it places any triangle on it.
 *
 * The input must be an oriented manifold along its boundary: an edge held in
 * the same direction by two triangles, or a boundary vertex from which two
 * boundary edges leave (a pinch), has no single loop to report and refuses
 * with the vertex named, because a seam built on it would join the wrong
 * pair of edges. An index list with no open edge returns no loop.
 */
export function findHumanBoundaryLoops(indices: readonly number[]): number[][] {
  if (indices.length % 3 !== 0)
    throw new Error("A triangle list needs a multiple of three indices.");
  let vertexCount = 0;
  for (const index of indices) vertexCount = Math.max(vertexCount, index + 1);
  const held = new Set<number>();
  for (let corner = 0; corner < indices.length; corner += 3)
    for (let side = 0; side < 3; side++) {
      const from = indices[corner + side];
      const to = indices[corner + ((side + 1) % 3)];
      const key = from * vertexCount + to;
      if (held.has(key))
        throw new Error(
          "Two triangles hold the edge " + from + " -> " + to + " alike.",
        );
      held.add(key);
    }
  const next = new Map<number, number>();
  for (const key of held) {
    const from = Math.floor(key / vertexCount);
    const to = key - from * vertexCount;
    if (held.has(to * vertexCount + from)) continue;
    if (next.has(from))
      throw new Error(
        "Two boundary edges leave the vertex " +
          from +
          " (a pinched boundary).",
      );
    next.set(from, to);
  }
  const loops: number[][] = [];
  const seen = new Set<number>();
  for (const start of [...next.keys()].sort((a, b) => a - b)) {
    if (seen.has(start)) continue;
    const loop: number[] = [];
    let at = start;
    while (!seen.has(at)) {
      seen.add(at);
      loop.push(at);
      const following = next.get(at);
      if (following === undefined)
        throw new Error(
          "The boundary at the vertex " + at + " does not close.",
        );
      at = following;
    }
    if (at !== start)
      throw new Error("The boundary at the vertex " + at + " is not a loop.");
    loops.push(loop);
  }
  return loops;
}
