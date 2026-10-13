/**
 * Run Dijkstra shortest paths on actual triangle-edge chains with source vertices at zero. Coordinates/distances use the common metre frame. Caller supplies finite coordinates, compact aligned triangles and unique valid source indices. Edge chains constrain paths to triangulation and generally overestimate continuous-surface geodesic distance; this is a sampled graph reach, not a clinical neck measurement.
 *
 * Unreachable non-source vertices remain Infinity. An unused source vertex still has zero distance; unused vertices are not unconditionally Infinity. Triangle adjacency retains duplicates and Euclidean edge lengths are read during each relaxation, not precomputed once. Inputs remain unchanged and the Float64 distance buffer is owned.
 *
 * @evidence contracts/common.md#principled-implementation Actual triangle adjacency and metre edge lengths determine the source-seeded shortest graph paths used by seam reach/fade.
 * @evidence contracts/common.md#clear-and-simple-design Adjacency and binary min-heap implement one distance field with stale-entry suppression; anatomical classification and transition policy remain consumers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Infinity represents absent graph reach, unused seeds retain zero, and graph paths are not advertised as exact continuous geodesics or clinical extent.
 * @evidence contracts/common.md#meaningful-documentation Prose states metre units, finite/index premises, duplicate adjacency, per-relaxation length work and source/unused behavior.
 * @evidence contracts/performance.md#efficient-algorithms Source-sized adjacency and lazy duplicate heap support actual graph relaxations; with E stored edges, work follows O((N+E) log(E+sources)) plus adjacency construction rather than all-pairs paths.
 * @evidence contracts/performance.md#reuse-equivalent-work One source-seeded run answers every vertex reach, and stale longer heap entries reuse the current best distance instead of repeating their outgoing relaxations.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned N-sized Float64 buffer is owned; adjacency and lazy heap are call-local and scale with actual graph relaxations, with no asset/render/task retained.
 */
export function measureHumanSurfaceDistances(
  positions: readonly number[],
  indices: readonly number[],
  sources: readonly number[],
): Float64Array {
  const count: number = positions.length / 3;
  const neighbours: number[][] = Array.from({ length: count }, (): number[] => []);
  for (let corner: number = 0; corner < indices.length; corner += 3)
    for (let side: number = 0; side < 3; side++) {
      const a: number = indices[corner + side];
      const b: number = indices[corner + ((side + 1) % 3)];
      neighbours[a].push(b);
      neighbours[b].push(a);
    }
  const distance: Float64Array = new Float64Array(count).fill(Infinity);
  const heap: { vertex: number; distance: number }[] = [];
  const push: (vertex: number, at: number) => void = (vertex: number, at: number): void => {
    heap.push({ vertex, distance: at });
    let child: number = heap.length - 1;
    while (child > 0) {
      const parent: number = (child - 1) >> 1;
      if (heap[parent].distance <= heap[child].distance) break;
      [heap[parent], heap[child]] = [heap[child], heap[parent]];
      child = parent;
    }
  };
  const pop: () => { vertex: number; distance: number } = (): { vertex: number; distance: number } => {
    const top: { vertex: number; distance: number } = heap[0];
    const last: { vertex: number; distance: number } = heap.pop()!;
    if (heap.length > 0) {
      heap[0] = last;
      let parent: number = 0;
      for (;;) {
        const left: number = parent * 2 + 1;
        const right: number = left + 1;
        let least: number = parent;
        if (left < heap.length && heap[left].distance < heap[least].distance)
          least = left;
        if (right < heap.length && heap[right].distance < heap[least].distance)
          least = right;
        if (least === parent) break;
        [heap[parent], heap[least]] = [heap[least], heap[parent]];
        parent = least;
      }
    }
    return top;
  };
  for (const source of sources) {
    distance[source] = 0;
    push(source, 0);
  }
  while (heap.length > 0) {
    const { vertex, distance: reached }: ReturnType<typeof pop> = pop();
    if (reached > distance[vertex]) continue;
    for (const other of neighbours[vertex]) {
      const step: number = Math.hypot(
        positions[vertex * 3] - positions[other * 3],
        positions[vertex * 3 + 1] - positions[other * 3 + 1],
        positions[vertex * 3 + 2] - positions[other * 3 + 2],
      );
      if (reached + step < distance[other]) {
        distance[other] = reached + step;
        push(other, reached + step);
      }
    }
  }
  return distance;
}
