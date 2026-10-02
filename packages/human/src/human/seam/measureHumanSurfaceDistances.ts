/**
 * Distance along the mesh's own edges from a set of source vertices to every
 * vertex (Dijkstra's shortest paths over the edge graph, sources at zero).
 *
 * The distance is the length of the shortest chain of triangle edges, which
 * never underestimates the true geodesic and overestimates it by an amount
 * that depends on how the triangulation's edges lie against the direction of the
 * path (zero along an edge chain, largest across it). That is the right side to err on for a reach: a band that should end at
 * so many metres of skin ends no farther than that. A vertex no source can
 * reach, or one no triangle uses, has distance `Infinity`.
 *
 * Positions are read once and never changed; sources are unique vertex
 * numbers of the same mesh.
 *
 * @evidence contracts/common.md#principled-implementation Edge lengths are nonnegative, so Dijkstra's algorithm with a binary heap returns exact shortest edge-chain lengths; the result is an upper bound of the surface geodesic and the comment states which way the approximation errs.
 * @evidence contracts/common.md#clear-and-simple-design One heap and one relaxation loop over an adjacency built from the triangle list.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No vertex, source or distance is special-cased; unreachable vertices report Infinity instead of a substitute.
 * @evidence contracts/common.md#meaningful-documentation The comment states the metric, the direction of its error and the unreachable value.
 * @evidence contracts/modeling.md#spatial-conventions Positions and distances are metres in the caller's single frame.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The function measures distances and defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The function consumes no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function emits no primitive.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The function builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The function displays nothing.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The function carries no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range The function admits no anatomical value.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The function defines no input a caller shapes a human form with.
 */
export function measureHumanSurfaceDistances(
  positions: readonly number[],
  indices: readonly number[],
  sources: readonly number[],
): Float64Array {
  const count = positions.length / 3;
  const neighbours: number[][] = Array.from({ length: count }, () => []);
  for (let corner = 0; corner < indices.length; corner += 3)
    for (let side = 0; side < 3; side++) {
      const a = indices[corner + side];
      const b = indices[corner + ((side + 1) % 3)];
      neighbours[a].push(b);
      neighbours[b].push(a);
    }
  const distance = new Float64Array(count).fill(Infinity);
  const heap: { vertex: number; distance: number }[] = [];
  const push = (vertex: number, at: number): void => {
    heap.push({ vertex, distance: at });
    let child = heap.length - 1;
    while (child > 0) {
      const parent = (child - 1) >> 1;
      if (heap[parent].distance <= heap[child].distance) break;
      [heap[parent], heap[child]] = [heap[child], heap[parent]];
      child = parent;
    }
  };
  const pop = (): { vertex: number; distance: number } => {
    const top = heap[0];
    const last = heap.pop()!;
    if (heap.length > 0) {
      heap[0] = last;
      let parent = 0;
      for (;;) {
        const left = parent * 2 + 1;
        const right = left + 1;
        let least = parent;
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
    const { vertex, distance: reached } = pop();
    if (reached > distance[vertex]) continue;
    for (const other of neighbours[vertex]) {
      const step = Math.hypot(
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
