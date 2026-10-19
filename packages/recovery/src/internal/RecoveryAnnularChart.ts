import type { IAutoMovieCurve64 as C } from "@automovie/engine/geometry/curve";

/**
 * Cut a private oriented annular triangle chart along an observed edge path.
 * Two coherent boundary cycles become bottom/top and the duplicated seam becomes
 * left/right. Original positions and faces stay private observations for fitting.
 * The caller establishes genus zero and exactly two boundary cycles beforehand.
 * A seam touching another boundary vertex is refused rather than changing topology.
 *
 * @evidence contracts/common.md#principled-implementation Dijkstra selects a shortest physical edge path between deterministic incidence anchors, excluding other boundary vertices. Removing its incident edges from each vertex link separates two oriented triangle fans and duplicates only the seam observations.
 * @evidence contracts/common.md#clear-and-simple-design One private helper owns seam selection, fan duplication and square-side ordering; harmonic parameterization and polynomial fitting remain separate consumers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No positional weld, arbitrary bridge, copied normal, anatomical seam or output mesh is generated. An absent simple anchored path or ambiguous oriented fan fails explicitly.
 * @evidence contracts/common.md#meaningful-documentation States required annulus topology, physical units, deterministic anchors, private-data lifetime and local unsupported cases.
 * @evidence contracts/performance.md#efficient-algorithms For V chart vertices and F triangles, adjacency and incidence use O(V+F) space. Heap Dijkstra costs O((V+F)log(V+F)); local seam-link traversal costs the total incident seam-face population.
 * @evidence contracts/performance.md#reuse-equivalent-work One oriented edge registry serves path adjacency, vertex-link separation and boundary checks; no source-wide extraction or duplicate chart solve occurs.
 * @evidence contracts/performance.md#bound-retention-and-release-resources All graph and heap state expires on return or failure; at most one duplicate per seam vertex plus remapped private triangles transfers to the observation caller. Nothing is published to the reconstruction consumer.
 */
export function RecoveryAnnularChart(input: {
  verticesMm: readonly C.Vector[];
  triangles: readonly (readonly [number, number, number])[];
  vertexKeys: readonly string[];
  before: readonly number[];
  after: readonly number[];
}): {
  verticesMm: C.Vector[];
  triangles: [number, number, number][];
  vertexKeys: string[];
  sides: [number[], number[], number[], number[]];
  seam: number[];
  seamLengthMm: number;
} {
  if (
    input.verticesMm.length !== input.vertexKeys.length ||
    input.before.length < 3 ||
    input.after.length < 3
  )
    throw new Error(
      "A private annulus needs two nonempty complete boundary cycles",
    );
  const edgeKey: (a: number, b: number) => string = (
    a: number,
    b: number,
  ): string => (a < b ? `${a}:${b}` : `${b}:${a}`);
  const incident: number[][] = Array.from(
      { length: input.verticesMm.length },
      (): number[] => [],
    ),
    adjacency: Map<number, number>[] = Array.from(
      { length: input.verticesMm.length },
      (): Map<number, number> => new Map(),
    );
  const edges: Map<string, { face: number; a: number; b: number }[]> =
    new Map();
  input.triangles.forEach(
    (triangle: readonly [number, number, number], face: number): void => {
      if (
        new Set(triangle).size !== 3 ||
        triangle.some(
          (id: number): boolean =>
            !Number.isSafeInteger(id) ||
            id < 0 ||
            id >= input.verticesMm.length,
        )
      )
        throw new Error("Private annular triangle addresses are invalid");
      for (const vertex of triangle) incident[vertex]!.push(face);
      for (let k: number = 0; k < 3; k++) {
        const a: number = triangle[k]!,
          b: number = triangle[(k + 1) % 3]!,
          key: string = edgeKey(a, b),
          p: C.Vector = input.verticesMm[a]!,
          q: C.Vector = input.verticesMm[b]!;
        const distance: number = Math.hypot(
          p[0] - q[0],
          p[1] - q[1],
          p[2] - q[2],
        );
        if (!(distance > 0 && Number.isFinite(distance)))
          throw new Error("A private annular chart edge is collapsed");
        adjacency[a]!.set(b, distance);
        adjacency[b]!.set(a, distance);
        const rows: { face: number; a: number; b: number }[] =
          edges.get(key) ?? [];
        rows.push({ face, a, b });
        edges.set(key, rows);
      }
    },
  );
  for (const rows of edges.values())
    if (rows.length > 2 || (rows.length === 2 && rows[0]!.a !== rows[1]!.b))
      throw new Error(
        "A private annular chart must have coherent manifold edge incidence",
      );
  const boundary: Set<number> = new Set([...input.before, ...input.after]);
  if (boundary.size !== input.before.length + input.after.length)
    throw new Error("Annular boundary cycles intersect or repeat a vertex");
  for (const cycle of [input.before, input.after])
    for (let i: number = 0; i < cycle.length; i++) {
      const a: number = cycle[i]!,
        b: number = cycle[(i + 1) % cycle.length]!,
        rows: { face: number; a: number; b: number }[] | undefined = edges.get(
          edgeKey(a, b),
        );
      if (rows?.length !== 1 || rows[0]!.a !== a || rows[0]!.b !== b)
        throw new Error(
          "An annular boundary cycle disagrees with oriented source triangles",
        );
    }
  const anchor: (cycle: readonly number[]) => number = (
    cycle: readonly number[],
  ): number =>
    cycle.reduce(
      (best: number, id: number): number =>
        input.vertexKeys[id]! < input.vertexKeys[best]! ? id : best,
      cycle[0]!,
    );
  const start: number = anchor(input.before),
    target: number = anchor(input.after),
    distance: Float64Array = new Float64Array(input.verticesMm.length).fill(
      Infinity,
    ),
    previous: Int32Array = new Int32Array(input.verticesMm.length).fill(-1);
  type Entry = { vertex: number; distance: number };
  const heap: Entry[] = [];
  const earlier: (a: Entry, b: Entry) => boolean = (
    a: Entry,
    b: Entry,
  ): boolean =>
    a.distance < b.distance ||
    (a.distance === b.distance &&
      input.vertexKeys[a.vertex]! < input.vertexKeys[b.vertex]!);
  const push: (entry: Entry) => void = (entry: Entry): void => {
    heap.push(entry);
    let i: number = heap.length - 1;
    while (i > 0) {
      const parent: number = (i - 1) >> 1;
      if (!earlier(heap[i]!, heap[parent]!)) break;
      [heap[i], heap[parent]] = [heap[parent]!, heap[i]!];
      i = parent;
    }
  };
  const pop: () => Entry = (): Entry => {
    const result: Entry = heap[0]!,
      last: Entry = heap.pop()!;
    if (heap.length) {
      heap[0] = last;
      let i: number = 0;
      for (;;) {
        let child: number = 2 * i + 1;
        if (child >= heap.length) break;
        if (child + 1 < heap.length && earlier(heap[child + 1]!, heap[child]!))
          child++;
        if (!earlier(heap[child]!, heap[i]!)) break;
        [heap[i], heap[child]] = [heap[child]!, heap[i]!];
        i = child;
      }
    }
    return result;
  };
  distance[start] = 0;
  push({ vertex: start, distance: 0 });
  while (heap.length) {
    const current: Entry = pop();
    if (current.distance !== distance[current.vertex]) continue;
    if (current.vertex === target) break;
    for (const [next, length] of adjacency[current.vertex]!) {
      if (
        (boundary.has(next) && next !== target) ||
        edges.get(edgeKey(current.vertex, next))!.length !== 2
      )
        continue;
      const candidate: number = current.distance + length;
      if (candidate < distance[next]!) {
        distance[next] = candidate;
        previous[next] = current.vertex;
        push({ vertex: next, distance: candidate });
      }
    }
  }
  if (!Number.isFinite(distance[target]))
    throw new Error(
      "No simple interior edge seam joins the deterministic annulus anchors",
    );
  const seam: number[] = [target];
  while (seam[seam.length - 1] !== start) {
    const id: number = previous[seam.at(-1)!]!;
    if (id < 0 || seam.length > input.verticesMm.length)
      throw new Error("Annular seam predecessor is unresolved");
    seam.push(id);
  }
  seam.reverse();
  const seamEdges: Set<string> = new Set(
    seam.slice(1).map((id: number, i: number): string => edgeKey(seam[i]!, id)),
  );
  const labels: Map<number, Map<number, 0 | 1>> = new Map();
  for (let i: number = 0; i < seam.length; i++) {
    const vertex: number = seam[i]!,
      neighbors: Map<number, Set<number>> = new Map(
        incident[vertex]!.map((face: number): [number, Set<number>] => [
          face,
          new Set(),
        ]),
      ),
      seeds: Map<number, 0 | 1> = new Map();
    for (const neighbor of adjacency[vertex]!.keys()) {
      const key: string = edgeKey(vertex, neighbor),
        rows: { face: number; a: number; b: number }[] = edges.get(key)!;
      if (!seamEdges.has(key)) {
        if (rows.length === 2) {
          neighbors.get(rows[0]!.face)!.add(rows[1]!.face);
          neighbors.get(rows[1]!.face)!.add(rows[0]!.face);
        }
      } else {
        const from: number = neighbor === seam[i + 1] ? vertex : neighbor;
        for (const row of rows) {
          const value: 0 | 1 = row.a === from ? 0 : 1;
          if (seeds.has(row.face) && seeds.get(row.face) !== value)
            throw new Error("An oriented seam fan has contradictory sides");
          seeds.set(row.face, value);
        }
      }
    }
    const values: Map<number, 0 | 1> = new Map(),
      queue: number[] = [...seeds.keys()];
    for (const [face, label] of seeds) values.set(face, label);
    for (let k: number = 0; k < queue.length; k++)
      for (const next of neighbors.get(queue[k]!)!) {
        const value: 0 | 1 = values.get(queue[k]!)!;
        if (values.has(next) && values.get(next) !== value)
          throw new Error(
            "Cutting the seam does not separate two coherent vertex fans",
          );
        if (!values.has(next)) {
          values.set(next, value);
          queue.push(next);
        }
      }
    if (
      values.size !== incident[vertex]!.length ||
      new Set(values.values()).size !== 2
    )
      throw new Error(
        "A seam vertex does not have exactly two supported incident fans",
      );
    labels.set(vertex, values);
  }
  const rotate: (cycle: readonly number[], first: number) => number[] = (
    cycle: readonly number[],
    first: number,
  ): number[] => {
    const at: number = cycle.indexOf(first);
    return [...cycle.slice(at), ...cycle.slice(0, at)];
  };
  const bottom: number[] = rotate(input.before, start),
    top: number[] = [target, ...rotate(input.after, target).slice(1).reverse()];
  const firstFace: number = edges.get(edgeKey(bottom[0]!, bottom[1]!))![0]!
      .face,
    left: 0 | 1 = labels.get(start)!.get(firstFace)!;
  const verticesMm: C.Vector[] = [...input.verticesMm],
    vertexKeys: string[] = [...input.vertexKeys],
    duplicate: Map<number, number> = new Map();
  for (const vertex of seam) {
    duplicate.set(vertex, verticesMm.length);
    verticesMm.push(input.verticesMm[vertex]!);
    vertexKeys.push(input.vertexKeys[vertex]!);
  }
  const triangles: [number, number, number][] = input.triangles.map(
    (
      triangle: readonly [number, number, number],
      face: number,
    ): [number, number, number] =>
      triangle.map((vertex: number): number =>
        labels.has(vertex) && labels.get(vertex)!.get(face) !== left
          ? duplicate.get(vertex)!
          : vertex,
      ) as [number, number, number],
  );
  const sides: [number[], number[], number[], number[]] = [
    [...bottom, duplicate.get(start)!],
    seam.map((id: number): number => duplicate.get(id)!),
    [...top, duplicate.get(target)!],
    [...seam],
  ];
  const generatedEdges: Set<string> = new Set(
    triangles.flatMap((triangle: readonly [number, number, number]): string[] =>
      triangle.map((id: number, k: number): string =>
        edgeKey(id, triangle[(k + 1) % 3]!),
      ),
    ),
  );
  for (const side of sides)
    for (let i: number = 1; i < side.length; i++)
      if (!generatedEdges.has(edgeKey(side[i - 1]!, side[i]!)))
        throw new Error(
          "Cut annulus side does not follow its actual triangle fan",
        );
  return {
    verticesMm,
    triangles,
    vertexKeys,
    sides,
    seam,
    seamLengthMm: distance[target]!,
  };
}
