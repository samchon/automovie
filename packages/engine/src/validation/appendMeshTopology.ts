import { IAutoMovieMesh } from "@automovie/interface";

import { createMeshEdgeKey } from "../math/createMeshEdgeKey";
import { resolveAutoMovieMeshPhysicalVertices } from "../math/resolveAutoMovieMeshPhysicalVertices";
import { weldMeshVertices } from "../math/weldMeshVertices";
import { ViolationCollector } from "./ViolationCollector";

/**
 * Append shared welded edge-incidence, winding and optional boundary findings.
 *
 * @evidence contracts/common.md#principled-implementation Explicit physical correspondence resolves first and reports named failures; dense finite legacy positions and valid whole-triangle indices then feed canonical coordinate welding and exact/delimited edge keys. Coordinate-collapsed triangles are omitted independently of physical identity.
 * @evidence contracts/common.md#clear-and-simple-design Standalone topology and model validation use one edge walk, keeping optional closure distinct from the mandatory incidence/winding rules.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts With actual array containers, malformed cardinality or scalar/reference elements yield no topology verdict because model admission reports them; missing position/index slots cannot escape through welding or become invented edges. Container shape is a typed caller premise, and this does not prove triangle area or absence of intersections.
 * @evidence contracts/common.md#meaningful-documentation Documents local borrowed buffers, correspondence-first refusal, structural skip, deterministic finding order and expectClosed behavior.
 * @evidence contracts/performance.md#efficient-algorithms For V vertices and T faces, welding and edge population construction take expected O(V+T), followed by O(T) incidence/direction/boundary scans, with O(V+T) maps/rows; diagnostic label work follows emitted findings.
 * @evidence contracts/performance.md#reuse-equivalent-work One resolved coordinate weld and physical partition serve every face, while shared edge keys and edge rows accumulate incidence without rebuilding strings on successful edges.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The supplied collector retains only findings, and call-local weld/maps/directions are discarded; mesh buffers are borrowed without mutation and no native mesh resource is acquired.
 * @author Samchon
 */
export const appendMeshTopology: (
  mesh: IAutoMovieMesh,
  path: string,
  collector: ViolationCollector,
  expectClosed: boolean,
) => void = (
  mesh: IAutoMovieMesh,
  path: string,
  collector: ViolationCollector,
  expectClosed: boolean,
): void => {
  let physical:
    | ReturnType<typeof resolveAutoMovieMeshPhysicalVertices>
    | undefined;
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
  if (vertexCount === 0 || !Number.isInteger(vertexCount)) return;
  for (const value of mesh.positions) if (!Number.isFinite(value)) return;
  const indices: number[] =
    mesh.indices ??
    Array.from({ length: vertexCount }, (_: unknown, i: number): number => i);
  if (indices.length % 3 !== 0) return;
  for (const index of indices)
    if (!Number.isInteger(index) || index < 0 || index >= vertexCount) return;

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
};
