/**
 * Scan a join's host rail, as an ordered chart polygon, for a strict proper crossing between two of its nonadjacent edges.
 *
 * @param points The rail's chart points in traversal order.
 * @param closed Whether the polygon's closing edge is included; a rail that winds round the chart's period omits it.
 * @returns The first crossing's description, or null; collinear overlap and touching edges do not count as crossings.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Two segments cross properly when each one's ends lie strictly on opposite sides of the other's line, read by the oriented chart cross product; a rail offset past its radius of curvature crosses itself so.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One pair scan with one orientation predicate, moved unchanged out of `AutoMovieSolidJoin`.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No tolerance widens or narrows the strict test, and touching or overlapping edges are left to the later clip.
 * @evidence contracts/development/common.md#meaningful-documentation States the polygon, the closing edge, the result and what does not count.
 * @evidence contracts/development/implementation.md#efficient-algorithms O(n squared) orientation tests for n points, with the first crossing returned at once.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure scan of one polygon coordinates no repeated work.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Borrows the points for the call and returns one string or null.
 */
export function AutoMovieSolidJoinCrossing(
  points: readonly [number, number][],
  closed: boolean,
): string | null {
  const n: number = points.length;
  const edges: number = closed ? n : n - 1;

  /** Oriented chart cross product used by the strict crossing test. */
  const turn: (
    a: readonly [number, number],
    b: readonly [number, number],
    c: readonly [number, number],
  ) => number = (
    a: readonly [number, number],
    b: readonly [number, number],
    c: readonly [number, number],
  ): number => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
  for (let i: number = 0; i < edges; i++) {
    const a: [number, number] = points[i]!;
    const b: [number, number] = points[(i + 1) % n]!;
    for (let j: number = i + 2; j < edges; j++) {
      if (closed && i === 0 && j === n - 1) continue;
      const c: [number, number] = points[j]!;
      const d: [number, number] = points[(j + 1) % n]!;
      if (
        turn(a, b, c) * turn(a, b, d) < 0 &&
        turn(c, d, a) * turn(c, d, b) < 0
      )
        return `between edges ${i} and ${j}`;
    }
  }
  return null;
}
