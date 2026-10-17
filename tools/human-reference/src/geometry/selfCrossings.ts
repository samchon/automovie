import { V2 } from "./V2.ts";
import { segX } from "./segX.ts";

/**
 * Counts nonadjacent strict projected crossings using a uniform-grid broad phase; contacts/overlaps remain unclassified.
 *
 * @evidence contracts/common.md#principled-implementation A uniform-grid broad phase enumerates candidate nonadjacent segments before strict orientation predicates.
 * @evidence contracts/common.md#clear-and-simple-design Crossings are distinct from unclassified tangencies and collinear contact.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Branches follow the declared operation or source protocol rather than specimen-specific coordinates or expected results.
 * @evidence contracts/common.md#meaningful-documentation States the operation, physical interpretation and its documented degeneracy or ownership limits.
 * @evidence contracts/performance.md#efficient-algorithms Grid storage follows covered cells; candidate pairs have quadratic worst-case count on dense overlap.
 * @evidence contracts/performance.md#reuse-equivalent-work Repeated work is reused only inside this operation where source identity is fixed; no cross-call or identity-dependent result cache exists.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Grid and visited-pair sets are local and released after returning the count.
 */
export function selfCrossings(points: V2[], closed: boolean): number {
  const n: number = points.length,
    segments: number = closed ? n : n - 1;
  if (segments < 4) return 0;
  let lo0: number = Infinity,
    lo1: number = Infinity,
    hi0: number = -Infinity,
    hi1: number = -Infinity;
  for (const p of points) {
    lo0 = Math.min(lo0, p[0]);
    lo1 = Math.min(lo1, p[1]);
    hi0 = Math.max(hi0, p[0]);
    hi1 = Math.max(hi1, p[1]);
  }
  const cell: number = Math.max((hi0 - lo0 + hi1 - lo1) / 64, 1e-6);
  const grid: Map<string, number[]> = new Map();
  for (let i: number = 0; i < segments; i++) {
    const a: V2 = points[i],
      b: V2 = points[(i + 1) % n];
    const x0: number = Math.floor((Math.min(a[0], b[0]) - lo0) / cell),
      x1: number = Math.floor((Math.max(a[0], b[0]) - lo0) / cell);
    const y0: number = Math.floor((Math.min(a[1], b[1]) - lo1) / cell),
      y1: number = Math.floor((Math.max(a[1], b[1]) - lo1) / cell);
    for (let x: number = x0; x <= x1; x++)
      for (let y: number = y0; y <= y1; y++) {
        const key: string = `${x},${y}`;
        if (!grid.has(key)) grid.set(key, []);
        grid.get(key)!.push(i);
      }
  }
  const visited: Set<string> = new Set();
  let count: number = 0;
  for (const list of grid.values())
    for (let x: number = 0; x < list.length; x++)
      for (let y: number = x + 1; y < list.length; y++) {
        let i: number = list[x],
          j: number = list[y];
        if (i > j) [i, j] = [j, i];
        if (j - i < 2 || (closed && i === 0 && j === segments - 1)) continue;
        const key: string = `${i}_${j}`;
        if (visited.has(key)) continue;
        visited.add(key);
        if (
          segX(points[i], points[(i + 1) % n], points[j], points[(j + 1) % n])
        )
          count++;
      }
  return count;
}
