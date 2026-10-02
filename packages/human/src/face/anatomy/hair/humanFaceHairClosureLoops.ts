/**
 * The boundary loops a shared hair contact closure closes, each as its
 * ordered directed edges.
 *
 * A closure's triangles cover an opening of the surface; the edges that only
 * one closure triangle uses are its rim, the opening's boundary, directed as
 * the closure winds them. They are chained into loops so that
 * `closeHumanFaceHairContact` can cap each loop at its current centre. An
 * edge used twice with one direction, or a rim that does not chain into
 * closed loops, refuses: the closure then does not describe an opening.
 *
 * @evidence contracts/common.md#principled-implementation The boundary of a
 *   triangle set is the edges used by exactly one triangle, so counting
 *   undirected edge uses finds the rim, and each rim edge keeps the direction
 *   its triangle winds it. Each rim vertex must have one outgoing rim edge, so a
 *   successor map chains them into closed loops. A vertex with two outgoing rim
 *   edges, or a chain that does not return to its start, is not a simple opening
 *   and refuses instead of returning part of a loop.
 * @evidence contracts/common.md#clear-and-simple-design One pass to find the
 *   rim and one to chain it; the cap itself is left to the function that knows
 *   the current positions.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No special
 *   case for a subject or fixture; the loops come from the closure triangles
 *   alone.
 * @evidence contracts/common.md#meaningful-documentation The comment states
 *   the rim, its direction, what consumes it and the refusals.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The
 *   function computes a value and defines no part or group.
 * @evidenceExclude contracts/modeling.md#parameter-channels The function
 *   defines no channel and reads the hairstyle document's fields without varying
 *   a form; the document type owns their meaning.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function emits
 *   no primitive.
 * @evidence contracts/modeling.md#spatial-conventions Only vertex indices of
 *   the resident surface are read and returned; no unit or frame is involved.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The function builds
 *   no surface; it reports the rim edges, and closeHumanFaceHairContact builds
 *   the cap on them.
 * @evidenceExclude contracts/modeling.md#rendered-observation The function
 *   owns no part, group or joint and displays nothing; the builder that owns the
 *   assembled hair is where the result is observed.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The function carries
 *   no anatomical value of its own.
 * @evidenceExclude contracts/anatomy.md#permitted-range The function admits,
 *   bounds or combines no anatomical quantity; assertHumanFaceHair owns
 *   admission of the hairstyle document.
 * @evidenceExclude contracts/anatomy.md#parametric-authority No caller input
 *   shapes a human form through this function; it reads quantities the hairstyle
 *   document already names and admits.
 */
export function humanFaceHairClosureLoops(
  closure: readonly number[],
): [number, number][][] {
  const count = new Map<string, number>();
  const directed: [number, number][] = [];
  for (let t = 0; t < closure.length; t += 3)
    for (let e = 0; e < 3; ++e) {
      const a = closure[t + e]!;
      const b = closure[t + ((e + 1) % 3)]!;
      directed.push([a, b]);
      const key = a < b ? `${a},${b}` : `${b},${a}`;
      count.set(key, (count.get(key) ?? 0) + 1);
    }
  const rim = directed.filter(
    ([a, b]) => count.get(a < b ? `${a},${b}` : `${b},${a}`) === 1,
  );
  const next = new Map<number, [number, number]>();
  for (const edge of rim) {
    if (next.has(edge[0]))
      throw new Error("A hair contact closure rim branches at a vertex.");
    next.set(edge[0], edge);
  }
  const loops: [number, number][][] = [];
  const used = new Set<number>();
  for (const [start] of rim) {
    if (used.has(start)) continue;
    const loop: [number, number][] = [];
    let at = start;
    do {
      const edge = next.get(at);
      if (edge === undefined || used.has(at))
        throw new Error("A hair contact closure rim does not close.");
      used.add(at);
      loop.push(edge);
      at = edge[1];
    } while (at !== start);
    loops.push(loop);
  }
  return loops;
}
