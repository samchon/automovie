import {
  IAutoMovieMesh,
  type IAutoMovieResolvedPhysicalVertices,
  type IAutoMovieViolationCollector,
} from "@automovie/interface";

import { createMeshEdgeKey } from "../../math/internal/createMeshEdgeKey";
import { resolveAutoMovieMeshPhysicalVertices } from "../../math/internal/resolveAutoMovieMeshPhysicalVertices";
import { weldMeshVertices } from "../../math/internal/weldMeshVertices";

/*
 * Append shared welded edge-incidence, winding and optional boundary findings.
 */
export function appendMeshTopology(
  mesh: IAutoMovieMesh,
  path: string,
  collector: IAutoMovieViolationCollector,
  expectClosed: boolean,
): void {
  let physical: IAutoMovieResolvedPhysicalVertices | undefined;
  if (mesh.physicalVertices !== undefined) {
    try {
      physical = resolveAutoMovieMeshPhysicalVertices(mesh);
    } catch (error: unknown) {
      collector.push(
        "topology",
        `${path}.physicalVertices`,
        String(error),
        mesh.physicalVertices,
      );
      return;
    }
  }
  const vertexCount: number = mesh.positions.length / 3;
  if (vertexCount === 0) return;
  const indices: number[] =
    mesh.indices ??
    Array.from({ length: vertexCount }, (_: unknown, i: number): number => i);
  if (indices.length % 3 !== 0) return;
  for (const index of indices) if (index < 0 || index >= vertexCount) return;

  // Coordinate collapse is independent of physical edge incidence.
  // Legacy coordinates determine welding on every evaluation. Explicit aliases
  // have already agreed on that grid, while separate contact points stay apart.
  // Coordinate-collapsed triangles remain redundant independently of identity.
  const coordinate: { labels: string[]; vertices: number[] } = weldMeshVertices(
    mesh.positions,
  );
  const { labels, vertices }: { labels: string[]; vertices: number[] } =
    physical ?? coordinate;
  interface Direction {
    from: number;
    to: number;
    count: number;
  }
  interface Edge {
    low: number;
    high: number;
    count: number;
    forward?: Direction;
    reverse?: Direction;
  }
  const edgeKey: (from: number, to: number) => string | number =
    createMeshEdgeKey(labels.length);
  const undirected: Map<string | number, Edge> = new Map<
    number | string,
    Edge
  >();
  const directed: Direction[] = [];
  for (let i: number = 0; i < indices.length; i += 3) {
    const ga: number = coordinate.vertices[indices[i]!]!,
      gb: number = coordinate.vertices[indices[i + 1]!]!,
      gc: number = coordinate.vertices[indices[i + 2]!]!;
    if (ga === gb || gb === gc || gc === ga) continue;
    const a: number = vertices[indices[i]!]!;
    const b: number = vertices[indices[i + 1]!]!;
    const c: number = vertices[indices[i + 2]!]!;
    const corners: number[] = [a, b, c];
    for (let e: number = 0; e < 3; ++e) {
      const from: number = corners[e]!;
      const to: number = corners[(e + 1) % 3]!;
      const low: number = Math.min(from, to),
        high: number = Math.max(from, to);
      // Coordinate strings are reconstructed only for violations.
      const key: string | number = edgeKey(low, high);
      let edge: Edge | undefined = undirected.get(key);
      if (edge === undefined) {
        edge = { low, high, count: 0 };
        undirected.set(key, edge);
      }
      edge.count++;
      const side: "forward" | "reverse" = from === low ? "forward" : "reverse";
      let direction: Direction | undefined = edge[side];
      if (direction === undefined) {
        direction = { from, to, count: 0 };
        edge[side] = direction;
        directed.push(direction);
      }
      direction.count++;
    }
  }

  const label: (edge: Edge) => string = (edge: Edge): string => {
    const a: string = labels[edge.low]!,
      b: string = labels[edge.high]!;
    return a < b ? `${a}|${b}` : `${b}|${a}`;
  };
  for (const edge of undirected.values()) {
    const count: number = edge.count;
    if (count > 2)
      collector.push(
        "topology",
        `${path}.indices`,
        `a 2-manifold mesh edge is shared by at most 2 triangles, but the edge (${label(edge)}) is shared by ${count}`,
        count,
      );
  }

  for (const edge of directed) {
    const count: number = edge.count;
    if (count > 1)
      collector.push(
        "topology",
        `${path}.indices`,
        `triangles adjacent on an edge must wind in opposite directions, but the directed edge (${labels[edge.from]}|${labels[edge.to]}) appears ${count} times (a flipped triangle)`,
        count,
      );
  }

  if (expectClosed)
    for (const edge of undirected.values())
      if (edge.count === 1)
        collector.push(
          "topology",
          `${path}.indices`,
          `a closed mesh has every edge shared by 2 triangles, but the edge (${label(edge)}) is a boundary (open) edge`,
          label(edge),
        );
}
