/**
 * The shortest path between two vertices over weighted undirected edges
 * (Dijkstra), as the vertex sequence from `from` to `to` inclusive, or null
 * when `to` cannot be reached. Ties keep the first relaxation, and the
 * frontier is scanned in vertex order, so the result is deterministic.
 */
export function findHumanSourceShortestPath(edges: ReadonlyMap<number, ReadonlyMap<number, number>>, from: number, to: number): number[] | null {
  const distance = new Map<number, number>([[from, 0]]);
  const previous = new Map<number, number>();
  const done = new Set<number>();
  while (true) {
    let current = -1;
    let best = Infinity;
    for (const [vertex, d] of distance)
      if (!done.has(vertex) && (d < best || (d === best && vertex < current))) {
        best = d;
        current = vertex;
      }
    if (current < 0) return null;
    if (current === to) break;
    done.add(current);
    for (const [next, weight] of edges.get(current) ?? new Map<number, number>()) {
      const candidate = best + weight;
      if (candidate < (distance.get(next) ?? Infinity)) {
        distance.set(next, candidate);
        previous.set(next, current);
      }
    }
  }
  const path = [to];
  while (path[path.length - 1] !== from) path.push(previous.get(path[path.length - 1])!);
  return path.reverse();
}
