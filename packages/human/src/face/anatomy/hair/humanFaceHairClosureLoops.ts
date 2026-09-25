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
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-parametric-hair Keeps the closed hair contact surface embedded under any admitted deformation of its opening.
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
