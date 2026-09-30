/**
 * The vertices on the open boundary of a triangle surface: every endpoint of
 * an edge that only one triangle owns. On the body basis that is the neck
 * ring where the face was cut away, whatever height the cut was made at, so
 * a height rule or a volume cap reads the ring from the topology rather than
 * from a remembered plane. Request ordered loops when each opening must be
 * capped independently. Repeated directed edges and branched or open chains
 * refuse instead of producing a misleading partial boundary.
 *
 * The loops are read once per index array and shared: an admitted basis is
 * immutable, and the simple tier reads the same neck ring at every sample of
 * every inversion, where walking the topology again cost more than the
 * shape it measures. Callers treat the result as read-only.
 */
export function humanBodySurfaceBoundary(indices: number[]): number[];
export function humanBodySurfaceBoundary(
  indices: number[],
  orderedLoops: true,
): number[][];
export function humanBodySurfaceBoundary(
  indices: number[],
  orderedLoops?: true,
): number[] | number[][] {
  let loops = cache.get(indices);
  if (loops === undefined) {
    loops = walk(indices);
    cache.set(indices, loops);
  }
  return orderedLoops
    ? loops
    : [...new Set(loops.flat())].sort((x, y) => x - y);
}

const cache = new WeakMap<number[], number[][]>();

function walk(indices: number[]): number[][] {
  const directed = new Set<string>();
  for (let t = 0; t + 2 < indices.length; t += 3)
    for (let k = 0; k < 3; k++) {
      const key = indices[t + k] + ">" + indices[t + ((k + 1) % 3)];
      if (directed.has(key))
        throw new Error("A body surface edge cannot repeat its winding.");
      directed.add(key);
    }
  const next = new Map<number, number>();
  const incoming = new Set<number>();
  for (const key of directed) {
    const [a, b] = key.split(">").map(Number);
    if (!directed.has(b + ">" + a)) {
      if (next.has(a) || incoming.has(b))
        throw new Error("A body surface boundary must form separate loops.");
      next.set(a, b);
      incoming.add(b);
    }
  }
  const visited = new Set<number>();
  const loops: number[][] = [];
  for (const start of next.keys()) {
    if (visited.has(start)) continue;
    const loop: number[] = [];
    let vertex = start;
    while (!visited.has(vertex)) {
      loop.push(vertex);
      visited.add(vertex);
      const following = next.get(vertex);
      if (following === undefined)
        throw new Error("A body surface boundary must form separate loops.");
      vertex = following;
    }
    if (vertex !== start || loop.length < 3)
      throw new Error("A body surface boundary must form separate loops.");
    loops.push(loop);
  }
  return loops;
}
