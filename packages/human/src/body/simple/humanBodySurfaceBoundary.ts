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
 *
 * @evidence contracts/common.md#principled-implementation Directed triangle edges cancel against their reverse; remaining edges must form disjoint closed loops of at least three vertices, with repeated winding and branched chains refused.
 * @evidence contracts/common.md#clear-and-simple-design One topology walk supplies both ordered loops for caps and the sorted unique boundary set for height rules; no remembered geometric cut plane is needed.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Every opening follows the same edge rule, including an empty boundary; immutable admitted indices and triangle alignment are premises rather than hidden repairs.
 * @evidence contracts/common.md#meaningful-documentation The comment states loop ordering, refusal and borrowed cached-loop ownership; the flat result is a fresh sorted array and coordinates are never read.
 * @evidence contracts/performance.md#efficient-algorithms The first walk costs expected O(F+B) time and O(F+B) storage for F triangles and B boundary vertices; flat requests additionally deduplicate and sort B entries in O(B log B).
 * @evidence contracts/performance.md#reuse-equivalent-work A WeakMap keyed by the exact immutable index array shares ordered topology across candidate positions; mutating that array would invalidate this premise and is unsupported.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Weak keys release cached loops when their index array becomes unreachable; one entry exists per live keyed array, with no global population bound beyond those callers and no handles or tasks.
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
  let loops: number[][] | undefined = cache.get(indices);
  if (loops === undefined) {
    loops = walk(indices);
    cache.set(indices, loops);
  }
  return orderedLoops
    ? loops
    : [...new Set(loops.flat())].sort((x: number, y: number): number => x - y);
}

const cache: WeakMap<number[], number[][]> = new WeakMap<number[], number[][]>();

function walk(indices: number[]): number[][] {
  const directed: Set<string> = new Set<string>();
  for (let t: number = 0; t + 2 < indices.length; t += 3)
    for (let k: number = 0; k < 3; k++) {
      const key: string = indices[t + k] + ">" + indices[t + ((k + 1) % 3)];
      if (directed.has(key))
        throw new Error("A body surface edge cannot repeat its winding.");
      directed.add(key);
    }
  const next: Map<number, number> = new Map<number, number>();
  const incoming: Set<number> = new Set<number>();
  for (const key of directed) {
    const [a, b]: number[] = key.split(">").map(Number);
    if (!directed.has(b + ">" + a)) {
      if (next.has(a) || incoming.has(b))
        throw new Error("A body surface boundary must form separate loops.");
      next.set(a, b);
      incoming.add(b);
    }
  }
  const visited: Set<number> = new Set<number>();
  const loops: number[][] = [];
  for (const start of next.keys()) {
    if (visited.has(start)) continue;
    const loop: number[] = [];
    let vertex: number = start;
    while (!visited.has(vertex)) {
      loop.push(vertex);
      visited.add(vertex);
      const following: number | undefined = next.get(vertex);
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
