import type { IAutoMovieCurve64 as C } from "../../../packages/engine/src/geometry/curve/IAutoMovieCurve64.ts";

/**
 * Analyze coherent private surface incidence and complete boundary cycles.
 *
 * @evidence contracts/common.md#principled-implementation The unchanged oriented edge uses, face connectivity, vertex links and successor walks admit the actual supplied triangles; area remains a measured private observation in square millimetres.
 * @evidence contracts/common.md#clear-and-simple-design This helper owns the extracted stage while the existing caller retains orchestration and its public contract.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Original arithmetic, iteration order, identities and failure messages are retained without new fallback geometry or inferred correspondence.
 * @evidence contracts/common.md#meaningful-documentation States physical units, admitted authority and the stage's output responsibility.
 * @evidence contracts/performance.md#efficient-algorithms For V vertices and F faces, the original adjacency and link traversals retain O(V+F) storage and incidence work.
 * @evidence contracts/performance.md#reuse-equivalent-work The caller invokes this same analysis for the source and remapped cut result rather than substituting a theoretical disk claim.
 * @evidence contracts/performance.md#bound-retention-and-release-resources All maps and walks are call-local; returned private incidence belongs to one cut-chart operation.
 */
export function analyzeRecoveryMultiBoundarySurface(
  vertices: readonly C.Vector[],
  triangles: readonly (readonly [number, number, number])[],
  fail: (reason: string) => never,
  edgeKey: (a: number, b: number) => string,
): {
  edges: Map<string, { a: number; b: number; face: number }[]>;
  adjacency: Map<number, number>[];
  incident: number[][];
  cycles: number[][];
  areaMm2: number;
} {
  const edges: ReturnType<typeof analyzeRecoveryMultiBoundarySurface>["edges"] =
      new Map(),
    adjacency: Map<number, number>[] = Array.from(
      vertices,
      (): Map<number, number> => new Map(),
    );
  const incident: number[][] = Array.from(vertices, (): number[] => []),
    faceAdjacent: number[][] = Array.from(triangles, (): number[] => []);
  const links: Map<number, Set<number>>[] = Array.from(
      vertices,
      (): Map<number, Set<number>> => new Map(),
    ),
    faces: Set<string> = new Set();
  let areaMm2: number = 0;
  triangles.forEach(
    (triangle: readonly [number, number, number], face: number): void => {
      if (
        triangle.length !== 3 ||
        new Set(triangle).size !== 3 ||
        triangle.some(
          (id: number): boolean =>
            !Number.isSafeInteger(id) || id < 0 || id >= vertices.length,
        )
      )
        fail("triangle addresses are invalid");
      const word: string = [...triangle]
        .sort((a: number, b: number): number => a - b)
        .join(":");
      if (faces.has(word)) fail("duplicate triangles are unsupported");
      faces.add(word);
      const a: C.Vector = vertices[triangle[0]]!,
        b: C.Vector = vertices[triangle[1]]!,
        c: C.Vector = vertices[triangle[2]]!;
      const ux: number = b[0] - a[0],
        uy: number = b[1] - a[1],
        uz: number = b[2] - a[2],
        vx: number = c[0] - a[0],
        vy: number = c[1] - a[1],
        vz: number = c[2] - a[2];
      const area: number =
        Math.hypot(uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx) / 2;
      if (!(area > 0 && Number.isFinite(area)))
        fail("a triangle area is collapsed or unrepresentable");
      areaMm2 += area;
      if (!Number.isFinite(areaMm2))
        fail("total triangle area is unrepresentable");
      for (let k: number = 0; k < 3; k++) {
        const from: number = triangle[k]!,
          to: number = triangle[(k + 1) % 3]!,
          opposite: number = triangle[(k + 2) % 3]!;
        incident[from]!.push(face);
        const key: string = edgeKey(from, to),
          rows: { a: number; b: number; face: number }[] = edges.get(key) ?? [];
        rows.push({ a: from, b: to, face });
        edges.set(key, rows);
        const p: C.Vector = vertices[from]!,
          q: C.Vector = vertices[to]!,
          length: number = Math.hypot(q[0] - p[0], q[1] - p[1], q[2] - p[2]);
        if (!(length > 0 && Number.isFinite(length)))
          fail("an edge length is collapsed or unrepresentable");
        adjacency[from]!.set(to, length);
        adjacency[to]!.set(from, length);
        for (const [x, y] of [
          [to, opposite],
          [opposite, to],
        ]) {
          const neighbors: Set<number> = links[from]!.get(x!) ?? new Set();
          neighbors.add(y!);
          links[from]!.set(x!, neighbors);
        }
      }
    },
  );
  if (incident.some((rows: number[]): boolean => !rows.length))
    fail("unused vertices do not belong to the surface");
  const successor: Map<number, number> = new Map(),
    predecessor: Set<number> = new Set();
  for (const rows of edges.values()) {
    if (rows.length === 1) {
      const row: { a: number; b: number; face: number } = rows[0]!;
      if (successor.has(row.a) || predecessor.has(row.b))
        fail("a boundary vertex has multiple incident boundary arcs");
      successor.set(row.a, row.b);
      predecessor.add(row.b);
    } else if (
      rows.length !== 2 ||
      rows[0]!.a !== rows[1]!.b ||
      rows[0]!.b !== rows[1]!.a
    )
      fail("edge incidence is nonmanifold or winding is incoherent");
    else {
      faceAdjacent[rows[0]!.face]!.push(rows[1]!.face);
      faceAdjacent[rows[1]!.face]!.push(rows[0]!.face);
    }
  }
  const reached: Set<number> = new Set([0]),
    queue: number[] = [0];
  for (let i: number = 0; i < queue.length; i++)
    for (const next of faceAdjacent[queue[i]!]!)
      if (!reached.has(next)) {
        reached.add(next);
        queue.push(next);
      }
  if (reached.size !== triangles.length)
    fail("faces are not one edge-connected surface");
  for (let id: number = 0; id < vertices.length; id++) {
    const link: Map<number, Set<number>> = links[id]!,
      first: number = link.keys().next().value!,
      visited: Set<number> = new Set([first]),
      walk: number[] = [first];
    for (let i: number = 0; i < walk.length; i++)
      for (const next of link.get(walk[i]!)!)
        if (!visited.has(next)) {
          visited.add(next);
          walk.push(next);
        }
    const ends: number = [...link.values()].filter(
      (neighbors: Set<number>): boolean => neighbors.size === 1,
    ).length;
    if (
      visited.size !== link.size ||
      [...link.values()].some(
        (neighbors: Set<number>): boolean =>
          neighbors.size < 1 || neighbors.size > 2,
      ) ||
      (successor.has(id)
        ? ends !== 2 || !predecessor.has(id)
        : ends !== 0 || predecessor.has(id))
    )
      fail("a vertex link is not one boundary path or interior circle");
  }
  const cycles: number[][] = [],
    visited: Set<number> = new Set();
  for (const first of successor.keys()) {
    if (visited.has(first)) continue;
    const cycle: number[] = [];
    let current: number = first;
    do {
      if (visited.has(current) || !successor.has(current))
        fail("boundary traversal is not a disjoint complete cycle");
      visited.add(current);
      cycle.push(current);
      current = successor.get(current)!;
    } while (current !== first);
    if (cycle.length < 3)
      fail("a boundary cycle needs at least three vertices");
    cycles.push(cycle);
  }
  return { edges, adjacency, incident, cycles, areaMm2 };
}
