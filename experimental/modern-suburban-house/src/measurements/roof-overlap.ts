/**
 * A reproducible 1 cm probe of the roof solids emitted by `buildHouse`.
 *
 * This is an inspection producer, not a second roof model. It intersects
 * vertical lines with the actual triangles passed to the viewer, then compares
 * their occupied height intervals. A clear scan means no sampled cell had
 * positive overlap; it cannot rule out a feature narrower than the grid.
 */
import { inspectAutoMovieMeshTopology } from "@automovie/engine";
import type { IAutoMovieMesh } from "@automovie/interface";

import { buildHouse } from "../spaces/house";
import { SPLIT_X } from "../spaces/roof/junctions";
import { block, type IHousePart } from "../spaces/solids";

interface IPoint {
  x: number;
  y: number;
  z: number;
}

interface ITriangle {
  a: IPoint;
  b: IPoint;
  c: IPoint;
  x: readonly [number, number];
  z: readonly [number, number];
}

interface ISolid {
  id: string;
  triangles: ITriangle[];
  x: readonly [number, number];
  y: readonly [number, number];
  z: readonly [number, number];
}

export interface IRoofOverlap {
  first: string;
  second: string;
  sampledCells: number;
  maximumDepth: number;
  at: { x: number; z: number };
}

export interface IRoofOverlapScan {
  step: number;
  pairsChecked: number;
  samplesChecked: number;
  overlaps: IRoofOverlap[];
}

const point = (mesh: IAutoMovieMesh, index: number): IPoint => ({
  x: mesh.positions[3 * index]!,
  y: mesh.positions[3 * index + 1]!,
  z: mesh.positions[3 * index + 2]!,
});

const solid = (id: string, mesh: IAutoMovieMesh): ISolid => {
  if (mesh.indices === null) throw new Error(
    `${id}: mesh has no triangle indices`,
  );
  const topology = inspectAutoMovieMeshTopology(mesh);
  if (topology.nonManifoldEdges > 0 || topology.degenerate > 0 || topology.nonFinite > 0)
    throw new Error(
      `${id}: vertical occupancy needs a nondegenerate roof mesh`,
    );
  const triangles: ITriangle[] = [];
  const x: [number, number] = [Infinity, -Infinity];
  const y: [number, number] = [Infinity, -Infinity];
  const z: [number, number] = [Infinity, -Infinity];
  for (let i = 0; i < mesh.positions.length; i += 3) {
    const axes: [number, [number, number]][] = [
      [mesh.positions[i]!, x],
      [mesh.positions[i + 1]!, y],
      [mesh.positions[i + 2]!, z],
    ];
    for (const [value, range] of axes) {
      range[0] = Math.min(range[0], value);
      range[1] = Math.max(range[1], value);
    }
  }
  for (let i = 0; i < mesh.indices.length; i += 3) {
    const a = point(mesh, mesh.indices[i]!);
    const b = point(mesh, mesh.indices[i + 1]!);
    const c = point(mesh, mesh.indices[i + 2]!);
    triangles.push({
      a,
      b,
      c,
      x: [Math.min(a.x, b.x, c.x), Math.max(a.x, b.x, c.x)],
      z: [Math.min(a.z, b.z, c.z), Math.max(a.z, b.z, c.z)],
    });
  }
  return { id, triangles, x, y, z };
};

interface IBoundaryEdge {
  owner: string;
  a: IPoint;
  b: IPoint;
}

const edgeKey = (a: IPoint, b: IPoint): string => {
  const key = (p: IPoint): string => [p.x, p.y, p.z].map((n) => Math.round(n * 1e6)).join(",");
  return [key(a), key(b)].sort((x, y) => x.localeCompare(y)).join("|");
};

const roofBoundaryEdges = (parts: readonly Pick<IHousePart, "id" | "mesh">[]): IBoundaryEdge[] => {
  const result: IBoundaryEdge[] = [];
  for (const part of parts) {
    const { mesh } = part;
    if (mesh.indices === null) throw new Error(`${part.id}: roof has no triangle indices`);
    const edges = new Map<string, { count: number; a: IPoint; b: IPoint }>();
    for (let i = 0; i < mesh.indices.length; i += 3) {
      const triangle = [mesh.indices[i]!, mesh.indices[i + 1]!, mesh.indices[i + 2]!];
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
      if (edge.count === 1) result.push({ owner: part.id, a: edge.a, b: edge.b });
    }
  }
  return result;
};

const dot = (a: IPoint, b: IPoint): number => a.x * b.x + a.y * b.y + a.z * b.z;
const sub = (a: IPoint, b: IPoint): IPoint => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });
const length = (p: IPoint): number => Math.hypot(p.x, p.y, p.z);

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
      `${edge.owner}: ${JSON.stringify(edge.a)} to ${JSON.stringify(edge.b)}`,
    );
  }
  if (unpaired.length) throw new Error(`unpaired roof boundaries (${unpaired.length}):\n${unpaired.join("\n")}`);
};

/** Return the height between upper and lower roof faces under a vertical probe. */
const occupied = (shape: ISolid, x: number, z: number): readonly [number, number] | null => {
  let low = Infinity;
  let high = -Infinity;
  for (const face of shape.triangles) {
    if (x < face.x[0] || x > face.x[1] || z < face.z[0] || z > face.z[1]) continue;
    const { a, b, c } = face;
    const denominator = (b.z - c.z) * (a.x - c.x) + (c.x - b.x) * (a.z - c.z);
    if (Math.abs(denominator) < 1e-12) continue;
    const u = ((b.z - c.z) * (x - c.x) + (c.x - b.x) * (z - c.z)) / denominator;
    const v = ((c.z - a.z) * (x - c.x) + (a.x - c.x) * (z - c.z)) / denominator;
    const w = 1 - u - v;
    if (u < -1e-9 || v < -1e-9 || w < -1e-9) continue;
    const height = u * a.y + v * b.y + w * c.y;
    low = Math.min(low, height);
    high = Math.max(high, height);
  }
  return high - low > 1e-6 ? [low, high] : null;
};

const overlapAt = (a: ISolid, b: ISolid, x: number, z: number): number => {
  const ay = occupied(a, x, z);
  if (ay === null) return 0;
  const by = occupied(b, x, z);
  return by === null
    ? 0
    : Math.max(0, Math.min(ay[1], by[1]) - Math.max(ay[0], by[0]));
};

/** Inspect each unordered pair on a cell-centred metric grid. */
export const scanRoofOverlaps = (
  parts: readonly Pick<IHousePart, "id" | "mesh" | "openSharedEdges">[],
  step = 0.01,
): IRoofOverlapScan => {
  if (!(Number.isFinite(step) && step > 0)) throw new Error(
    "roof scan step must be positive and finite",
  );
  verifyRoofBoundaryPairs(parts);
  const shapes = parts.map((part) => solid(part.id, part.mesh));
  const overlaps: IRoofOverlap[] = [];
  let pairsChecked = 0;
  let samplesChecked = 0;
  for (let i = 0; i < shapes.length; i++) {
    const a = shapes[i]!;
    for (let j = i + 1; j < shapes.length; j++) {
      const b = shapes[j]!;
      const x0 = Math.max(a.x[0], b.x[0]);
      const x1 = Math.min(a.x[1], b.x[1]);
      const z0 = Math.max(a.z[0], b.z[0]);
      const z1 = Math.min(a.z[1], b.z[1]);
      if (x1 <= x0 || z1 <= z0 || Math.min(a.y[1], b.y[1]) <= Math.max(a.y[0], b.y[0])) continue;
      pairsChecked++;
      let sampledCells = 0;
      let maximumDepth = 0;
      let at = { x: 0, z: 0 };
      for (let x = x0 + step / 2; x < x1; x += step) {
        for (let z = z0 + step / 2; z < z1; z += step) {
          samplesChecked++;
          let depth = overlapAt(a, b, x, z);
          if (depth <= 1e-5) continue;
          // Two separate solids can share an entire vertical face along a
          // valley. A line through that face intersects both solids but has
          // zero-area contact. Require a positive neighbouring probe inside
          // the cell before calling it a volumetric overlap.
          const offset = step / 4;
          depth = Math.max(
            overlapAt(a, b, x - offset, z - offset),
            overlapAt(a, b, x - offset, z + offset),
            overlapAt(a, b, x + offset, z - offset),
            overlapAt(a, b, x + offset, z + offset),
          );
          if (depth <= 1e-5) continue;
          sampledCells++;
          if (depth > maximumDepth) {
            maximumDepth = depth;
            at = { x, z };
          }
        }
      }
      if (sampledCells > 0) overlaps.push({
        first: a.id,
        second: b.id,
        sampledCells,
        maximumDepth,
        at,
      });
    }
  }
  overlaps.sort((a, b) => b.maximumDepth - a.maximumDepth);
  return { step, pairsChecked, samplesChecked, overlaps };
};

/** The exact roof meshes shown by the current house viewer. */
export const auditHouseRoofOverlaps = (): IRoofOverlapScan => {
  verifyRoofOverlapScanner();
  const house = buildHouse();
  return scanRoofOverlaps(house.parts.filter((part) => part.role === "roof"));
};

/** Pure fixtures run by every production roof audit, not an orphaned test file. */
export const verifyRoofOverlapScanner = (): void => {
  const a = { id: "a", mesh: block([0, 0, 0], [1, 1, 1]) };
  const overlap = {
    id: "overlap",
    mesh: block([0.5, 0.5, 0.5], [1.5, 1.5, 1.5]),
  };
  const touching = { id: "touching", mesh: block([1, 0, 0], [2, 1, 1]) };
  const separate = { id: "separate", mesh: block([1.01, 0, 0], [2.01, 1, 1]) };
  const thin = {
    id: "thin",
    mesh: block([0.5, 0.995, 0.5], [1.5, 1.005, 1.5]),
  };
  const found = scanRoofOverlaps([a, overlap], 0.1).overlaps;
  if (found.length !== 1 || Math.abs(found[0]!.maximumDepth - 0.5) > 1e-9)
    throw new Error(
      "roof overlap fixture: intersecting boxes were not measured at 0.5 m",
    );
  if (scanRoofOverlaps([a, touching], 0.1).overlaps.length !== 0)
    throw new Error(
      "roof overlap fixture: a shared face was counted as volume",
    );
  if (scanRoofOverlaps([a, separate], 0.1).overlaps.length !== 0)
    throw new Error(
      "roof overlap fixture: separate boxes were counted as touching",
    );
  if (scanRoofOverlaps([a, thin], 0.1).overlaps.length !== 1)
    throw new Error("roof overlap fixture: a 5 mm vertical overlap was missed");
  const open: IAutoMovieMesh = {
    ...a.mesh,
    indices: a.mesh.indices!.slice(0, -3),
  };
  const roof = buildHouse().parts.filter((part) => part.role === "roof");
  const withoutStepClosure = roof.map((part) => {
    if (part.id !== "roof-main-front" && part.id !== "roof-main-back") return part;
    const indices = part.mesh.indices!;
    const kept: number[] = [];
    for (let i = 0; i < indices.length; i += 3) {
      const vertices = [indices[i]!, indices[i + 1]!, indices[i + 2]!].map((index) => point(part.mesh, index));
      const stepFace = vertices.every((vertex) => Math.abs(vertex.x - SPLIT_X) < 1e-6) &&
        Math.max(...vertices.map((vertex) => vertex.y)) - Math.min(...vertices.map((vertex) => vertex.y)) > 1e-6;
      if (!stepFace) kept.push(...indices.slice(i, i + 3));
    }
    return { ...part, mesh: { ...part.mesh, indices: kept } };
  });
  let rejectedStepMutant = false;
  try {
    verifyRoofBoundaryPairs(withoutStepClosure);
  } catch (error) {
    if (!String(error).includes("unpaired roof boundaries")) throw error;
    rejectedStepMutant = true;
  }
  if (withoutStepClosure.every((part) => part.mesh.indices!.length === roof.find((old) => old.id === part.id)!.mesh.indices!.length))
    throw new Error("roof boundary fixture did not remove the roof step closure");
  if (!rejectedStepMutant) throw new Error("roof boundary fixture accepted the missing step closure");
  try {
    scanRoofOverlaps([{ id: "open", mesh: open }], 0.1);
  } catch (error) {
    if (String(error).includes("unpaired roof boundaries")) return;
    throw error;
  }
  throw new Error("roof overlap fixture: an open boundary was accepted");
};
