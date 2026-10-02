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
 * @evidence contracts/common.md#principled-implementation An edge is on the open boundary when its reverse edge is absent, so the unmatched directed edges form the boundary, and following them from vertex to vertex yields ordered loops. The premise is a consistently wound surface: a repeated directed edge, a branched chain or an open chain is refused instead of producing a partial boundary. The cache is keyed by the index array's identity, which holds because an admitted basis is immutable.
 * @evidence contracts/common.md#clear-and-simple-design One function reads the topology once and serves both the flat vertex set and the ordered loops from the same cached walk.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No height, plane or vertex is remembered or special-cased, and the cached result is shared read-only instead of recomputed per consumer.
 * @evidence contracts/common.md#meaningful-documentation States what the boundary is on the body basis, why it comes from topology, the ordered-loop option, the refusals and the shared read-only cache.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping It defines no part or group; it reads the opening of one given surface.
 * @evidenceExclude contracts/modeling.md#parameter-channels It defines and consumes no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry It emits vertex indices of an existing surface and no geometry.
 * @evidenceExclude contracts/modeling.md#spatial-conventions It carries vertex indices only, with no unit or frame.
 * @evidence contracts/modeling.md#shared-boundaries The clip height rule and the volume cap both read the neck ring from this one topological definition instead of a remembered plane, so the two readings cannot disagree about where the opening is. It only identifies the boundary and promises no normal continuity, and it refuses any surface whose opening is not separate loops.
 * @evidenceExclude contracts/modeling.md#rendered-observation It owns no displayed part or joint.
 * @evidenceExclude contracts/anatomy.md#anatomical-source It carries no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range It admits or bounds no anatomical quantity.
 * @evidenceExclude contracts/anatomy.md#parametric-authority It converts no input through which a caller shapes a body.
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
