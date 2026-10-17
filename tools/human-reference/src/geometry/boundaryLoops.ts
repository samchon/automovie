/**
 * Oriented single-use triangle edges walked into boundary chains; open chains are retained rather than capped.
 *
 * @evidence contracts/common.md#principled-implementation Edges with one undirected triangle use form oriented boundary chains.
 * @evidence contracts/common.md#clear-and-simple-design Open chains are retained without fabricating closure or caps.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Branches follow the declared operation or source protocol rather than specimen-specific coordinates or expected results.
 * @evidence contracts/common.md#meaningful-documentation States the operation, physical interpretation and its documented degeneracy or ownership limits.
 * @evidence contracts/performance.md#efficient-algorithms O(triangles) edge accounting plus boundary traversal with local outgoing-edge searches.
 * @evidence contracts/performance.md#reuse-equivalent-work Repeated work is reused only inside this operation where source identity is fixed; no cross-call or identity-dependent result cache exists.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Temporary maps are released; the returned chains own their index arrays.
 */
export function boundaryLoops(triangles: number[][]): number[][] {
  const counts: Map<string, number> = new Map();
  const outgoing: Map<number, number[]> = new Map();
  const key = (a: number, b: number): string =>
    a < b ? `${a}_${b}` : `${b}_${a}`;
  for (const t of triangles)
    for (let k: number = 0; k < 3; k++) {
      const id: string = key(t[k], t[(k + 1) % 3]);
      counts.set(id, (counts.get(id) ?? 0) + 1);
    }
  for (const t of triangles)
    for (let k: number = 0; k < 3; k++) {
      const a: number = t[k],
        b: number = t[(k + 1) % 3];
      if (counts.get(key(a, b)) === 1) {
        if (!outgoing.has(a)) outgoing.set(a, []);
        outgoing.get(a)!.push(b);
      }
    }
  const used: Set<string> = new Set();
  const loops: number[][] = [];
  for (const [start, choices] of outgoing)
    for (const second of choices) {
      if (used.has(`${start}>${second}`)) continue;
      const loop: number[] = [start];
      let a: number = start,
        b: number = second;
      used.add(`${a}>${b}`);
      while (b !== start) {
        loop.push(b);
        const next: number | undefined = (outgoing.get(b) ?? []).find(
          (c: number): boolean => !used.has(`${b}>${c}`),
        );
        if (next === undefined) break;
        used.add(`${b}>${next}`);
        a = b;
        b = next;
      }
      loops.push(loop);
    }
  return loops;
}
