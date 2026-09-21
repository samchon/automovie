import { IAutoMovieMesh } from "@automovie/interface";

import { ViolationCollector } from "./ViolationCollector";

/** Weld tolerance: ring seams recompute cos/sin with ~1e-16 float error. */
const WELD_GRID = 1e9;

/**
 * Append mesh-topology violations to a collector, the shared body behind the
 * standalone {@link validateMeshTopology} and `validateModel`'s mesh check.
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

  // Quantize each source vertex once, then count edges by compact identities.
  // Coordinates still determine welding on every evaluation: deforming two
  // previously distinct vertices onto one grid point must change the verdict.
  const labels: string[] = [];
  const welded = new Map<string, number>();
  const vertices = new Array<number>(vertexCount);
  for (let vertex = 0; vertex < vertexCount; vertex++) {
    const offset = vertex * 3;
    const x = Math.round(mesh.positions[offset]! * WELD_GRID) || 0;
    const y = Math.round(mesh.positions[offset + 1]! * WELD_GRID) || 0;
    const z = Math.round(mesh.positions[offset + 2]! * WELD_GRID) || 0;
    const key = `${x},${y},${z}`;
    let id = welded.get(key);
    if (id === undefined) {
      id = labels.length;
      welded.set(key, id);
      labels.push(key);
    }
    vertices[vertex] = id;
  }
  type Direction = { from: number; to: number; count: number };
  type Edge = {
    low: number;
    high: number;
    count: number;
    forward?: Direction;
    reverse?: Direction;
  };
  const undirected = new Map<string, Edge>();
  const directed: Direction[] = [];
  for (let i = 0; i < indices.length; i += 3) {
    const a = vertices[indices[i]!]!;
    const b = vertices[indices[i + 1]!]!;
    const c = vertices[indices[i + 2]!]!;
    // A triangle with a repeated welded vertex (a pole ring, a collapsed cap)
    // carries no surface: skip it, exactly as the watertightness oracle does.
    if (a === b || b === c || c === a) continue;
    const corners = [a, b, c];
    for (let e = 0; e < 3; ++e) {
      const from = corners[e]!;
      const to = corners[(e + 1) % 3]!;
      const low = Math.min(from, to),
        high = Math.max(from, to);
      // A string of integer IDs avoids a numeric pair encoding's safe-integer
      // ceiling; coordinate strings are reconstructed only for violations.
      const key = `${low}/${high}`;
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
