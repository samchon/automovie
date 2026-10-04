import { IAutoMovieMesh } from "@automovie/interface";

import { createMeshEdgeKey } from "../math/createMeshEdgeKey";
import { resolveAutoMovieMeshPhysicalVertices } from "../math/resolveAutoMovieMeshPhysicalVertices";
import { weldMeshVertices } from "../math/weldMeshVertices";
import { ViolationCollector } from "./ViolationCollector";

/**
 * Append mesh-topology violations to a collector, the shared body behind the
 * standalone {@link validateMeshTopology} and `validateModel`'s mesh check.
 * Physical correspondence assigns declared source identities and current
 * position identities for legacy vertices; edge-key preparation then
 * chooses exact numeric pairs when possible and delimited pairs otherwise.
 * Omitted correspondence keeps legacy traversal and diagnostic labels exactly.
 * Compact identities impose no population ceiling beyond valid array buffers.
 *
 * @evidence requirements/asset-authoring/validation.md#asset-geometry-validation `appendMeshTopology` appends welded-edge topology faults at the caller's exact mesh-part path.
 * @evidence specifications/asset-and-representation/fidelity-and-validation.md#asset-spec-validation-numeric-structure `appendMeshTopology` shares one incidence-and-winding calculation between model validation and the public standalone result.
 */
export const appendMeshTopology = (
  mesh: IAutoMovieMesh,
  path: string,
  collector: ViolationCollector,
  expectClosed: boolean,
): void => {
  let physical: ReturnType<typeof resolveAutoMovieMeshPhysicalVertices> | undefined;
  if (mesh.physicalVertices !== undefined) {
    try {
      physical = resolveAutoMovieMeshPhysicalVertices(mesh);
    } catch (error) {
      collector.push(
        "topology", `${path}.physicalVertices`,
        String(error),
        mesh.physicalVertices,
      );
      return;
    }
  }
  const vertexCount = mesh.positions.length / 3;
  if (vertexCount === 0 || !Number.isInteger(vertexCount)) return;
  const indices =
    mesh.indices ?? Array.from({ length: vertexCount }, (_, i) => i);
  if (indices.length % 3 !== 0) return;
  if (
    indices.some(
      (index) => !Number.isInteger(index) || index < 0 || index >= vertexCount,
    )
  )
    return;

  // Coordinate collapse is independent of physical edge incidence.
  // Legacy coordinates determine welding on every evaluation. Explicit aliases
  // have already agreed on that grid, while separate contact points stay apart.
  // Coordinate-collapsed triangles remain redundant independently of identity.
  const coordinate = weldMeshVertices(mesh.positions);
  const { labels, vertices } = physical ?? coordinate;
  type Direction = { from: number; to: number; count: number };
  type Edge = {
    low: number;
    high: number;
    count: number;
    forward?: Direction;
    reverse?: Direction;
  };
  const edgeKey = createMeshEdgeKey(labels.length);
  const undirected = new Map<number | string, Edge>();
  const directed: Direction[] = [];
  for (let i = 0; i < indices.length; i += 3) {
    const ga = coordinate.vertices[indices[i]!]!,
      gb = coordinate.vertices[indices[i + 1]!]!,
      gc = coordinate.vertices[indices[i + 2]!]!;
    if (ga === gb || gb === gc || gc === ga)
      continue;
    const a = vertices[indices[i]!]!;
    const b = vertices[indices[i + 1]!]!;
    const c = vertices[indices[i + 2]!]!;
    const corners = [a, b, c];
    for (let e = 0; e < 3; ++e) {
      const from = corners[e]!;
      const to = corners[(e + 1) % 3]!;
      const low = Math.min(from, to),
        high = Math.max(from, to);
      // Coordinate strings are reconstructed only for violations.
      const key = edgeKey(low, high);
      let edge = undirected.get(key);
      if (edge === undefined) {
        edge = { low, high, count: 0 };
        undirected.set(key, edge);
      }
      edge.count++;
      const side = from === low ? "forward" : "reverse";
      let direction = edge[side];
      if (direction === undefined) {
        direction = { from, to, count: 0 };
        edge[side] = direction;
        directed.push(direction);
      }
      direction.count++;
    }
  }

  const label = (edge: Edge): string => {
    const a = labels[edge.low]!,
      b = labels[edge.high]!;
    return a < b ? `${a}|${b}` : `${b}|${a}`;
  };
  for (const edge of undirected.values()) {
    const count = edge.count;
    if (count > 2)
      collector.push(
        "topology",
        `${path}.indices`,
        `a 2-manifold mesh edge is shared by at most 2 triangles, but the edge (${label(edge)}) is shared by ${count}`,
        count,
      );
  }

  for (const edge of directed) {
    const count = edge.count;
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
