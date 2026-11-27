import type { IAutoMovieQuadraticConicProgram } from "@automovie/interface";

/*
 * Deterministic minimum-degree elimination of the sparse symmetric KKT graph.
 * An indexed heap chooses degree then original ordinal; eliminating a vertex
 * joins its remaining neighbors and releases its adjacency. This records fill
 * without allocating a dense N-by-N matrix. Dense fill is still possible for
 * intrinsically dense graphs; the factor's actual nonzeros own that cost.
 */
export function orderQuadraticMatrix(
  data: IAutoMovieQuadraticConicProgram,
): Int32Array {
  const size: number = data.n + data.m;
  const graph: Set<number>[] = Array.from(
    { length: size },
    (): Set<number> => new Set<number>(),
  );
  for (let column: number = 0; column < data.n; column++)
    for (
      let at: number = data.columns[column]!;
      at < data.columns[column + 1]!;
      at++
    ) {
      const row: number = data.n + data.rows[at]!;
      graph[column]!.add(row);
      graph[row]!.add(column);
    }
  const heap: number[] = Array.from(
    { length: size },
    (_: unknown, i: number): number => i,
  );
  const degrees: Int32Array = Int32Array.from(
    graph,
    (neighbors: Set<number>): number => neighbors.size,
  );
  const positions: Int32Array = Int32Array.from(heap);
  const order: Int32Array = new Int32Array(size);

  /*
   * Compare live graph degrees, with an explicit stable ordinal tie.
   */
  const precedes: (a: number, b: number) => boolean = (
    a: number,
    b: number,
  ): boolean =>
    degrees[a]! < degrees[b]! || (degrees[a] === degrees[b] && a < b);

  /*
   * Repair one key; construction only descends because parent heaps do not yet
   * exist.
   */
  const repair: (start: number, rise: boolean) => void = (
    start: number,
    rise: boolean,
  ): void => {
    let at: number = start;
    const id: number = heap[at]!;
    while (rise && at > 0) {
      const parent: number = (at - 1) >>> 1;
      if (!precedes(id, heap[parent]!)) break;
      heap[at] = heap[parent]!;
      positions[heap[at]!] = at;
      at = parent;
    }
    while (2 * at + 1 < heap.length) {
      let child: number = 2 * at + 1;
      if (child + 1 < heap.length && precedes(heap[child + 1]!, heap[child]!))
        child++;
      if (!precedes(heap[child]!, id)) break;
      heap[at] = heap[child]!;
      positions[heap[at]!] = at;
      at = child;
    }
    heap[at] = id;
    positions[id] = at;
  };
  for (let at: number = (size >>> 1) - 1; at >= 0; at--) repair(at, false);
  for (let step: number = 0; step < size; step++) {
    const id: number = heap[0]!;
    const last: number = heap.pop()!;
    if (heap.length !== 0) {
      heap[0] = last;
      positions[last] = 0;
      repair(0, false);
    }
    positions[id] = -1;
    order[step] = id;
    const neighbors: number[] = [...graph[id]!];
    for (const neighbor of neighbors) graph[neighbor]!.delete(id);
    for (let i: number = 0; i < neighbors.length; i++)
      for (let j: number = i + 1; j < neighbors.length; j++) {
        graph[neighbors[i]!]!.add(neighbors[j]!);
        graph[neighbors[j]!]!.add(neighbors[i]!);
      }
    graph[id]!.clear();
    for (const neighbor of neighbors) {
      degrees[neighbor] = graph[neighbor]!.size;
      repair(positions[neighbor]!, true);
    }
  }
  return order;
}
