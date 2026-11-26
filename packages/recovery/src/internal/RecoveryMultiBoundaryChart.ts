import type {
  AutoMovieVector3Tuple,
  IAutoMovieRecoveryMultiBoundaryChart,
  IAutoMovieRecoveryMultiBoundarySurfaceAnalysisOperation,
} from "@automovie/interface";

import { analyzeRecoveryMultiBoundarySurface } from "../geometry/internal/analyzeRecoveryMultiBoundarySurface";

/**
 * Open one coherent genus-zero private observation mesh into a triangle disk.
 * Complete oriented boundary cycles have no repeated final vertex. The longest
 * measured perimeter is the root, with stable-key ties; repeated multi-source
 * Dijkstra joins the nearest remaining boundary through interior edges only.
 * Removing those edges from incident-face links duplicates disconnected fans.
 * Input source keys are unique. Coordinates stay in input millimetres and
 * duplicated fans share source keys, while their private vertex ordinals
 * differ. The output boundary starts at its smallest source-key and
 * incident-face pair. All input arrays stay immutable. The result retains every
 * affine source triangle exactly, solely for subsequent curve/field fitting. It
 * is not a source-free reconstruction or a publication. Nonmanifold,
 * disconnected, positive-genus, incomplete-boundary and arithmetic cases fail
 * explicitly. No embedding, surface fit, or shared-arc C0 is certified.
 */
export function RecoveryMultiBoundaryChart(
  input: Parameters<IAutoMovieRecoveryMultiBoundaryChart.Operation>[0],
): ReturnType<IAutoMovieRecoveryMultiBoundaryChart.Operation> {
  const fail: (reason: string) => never = (reason: string): never => {
    throw new Error(`Unsupported multi-boundary chart: ${reason}`);
  };
  const edgeKey: (a: number, b: number) => string = (
    a: number,
    b: number,
  ): string => (a < b ? `${a}:${b}` : `${b}:${a}`);
  const count: number = input.verticesMm.length;
  if (
    count < 3 ||
    !input.triangles.length ||
    input.vertexKeys.length !== count ||
    new Set(input.vertexKeys).size !== count ||
    input.vertexKeys.some((key: string): boolean => !key.length) ||
    input.verticesMm.some(
      (p: Readonly<AutoMovieVector3Tuple>): boolean => p.length !== 3,
    )
  )
    fail("finite positions and unique nonempty source keys are required");
  const byKey: (a: number, b: number) => number = (
    a: number,
    b: number,
  ): number =>
    input.vertexKeys[a]! < input.vertexKeys[b]!
      ? -1
      : input.vertexKeys[a]! > input.vertexKeys[b]!
        ? 1
        : 0;
  const analyze: (
    vertices: readonly Readonly<AutoMovieVector3Tuple>[],
    triangles: readonly (readonly [number, number, number])[],
  ) => ReturnType<IAutoMovieRecoveryMultiBoundarySurfaceAnalysisOperation.Operation> = (
    vertices: readonly Readonly<AutoMovieVector3Tuple>[],
    triangles: readonly (readonly [number, number, number])[],
  ): ReturnType<IAutoMovieRecoveryMultiBoundarySurfaceAnalysisOperation.Operation> =>
    analyzeRecoveryMultiBoundarySurface(vertices, triangles, fail, edgeKey);
  const source: ReturnType<typeof analyze> = analyze(
    input.verticesMm,
    input.triangles,
  );
  if (
    input.cycles.length < 2 ||
    source.cycles.length !== input.cycles.length ||
    count - source.edges.size + input.triangles.length !==
      2 - input.cycles.length
  )
    fail(
      "at least two complete boundaries on a genus-zero surface are required",
    );
  const boundaryCycleOf: Map<number, number> = new Map(),
    cyclePerimeters: number[] = [],
    anchors: number[] = [];
  input.cycles.forEach((cycle: readonly number[], cycleId: number): void => {
    if (cycle.length < 3)
      fail("a supplied boundary cycle needs at least three vertices");
    for (let i: number = 0; i < cycle.length; i++) {
      const a: number = cycle[i]!,
        b: number = cycle[(i + 1) % cycle.length]!;
      if (a < 0 || a >= count || boundaryCycleOf.has(a))
        fail("supplied boundary cycles repeat or intersect vertices");
      const rows: { a: number; b: number; face: number }[] | undefined =
        source.edges.get(edgeKey(a, b));
      if (rows?.length !== 1 || rows[0]!.a !== a || rows[0]!.b !== b)
        fail("a supplied cycle disagrees with coherent boundary incidence");
      boundaryCycleOf.set(a, cycleId);
    }
    const anchor: number = cycle.reduce(
      (best: number, id: number): number => (byKey(id, best) < 0 ? id : best),
      cycle[0]!,
    );
    anchors.push(anchor);
    const at: number = cycle.indexOf(anchor);
    let perimeter: number = 0;
    for (let i: number = 0; i < cycle.length; i++)
      perimeter += source.adjacency[cycle[(at + i) % cycle.length]!]!.get(
        cycle[(at + i + 1) % cycle.length]!,
      )!;
    if (!(perimeter > 0)) fail("a boundary perimeter is unrepresentable");
    cyclePerimeters.push(perimeter);
  });
  if (
    boundaryCycleOf.size !==
    source.cycles.reduce(
      (sum: number, cycle: number[]): number => sum + cycle.length,
      0,
    )
  )
    fail("supplied cycles omit a source boundary");
  const root: number = input.cycles.reduce(
    (best: number, _: readonly number[], i: number): number =>
      cyclePerimeters[i]! > cyclePerimeters[best]! ||
      (cyclePerimeters[i] === cyclePerimeters[best] &&
        byKey(anchors[i]!, anchors[best]!) < 0)
        ? i
        : best,
    0,
  );
  const connectedCycles: Set<number> = new Set([root]),
    connectedVertices: Set<number> = new Set(input.cycles[root]),
    cut: Set<string> = new Set();
  while (connectedCycles.size < input.cycles.length) {
    const distance: Float64Array = new Float64Array(count).fill(Infinity),
      previous: Int32Array = new Int32Array(count).fill(-1),
      settled: Uint8Array = new Uint8Array(count);
    const heap: { vertex: number; distance: number }[] = [];
    const earlier: (
      a: { vertex: number; distance: number },
      b: { vertex: number; distance: number },
    ) => boolean = (
      a: { vertex: number; distance: number },
      b: { vertex: number; distance: number },
    ): boolean =>
      a.distance < b.distance ||
      (a.distance === b.distance && byKey(a.vertex, b.vertex) < 0);
    const push: (vertex: number, value: number) => void = (
      vertex: number,
      value: number,
    ): void => {
      heap.push({ vertex, distance: value });
      let i: number = heap.length - 1;
      while (i > 0) {
        const parent: number = (i - 1) >> 1;
        if (!earlier(heap[i]!, heap[parent]!)) break;
        [heap[i], heap[parent]] = [heap[parent]!, heap[i]!];
        i = parent;
      }
    };
    const pop: () => { vertex: number; distance: number } = (): {
      vertex: number;
      distance: number;
    } => {
      const result: { vertex: number; distance: number } = heap[0]!,
        last: { vertex: number; distance: number } = heap.pop()!;
      if (heap.length) {
        heap[0] = last;
        let i: number = 0;
        for (;;) {
          let child: number = 2 * i + 1;
          if (child >= heap.length) break;
          if (
            child + 1 < heap.length &&
            earlier(heap[child + 1]!, heap[child]!)
          )
            child++;
          if (!earlier(heap[child]!, heap[i]!)) break;
          [heap[i], heap[child]] = [heap[child]!, heap[i]!];
          i = child;
        }
      }
      return result;
    };
    for (const vertex of connectedVertices) {
      distance[vertex] = 0;
      push(vertex, 0);
    }
    let target: number = -1;
    while (heap.length) {
      const current: { vertex: number; distance: number } = pop();
      if (
        settled[current.vertex] ||
        current.distance !== distance[current.vertex]
      )
        continue;
      settled[current.vertex] = 1;
      const cycle: number | undefined = boundaryCycleOf.get(current.vertex);
      if (cycle !== undefined && !connectedCycles.has(cycle)) {
        target = current.vertex;
        break;
      }
      for (const [next, length] of source.adjacency[current.vertex]!) {
        if (
          settled[next] ||
          source.edges.get(edgeKey(current.vertex, next))!.length !== 2
        )
          continue;
        const candidate: number = current.distance + length;
        if (!(candidate > current.distance))
          fail("an accumulated interior-edge path length is unrepresentable");
        if (
          candidate < distance[next]! ||
          (candidate === distance[next] &&
            previous[next]! >= 0 &&
            byKey(current.vertex, previous[next]!) < 0)
        ) {
          distance[next] = candidate;
          previous[next] = current.vertex;
          push(next, candidate);
        }
      }
    }
    if (target < 0)
      fail("no interior-edge forest connects all boundary cycles");
    const path: number[] = [target];
    let current: number = target;
    while (previous[current]! >= 0) {
      const from: number = previous[current]!;
      cut.add(edgeKey(from, current));
      path.push(from);
      current = from;
      if (path.length > count)
        fail("a shortest-path predecessor cycle is unsupported");
    }
    if (!connectedVertices.has(current) || path.length < 2)
      fail("a cut path does not join a new boundary to the existing tree");
    const cycle: number = boundaryCycleOf.get(target)!;
    connectedCycles.add(cycle);
    for (const vertex of input.cycles[cycle]!) connectedVertices.add(vertex);
    for (const vertex of path) connectedVertices.add(vertex);
  }
  const faceKeys: string[] = input.triangles.map(
    (triangle: readonly [number, number, number]): string =>
      JSON.stringify(
        triangle
          .map((vertex: number): string => input.vertexKeys[vertex]!)
          .sort((a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0)),
      ),
  );
  const verticesMm: Readonly<AutoMovieVector3Tuple>[] = input.verticesMm.map(
      (p: Readonly<AutoMovieVector3Tuple>): Readonly<AutoMovieVector3Tuple> => [
        ...p,
      ],
    ),
    vertexKeys: string[] = [...input.vertexKeys],
    fanKeys: string[] = [];
  const remap: Map<number, number>[] = Array.from(
    input.verticesMm,
    (): Map<number, number> => new Map(),
  );
  for (let vertex: number = 0; vertex < count; vertex++) {
    const neighbors: Map<number, number[]> = new Map(
      source.incident[vertex]!.map((face: number): [number, number[]] => [
        face,
        [],
      ]),
    );
    for (const next of source.adjacency[vertex]!.keys()) {
      const key: string = edgeKey(vertex, next),
        rows: { a: number; b: number; face: number }[] = source.edges.get(key)!;
      if (rows.length === 2 && !cut.has(key)) {
        neighbors.get(rows[0]!.face)!.push(rows[1]!.face);
        neighbors.get(rows[1]!.face)!.push(rows[0]!.face);
      }
    }
    const ordered: number[] = [...source.incident[vertex]!].sort(
      (a: number, b: number): number =>
        faceKeys[a]! < faceKeys[b]! ? -1 : faceKeys[a]! > faceKeys[b]! ? 1 : 0,
    );
    let components: number = 0;
    for (const first of ordered) {
      if (remap[vertex]!.has(first)) continue;
      const id: number = components++ === 0 ? vertex : verticesMm.length;
      if (id === verticesMm.length) {
        verticesMm.push([...input.verticesMm[vertex]!]);
        vertexKeys.push(input.vertexKeys[vertex]!);
      }
      fanKeys[id] = faceKeys[first]!;
      const queue: number[] = [first];
      remap[vertex]!.set(first, id);
      for (let i: number = 0; i < queue.length; i++)
        for (const next of neighbors.get(queue[i]!)!)
          if (!remap[vertex]!.has(next)) {
            remap[vertex]!.set(next, id);
            queue.push(next);
          }
    }
  }
  const triangles: [number, number, number][] = input.triangles.map(
    (
      triangle: readonly [number, number, number],
      face: number,
    ): [number, number, number] =>
      [
        remap[triangle[0]]!.get(face)!,
        remap[triangle[1]]!.get(face)!,
        remap[triangle[2]]!.get(face)!,
      ],
  );
  const result: ReturnType<typeof analyze> = analyze(verticesMm, triangles),
    duplicatedFanVertices: number = verticesMm.length - count;
  if (
    result.cycles.length !== 1 ||
    verticesMm.length - result.edges.size + triangles.length !== 1 ||
    duplicatedFanVertices !== cut.size + input.cycles.length - 1
  )
    fail("the actual remapped topology is not one disk");
  if (result.cycles[0]!.length !== boundaryCycleOf.size + 2 * cut.size)
    fail(
      "the remapped boundary does not contain exactly the source boundaries and both cut banks",
    );
  // Every corresponding triangle uses bit-identical coordinates in the same order.
  // This checks PL preservation without a tolerance or a geometric welding rule.
  for (let face: number = 0; face < triangles.length; face++)
    for (let k: number = 0; k < 3; k++)
      for (let axis: number = 0; axis < 3; axis++) {
        if (
          !Object.is(
            verticesMm[triangles[face]![k]!]![axis],
            input.verticesMm[input.triangles[face]![k]!]![axis],
          )
        )
          fail("fan remapping changed a source triangle coordinate");
      }
  const sourceAreaDifferenceMm2: number = result.areaMm2 - source.areaMm2;
  if (sourceAreaDifferenceMm2 !== 0)
    fail("fan remapping changed measured source area");
  const cycle: number[] = result.cycles[0]!,
    anchor: number = cycle.reduce(
      (best: number, id: number): number =>
        vertexKeys[id]! < vertexKeys[best]! ||
        (vertexKeys[id] === vertexKeys[best] && fanKeys[id]! < fanKeys[best]!)
          ? id
          : best,
      cycle[0]!,
    ),
    at: number = cycle.indexOf(anchor);
  const boundaryCycle: number[] = [...cycle.slice(at), ...cycle.slice(0, at)];
  return {
    verticesMm,
    triangles,
    vertexKeys,
    boundaryCycle,
    cutEdges: cut.size,
    duplicatedFanVertices,
    sourceAreaDifferenceMm2,
  };
}
