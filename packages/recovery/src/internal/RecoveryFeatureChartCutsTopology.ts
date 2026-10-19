import type { IAutoMovieCurve64 as C } from "@automovie/engine/geometry/curve";

type Row = { a: number; b: number; face: number };
type Topology = {
  edges: Map<string, Row[]>;
  vertexEdges: string[][];
  incident: number[][];
  components: number[][];
  faceComponent: Int32Array;
  cycles: number[][];
  areas: number[];
  normals: C.Vector[];
};

/**
 * Create the feature-cut topology observer with its original failure and edge-key policy.
 *
 * @evidence contracts/common.md#principled-implementation Triangle admission, geometric normals, links, components and boundary cycles retain the original traversal.
 * @evidence contracts/common.md#clear-and-simple-design This phase retains its original arithmetic and ordered state transitions while its caller owns orchestration.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Extraction introduces no input correction, geometry fallback, reordered reduction or changed admission condition.
 * @evidence contracts/common.md#meaningful-documentation States the phase responsibility, shared-state ownership and numerical limits inherited from the calling algorithm.
 * @evidence contracts/performance.md#efficient-algorithms Each invocation visits its supplied vertices, triangles and incidence graphs.
 * @evidence contracts/performance.md#reuse-equivalent-work The same observer validates the original, subdivided and fan-materialized populations.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned closure retains only failure and key functions; each topology result belongs to its caller.
 */
export function RecoveryFeatureChartCutsTopology(
  fail: (reason: string) => never,
  edge: (a: number, b: number) => string,
): (
  vertices: readonly C.Vector[],
  triangles: readonly (readonly [number, number, number])[],
) => Topology {
  const analyze: (
    vertices: readonly C.Vector[],
    triangles: readonly (readonly [number, number, number])[],
  ) => Topology = (
    vertices: readonly C.Vector[],
    triangles: readonly (readonly [number, number, number])[],
  ): Topology => {
    const edges: Map<string, Row[]> = new Map(),
      incident: number[][] = Array.from(vertices, (): number[] => []),
      vertexEdges: string[][] = Array.from(vertices, (): string[] => []);
    const links: Map<number, Set<number>>[] = Array.from(
        vertices,
        (): Map<number, Set<number>> => new Map(),
      ),
      adjacent: number[][] = Array.from(triangles, (): number[] => []),
      words: Set<string> = new Set();
    const areas: number[] = [],
      normals: C.Vector[] = [];
    triangles.forEach(
      (t: readonly [number, number, number], face: number): void => {
        if (
          t.length !== 3 ||
          new Set(t).size !== 3 ||
          t.some(
            (id: number): boolean =>
              !Number.isSafeInteger(id) || id < 0 || id >= vertices.length,
          )
        )
          fail("triangle addresses are invalid");
        const word: string = [...t]
          .sort((a: number, b: number): number => a - b)
          .join(":");
        if (words.has(word)) fail("duplicate triangles are unsupported");
        words.add(word);
        const a: C.Vector = vertices[t[0]]!,
          b: C.Vector = vertices[t[1]]!,
          c: C.Vector = vertices[t[2]]!;
        const u: number[] = b.map((x: number, k: number): number => x - a[k]!),
          v: number[] = c.map((x: number, k: number): number => x - a[k]!);
        const n: C.Vector = [
            u[1]! * v[2]! - u[2]! * v[1]!,
            u[2]! * v[0]! - u[0]! * v[2]!,
            u[0]! * v[1]! - u[1]! * v[0]!,
          ],
          length: number = Math.hypot(...n),
          area: number = length / 2;
        if (!(area > 0 && Number.isFinite(length)))
          fail("a triangle area or normal is unrepresentable");
        areas.push(area);
        normals.push(
          n.map((x: number): number => x / length) as [number, number, number],
        );
        for (let k: number = 0; k < 3; k++) {
          const from: number = t[k]!,
            to: number = t[(k + 1) % 3]!,
            other: number = t[(k + 2) % 3]!,
            key: string = edge(from, to),
            rows: Row[] = edges.get(key) ?? [];
          incident[from]!.push(face);
          rows.push({ a: from, b: to, face });
          edges.set(key, rows);
          for (const [x, y] of [
            [to, other],
            [other, to],
          ]) {
            const set: Set<number> = links[from]!.get(x!) ?? new Set();
            set.add(y!);
            links[from]!.set(x!, set);
          }
        }
      },
    );
    if (incident.some((rows: number[]): boolean => !rows.length))
      fail("unused vertices do not belong to a chart");
    const next: Map<number, number> = new Map(),
      incoming: Set<number> = new Set();
    for (const [key, rows] of edges) {
      const row: Row = rows[0]!;
      vertexEdges[row.a]!.push(key);
      vertexEdges[row.b]!.push(key);
      const p: C.Vector = vertices[row.a]!,
        q: C.Vector = vertices[row.b]!,
        length: number = Math.hypot(q[0] - p[0], q[1] - p[1], q[2] - p[2]);
      if (!(length > 0 && Number.isFinite(length)))
        fail("an edge length is collapsed or unrepresentable");
      if (rows.length === 1) {
        if (next.has(row.a) || incoming.has(row.b))
          fail("boundary arcs branch at one occurrence");
        next.set(row.a, row.b);
        incoming.add(row.b);
      } else if (
        rows.length !== 2 ||
        row.a !== rows[1]!.b ||
        row.b !== rows[1]!.a
      )
        fail("edge incidence is nonmanifold or winding is incoherent");
      else {
        adjacent[row.face]!.push(rows[1]!.face);
        adjacent[rows[1]!.face]!.push(row.face);
      }
    }
    for (let id: number = 0; id < vertices.length; id++) {
      const link: Map<number, Set<number>> = links[id]!,
        first: number = link.keys().next().value!,
        visited: Set<number> = new Set([first]),
        queue: number[] = [first];
      for (let k: number = 0; k < queue.length; k++)
        for (const to of link.get(queue[k]!)!)
          if (!visited.has(to)) {
            visited.add(to);
            queue.push(to);
          }
      const degrees: number[] = [...link.values()].map(
          (set: Set<number>): number => set.size,
        ),
        ends: number = degrees.filter(
          (degree: number): boolean => degree === 1,
        ).length;
      if (
        visited.size !== link.size ||
        degrees.some((degree: number): boolean => degree < 1 || degree > 2) ||
        (next.has(id)
          ? ends !== 2 || !incoming.has(id)
          : ends !== 0 || incoming.has(id))
      )
        fail("a vertex link is not a boundary path or interior circle");
    }
    const cycles: number[][] = [],
      visited: Set<number> = new Set();
    for (const first of next.keys()) {
      if (visited.has(first)) continue;
      const cycle: number[] = [];
      let at: number = first;
      do {
        if (visited.has(at) || !next.has(at))
          fail("boundary traversal does not form disjoint cycles");
        visited.add(at);
        cycle.push(at);
        at = next.get(at)!;
      } while (at !== first);
      if (cycle.length < 3)
        fail("a boundary cycle has fewer than three occurrences");
      cycles.push(cycle);
    }
    const components: number[][] = [],
      faceComponent: Int32Array = new Int32Array(triangles.length).fill(-1);
    for (let face: number = 0; face < triangles.length; face++)
      if (faceComponent[face] === -1) {
        const queue: number[] = [face],
          id: number = components.length;
        faceComponent[face] = id;
        for (let k: number = 0; k < queue.length; k++)
          for (const to of adjacent[queue[k]!]!)
            if (faceComponent[to] === -1) {
              faceComponent[to] = id;
              queue.push(to);
            }
        components.push(queue);
      }
    return {
      edges,
      vertexEdges,
      incident,
      components,
      faceComponent,
      cycles,
      areas,
      normals,
    };
  };

  return analyze;
}
