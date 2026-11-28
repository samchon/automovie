import type {
  AutoMovieVector3Tuple,
  IAutoMovieRecoveryDirectedEdgeIncidence,
  IAutoMovieRecoveryObservedMeshTopology,
} from "@automovie/interface";

import type { measureRecoveryChartFace } from "../../geometry/internal/measureRecoveryChartFace";
import { prepareRecoveryChartIncidence } from "../../geometry/internal/prepareRecoveryChartIncidence";

/*
 * Create the feature-cut topology observer with its original failure and
 * edge-key policy.
 */
export function RecoveryFeatureChartCutsTopology(
  fail: (reason: string) => never,
  edge: (a: number, b: number) => string,
): (
  vertices: readonly Readonly<AutoMovieVector3Tuple>[],
  triangles: readonly (readonly [number, number, number])[],
) => IAutoMovieRecoveryObservedMeshTopology {
  const analyze: (
    vertices: readonly Readonly<AutoMovieVector3Tuple>[],
    triangles: readonly (readonly [number, number, number])[],
  ) => IAutoMovieRecoveryObservedMeshTopology = (
    vertices: readonly Readonly<AutoMovieVector3Tuple>[],
    triangles: readonly (readonly [number, number, number])[],
  ): IAutoMovieRecoveryObservedMeshTopology => {
    const incident: number[][] = Array.from(vertices, (): number[] => []),
      vertexEdges: string[][] = Array.from(vertices, (): string[] => []);
    const adjacent: number[][] = Array.from(triangles, (): number[] => []);
    const areas: number[] = [],
      normals: Readonly<AutoMovieVector3Tuple>[] = [];
    const { edges, links }: ReturnType<typeof prepareRecoveryChartIncidence> =
      prepareRecoveryChartIncidence({
        vertices,
        triangles,
        edgeKey: edge,
        fail,
        invalidArea: "a triangle area or normal is unrepresentable",
        duplicate: "duplicate triangles are unsupported",
        onFace: (
          face: number,
          triangle: readonly [number, number, number],
          {
            normal,
            length,
            areaMm2,
          }: ReturnType<typeof measureRecoveryChartFace>,
        ): void => {
          areas.push(areaMm2);
          normals.push([
            normal[0] / length,
            normal[1] / length,
            normal[2] / length,
          ]);
          for (const vertex of triangle) incident[vertex]!.push(face);
        },
      });
    if (incident.some((rows: number[]): boolean => !rows.length))
      fail("unused vertices do not belong to a chart");
    const next: Map<number, number> = new Map(),
      incoming: Set<number> = new Set();
    for (const [key, rows] of edges) {
      const row: IAutoMovieRecoveryDirectedEdgeIncidence = rows[0]!;
      vertexEdges[row.a]!.push(key);
      vertexEdges[row.b]!.push(key);
      const p: Readonly<AutoMovieVector3Tuple> = vertices[row.a]!,
        q: Readonly<AutoMovieVector3Tuple> = vertices[row.b]!,
        length: number = Math.hypot(q[0] - p[0], q[1] - p[1], q[2] - p[2]);
      if (!(length > 0) || length === Infinity)
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
