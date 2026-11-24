/**
 * Scan a join's host rail, as an ordered chart polygon, for a strict proper
 * crossing between two of its nonadjacent edges.
 *
 * @param points The rail's chart points in traversal order.
 * @param closed Whether the polygon's closing edge is included; a rail that
 *   winds round the chart's period omits it.
 * @returns The start indices of the first crossing's edges, or null; collinear
 *   overlap and touching edges do not count as crossings.
 */
export function AutoMovieSolidJoinCrossing(
  points: readonly [number, number][],
  closed: boolean,
): [number, number] | null {
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
        return [i, j];
    }
  }
  return null;
}
