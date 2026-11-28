import type {
  AutoMovieVector3Tuple,
  IAutoMovieRecoveryDirectedEdgeIncidence,
  IAutoMovieRecoveryMultiBoundarySurfaceAnalysisOperation,
} from "@automovie/interface";

import type { measureRecoveryChartFace } from "./measureRecoveryChartFace";
import { prepareRecoveryChartIncidence } from "./prepareRecoveryChartIncidence";

/*
 * Analyze coherent private surface incidence and complete boundary cycles.
 */
export function analyzeRecoveryMultiBoundarySurface(
  vertices: Parameters<IAutoMovieRecoveryMultiBoundarySurfaceAnalysisOperation.Operation>[0],
  triangles: Parameters<IAutoMovieRecoveryMultiBoundarySurfaceAnalysisOperation.Operation>[1],
  fail: Parameters<IAutoMovieRecoveryMultiBoundarySurfaceAnalysisOperation.Operation>[2],
  edgeKey: Parameters<IAutoMovieRecoveryMultiBoundarySurfaceAnalysisOperation.Operation>[3],
): ReturnType<IAutoMovieRecoveryMultiBoundarySurfaceAnalysisOperation.Operation> {
  const adjacency: Map<number, number>[] = Array.from(
    vertices,
    (): Map<number, number> => new Map(),
  );
  const incident: number[][] = Array.from(vertices, (): number[] => []),
    faceAdjacent: number[][] = Array.from(triangles, (): number[] => []);
  let areaMm2: number = 0;
  const { edges, links }: ReturnType<typeof prepareRecoveryChartIncidence> =
    prepareRecoveryChartIncidence({
      vertices,
      triangles,
      edgeKey,
      fail,
      invalidArea: "a triangle area is collapsed or unrepresentable",
      duplicate: "duplicate triangles are unsupported",
      onFace: (
        face: number,
        triangle: readonly [number, number, number],
        measured: ReturnType<typeof measureRecoveryChartFace>,
      ): void => {
        areaMm2 += measured.areaMm2;
        if (!Number.isFinite(areaMm2))
          fail("the surface area is unrepresentable");
        for (const vertex of triangle) incident[vertex]!.push(face);
      },
    });
  if (incident.some((rows: number[]): boolean => !rows.length))
    fail("unused vertices do not belong to the surface");
  const successor: Map<number, number> = new Map(),
    predecessor: Set<number> = new Set();
  for (const rows of edges.values()) {
    const row: IAutoMovieRecoveryDirectedEdgeIncidence = rows[0]!;
    const p: Readonly<AutoMovieVector3Tuple> = vertices[row.a]!,
      q: Readonly<AutoMovieVector3Tuple> = vertices[row.b]!,
      length: number = Math.hypot(q[0] - p[0], q[1] - p[1], q[2] - p[2]);
    if (!(length > 0) || !Number.isFinite(length))
      fail("an edge length is collapsed or unrepresentable");
    adjacency[row.a]!.set(row.b, length);
    adjacency[row.b]!.set(row.a, length);
    if (rows.length === 1) {
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
