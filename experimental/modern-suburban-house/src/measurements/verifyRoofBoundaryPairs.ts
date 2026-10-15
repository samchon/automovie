import type { IHousePart } from "../types/IHousePart";
import { dot } from "./dot";
import { edgeKey } from "./edgeKey";
import { IPoint } from "./IPoint";
import { length } from "./length";
import { point } from "./point";
import { sub } from "./sub";

interface IBoundaryEdge {
  owner: string;
  a: IPoint;
  b: IPoint;
}
const roofBoundaryEdges = (parts: readonly Pick<IHousePart, "id" | "mesh">[]): IBoundaryEdge[] => {
  const result: IBoundaryEdge[] = [];
  for (const part of parts) {
    const { mesh } = part;
    if (mesh.indices === null) throw new Error(
      `${part.id}: roof has no triangle indices`
    );
    const edges = new Map<string, { count: number; a: IPoint; b: IPoint; }>();
    for (let i = 0; i < mesh.indices.length; i += 3) {
      const triangle = [
        mesh.indices[i]!,
        mesh.indices[i + 1]!,
        mesh.indices[i + 2]!,
      ];
      for (let j = 0; j < 3; j++) {
        const a = point(mesh, triangle[j]!);
        const b = point(mesh, triangle[(j + 1) % 3]!);
        const key = edgeKey(a, b);
        const old = edges.get(key);
        if (old) old.count++;
        else edges.set(key, { count: 1, a, b });
      }
    }
    for (const edge of edges.values()) {
      if (edge.count > 2) throw new Error(`${part.id}: non-manifold roof edge`);
      if (edge.count === 1) result.push({
        owner: part.id,
        a: edge.a,
        b: edge.b,
      });
    }
  }
  return result;
};
/** Refuse every exposed roof edge that has no coincident tile or neighbouring roof plane. */

export const verifyRoofBoundaryPairs = (parts: readonly Pick<IHousePart, "id" | "mesh">[]): void => {
  const edges = roofBoundaryEdges(parts);
  const unpaired: string[] = [];
  for (const edge of edges) {
    const d = sub(edge.b, edge.a);
    const size = dot(d, d);
    const intervals: [number, number][] = [];
    for (const other of edges) {
      if (other === edge) continue;
      const v = sub(other.a, edge.a);
      const w = sub(other.b, edge.a);
      const t0 = dot(v, d) / size;
      const t1 = dot(w, d) / size;
      const off0 = sub(v, { x: d.x * t0, y: d.y * t0, z: d.z * t0 });
      const off1 = sub(w, { x: d.x * t1, y: d.y * t1, z: d.z * t1 });
      if (length(off0) > 1e-5 || length(off1) > 1e-5) continue;
      const start = Math.max(0, Math.min(t0, t1));
      const end = Math.min(1, Math.max(t0, t1));
      if (end - start > 1e-7) intervals.push([start, end]);
    }
    intervals.sort((a, b) => a[0] - b[0]);
    let covered = 0;
    for (const [start, end] of intervals) {
      if (start > covered + 1e-5) break;
      covered = Math.max(covered, end);
    }
    if (covered < 1 - 1e-5) unpaired.push(
      `${edge.owner}: ${JSON.stringify(edge.a)} to ${JSON.stringify(edge.b)}`
    );
  }
  if (unpaired.length) throw new Error(
    `unpaired roof boundaries (${unpaired.length}):\n${unpaired.join("\n")}`
  );
};
