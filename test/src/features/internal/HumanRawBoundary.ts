import { HumanRawGeometry as G } from "./HumanRawGeometry";

/** Original geometric edge incidence, independent of production joins and vertex ownership. */
export namespace HumanRawBoundary {
  /** One open geometric edge with its original face address. */
  export interface Edge {
    /** First world-space endpoint, in mm. */
    a: G.Point;
    /** Second world-space endpoint, in mm. */
    b: G.Point;
    /** Original face carrying this edge. */
    triangle: number;
  }
  /** Edge-incidence findings retain every nonmanifold or equally oriented shared edge. */
  export interface Result {
    /** Boundary edges after welding exactly coincident positions only. */
    edges: Edge[];
    /** Nonmanifold geometry or conflicting shared-face winding. */
    invalid: { edge: Edge; reason: string }[];
  }
  /** Gather geometric incidences without relying on production index connectivity. */
  export function read(mesh: G.Mesh): Result {
    const vertices: Map<string, number> = new Map(); const keys: number[] = [];
    for (let index: number = 0; index < mesh.positions.length / 3; index++) {
      const point: G.Point = G.vertex(mesh, index); const key: string = JSON.stringify(point);
      if (!vertices.has(key)) vertices.set(key, vertices.size);
      keys.push(vertices.get(key)!);
    }
    const table: Map<string, { edge: Edge; directions: number[] }> = new Map();
    for (let face: number = 0; face < mesh.indices.length / 3; face++) for (let side: number = 0; side < 3; side++) {
      const a: number = mesh.indices[face * 3 + side]!; const b: number = mesh.indices[face * 3 + (side + 1) % 3]!;
      const first: number = keys[a]!; const second: number = keys[b]!;
      const key: string = `${Math.min(first, second)}:${Math.max(first, second)}`;
      const value: { edge: Edge; directions: number[] } = table.get(key) ?? { edge: { a: G.vertex(mesh, a), b: G.vertex(mesh, b), triangle: face }, directions: [] };
      value.directions.push(first < second ? 1 : -1); table.set(key, value);
    }
    const result: Result = { edges: [], invalid: [] };
    for (const value of table.values()) {
      if (value.directions.length === 1) result.edges.push(value.edge);
      if (value.directions.length > 2) result.invalid.push({ edge: value.edge, reason: `${value.directions.length} faces share one geometric edge` });
      if (value.directions.length === 2 && value.directions[0] === value.directions[1]) result.invalid.push({ edge: value.edge, reason: "Adjacent faces traverse their shared edge in the same direction" });
    }
    return result;
  }
  /** Exact point-to-segment distance, returning Infinity for an absent target boundary. */
  export function distance(point: G.Point, edges: readonly Edge[]): number {
    let best: number = Infinity;
    for (const edge of edges) {
      const delta: G.Point = G.sub(edge.b, edge.a); const squared: number = G.dot(delta, delta);
      const phase: number = Math.max(0, Math.min(1, G.dot(G.sub(point, edge.a), delta) / squared));
      const nearest: G.Point = [edge.a[0] + phase * delta[0], edge.a[1] + phase * delta[1], edge.a[2] + phase * delta[2]];
      best = Math.min(best, Math.hypot(...G.sub(point, nearest)));
    }
    return best;
  }
}
