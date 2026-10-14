/**
 * The boundary loops a shared hair contact closure closes, each as its ordered directed edges.
 *
 * A closure's triangles cover an opening of the surface; the edges that only one closure triangle uses are its rim, the opening's boundary, directed as the closure winds them. They are chained into loops so that `closeHumanFaceHairContact` can cap each loop at its current centre. A branched or nonclosing rim refuses. Edges used more than once are omitted from the rim regardless of direction or multiplicity; the enclosing basis admission must establish that these interior edges form a consistently oriented triangulated closure.
 *
 * @evidence contracts/common.md#principled-implementation Closure triangle edge counts identify directed rims which chain into closed boundary loops.
 * @evidence contracts/common.md#clear-and-simple-design Current fan closure consumes these topology-only loops separately from vertex positions.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Branched or nonclosing rims refuse; repeated interior-edge multiplicity and orientation are not checked here and remain premises of admitted closure topology.
 * @evidence contracts/common.md#meaningful-documentation Edges preserve authored closure orientation and original vertex identities.
 * @evidence contracts/performance.md#efficient-algorithms Counting and chaining are linear in closure edges with map/set lookup.
 * @evidence contracts/performance.md#reuse-equivalent-work One edge-count table supplies every rim decision and visited starts avoid retracing completed loops.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returned loops own directed pairs; temporary counts and visited maps are released after the call.
 */
export function humanFaceHairClosureLoops(
  closure: readonly number[],
): [number, number][][] {
  const count: Map<string, number> = new Map<string, number>();
  const directed: [number, number][] = [];
  for (let t: number = 0; t < closure.length; t += 3)
    for (let e: number = 0; e < 3; ++e) {
      const a: number = closure[t + e]!;
      const b: number = closure[t + ((e + 1) % 3)]!;
      directed.push([a, b]);
      const key: string = a < b ? `${a},${b}` : `${b},${a}`;
      count.set(key, (count.get(key) ?? 0) + 1);
    }
  const rim: [number, number][] = directed.filter(
    ([a, b]: [number, number]): boolean => count.get(a < b ? `${a},${b}` : `${b},${a}`) === 1,
  );
  const next: Map<number, [number, number]> = new Map<number, [number, number]>();
  for (const edge of rim) {
    if (next.has(edge[0]))
      throw new Error("A hair contact closure rim branches at a vertex.");
    next.set(edge[0], edge);
  }
  const loops: [number, number][][] = [];
  const used: Set<number> = new Set<number>();
  for (const [start] of rim) {
    if (used.has(start)) continue;
    const loop: [number, number][] = [];
    let at: number = start;
    do {
      const edge: [number, number] | undefined = next.get(at);
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
