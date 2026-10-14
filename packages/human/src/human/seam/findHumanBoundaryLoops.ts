/**
 * Walk open directed triangle boundaries without reading coordinates. An a→b edge is open when no b→a exists; loops retain triangle-owned direction. Complete triangle rows are enforced. Caller supplies compact nonnegative integral indices whose packed key from*vertexCount+to remains exactly representable; this walker adds no complete index-domain admission.
 *
 * Repeated directed edges, multiple outgoing boundary edges, unclosed walks and walks joining an already-seen different loop refuse. No open edges returns no loops. These incidence checks do not establish interior vertex links, geometric nonintersection, outward winding or a global manifold/clinical surface.
 *
 * @evidence contracts/common.md#principled-implementation Actual directed source incidence and reverse-edge absence determine boundary order without coordinate welding.
 * @evidence contracts/common.md#clear-and-simple-design A directed edge set, outgoing map and visited walk separate incidence detection from deterministic loop extraction.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Duplicate/pinched/unclosed boundaries refuse rather than guessed joins, and compact numeric-key premises or global manifoldness are not falsely claimed validated.
 * @evidence contracts/common.md#meaningful-documentation Prose states triangle direction, exact packed-key premise, named refusal scope and coordinate/global qualification boundaries.
 * @evidence contracts/performance.md#efficient-algorithms Edge collection and loop traversal are linear in triangle/boundary population, with sorted boundary starts adding O(B log B) deterministic ordering.
 * @evidence contracts/performance.md#reuse-equivalent-work One directed edge set answers reverse membership for every edge and one visited set prevents revisiting extracted boundary vertices.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only owned loop arrays escape; source-sized sets/maps are local with no geometry buffer, asset task or render resource retained.
 */
export function findHumanBoundaryLoops(indices: readonly number[]): number[][] {
  if (indices.length % 3 !== 0)
    throw new Error("A triangle list needs a multiple of three indices.");
  let vertexCount: number = 0;
  for (const index of indices) vertexCount = Math.max(vertexCount, index + 1);
  const held: Set<number> = new Set<number>();
  for (let corner: number = 0; corner < indices.length; corner += 3)
    for (let side: number = 0; side < 3; side++) {
      const from: number = indices[corner + side];
      const to: number = indices[corner + ((side + 1) % 3)];
      const key: number = from * vertexCount + to;
      if (held.has(key))
        throw new Error(
          "Two triangles hold the edge " + from + " -> " + to + " alike.",
        );
      held.add(key);
    }
  const next: Map<number, number> = new Map<number, number>();
  for (const key of held) {
    const from: number = Math.floor(key / vertexCount);
    const to: number = key - from * vertexCount;
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
  const seen: Set<number> = new Set<number>();
  for (const start of [...next.keys()].sort(
    (a: number, b: number): number => a - b,
  )) {
    if (seen.has(start)) continue;
    const loop: number[] = [];
    let at: number = start;
    while (!seen.has(at)) {
      seen.add(at);
      loop.push(at);
      const following: number | undefined = next.get(at);
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
