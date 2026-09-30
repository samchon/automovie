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
 *
 * @evidence contracts/common.md#principled-implementation A directed edge is on the boundary exactly when its reverse is absent, which is the definition of an open edge on an oriented manifold; following the unique outgoing boundary edge of each boundary vertex closes each loop, and a vertex with two outgoing boundary edges refuses because the walk would then depend on an arbitrary choice.
 * @evidence contracts/common.md#clear-and-simple-design One pass builds the directed edge set and one walk emits the loops; the function reads nothing but the index list.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No basis, vertex identity or expected loop length is assumed; a non-manifold boundary refuses instead of being repaired.
 * @evidence contracts/common.md#meaningful-documentation The comment states the loop direction convention the seam relies on and the two refusals.
 * @evidence contracts/modeling.md#spatial-conventions Indices only; no unit or frame enters, and the direction convention is the triangle winding's.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The function reads a boundary and defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The function consumes no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function emits no primitive; it names existing vertices.
 * @evidenceExclude contracts/modeling.md#rendered-observation The function displays nothing; the seams built on its loops are observed by their owners.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The function carries no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range The function admits no anatomical value.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The function defines no input a caller shapes a human form with.
 */
export function findHumanBoundaryLoops(
  indices: readonly number[],
): number[][] {
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
        "Two boundary edges leave the vertex " + from + " (a pinched boundary).",
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
        throw new Error("The boundary at the vertex " + at + " does not close.");
      at = following;
    }
    if (at !== start)
      throw new Error("The boundary at the vertex " + at + " is not a loop.");
    loops.push(loop);
  }
  return loops;
}
