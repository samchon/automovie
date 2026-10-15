import type { IAutoMovieMesh } from "@automovie/interface";
import { MeshAccount } from "./MeshAccount";
import { mergeAutoMovieMeshes, inspectAutoMovieMeshTopology, validateMeshTopology } from "@automovie/engine";

const weldScale = 1e9;
const onEdge = 1e-6;
interface Resolution {
  samples: MeshAccount["defectSamples"];
  weldedVertices: number;
  openEdges: number;
  nonManifold: number;
  tJunctionVertices: number;
  components: number;
}
/** Welding, T-junction resolution, directed pairing and connected components. */
const resolveTJunctions = (mesh: IAutoMovieMesh): Resolution => {
  const p = mesh.positions;
  const index = new Map<string, number>();
  const points: Array<[number, number, number]> = [];
  const remap: number[] = [];
  for (let i = 0; i < p.length; i += 3) {
    const key = `${Math.round(p[i]! * weldScale)},${Math.round(p[i + 1]! * weldScale)},${Math.round(p[i + 2]! * weldScale)}`;
    let id = index.get(key);
    if (id === undefined) {
      id = points.length;
      index.set(key, id);
      points.push([p[i]!, p[i + 1]!, p[i + 2]!]);
    }
    remap.push(id);
  }
  const indices = mesh.indices ?? Array.from({ length: p.length / 3 }, (_, i) => i);
  const parent = points.map((_, i) => i);
  const find = (i: number): number => {
    while (parent[i] !== i) {
      parent[i] = parent[parent[i]!]!;
      i = parent[i]!;
    }
    return i;
  };
  const union = (a: number, b: number) => { parent[find(a)] = find(b); };
  const directed: Array<[number, number]> = [];
  for (let t = 0; t + 2 < indices.length; t += 3) {
    const [a, b, c] = [remap[indices[t]!]!, remap[indices[t + 1]!]!, remap[indices[t + 2]!]!];
    if (a === b || b === c || c === a) continue;
    directed.push([a, b], [b, c], [c, a]);
    union(a, b);
    union(b, c);
  }
  const splits = new Map<string, number[]>();
  const tVertices = new Set<number>();
  const interior = (a: number, b: number): number[] => {
    const key = a < b ? `${a},${b}` : `${b},${a}`;
    const cached = splits.get(key);
    if (cached !== undefined) return a < b ? cached : [...cached].reverse();
    const [lo, hi] = a < b ? [a, b] : [b, a];
    const A = points[lo]!;
    const B = points[hi]!;
    const d = [B[0] - A[0], B[1] - A[1], B[2] - A[2]];
    const length2 = d[0]! ** 2 + d[1]! ** 2 + d[2]! ** 2;
    const found: Array<[number, number]> = [];
    points.forEach((q, i) => {
      if (i === lo || i === hi) return;
      for (let k = 0; k < 3; ++k) {
        if (q[k]! < Math.min(A[k]!, B[k]!) - onEdge || q[k]! > Math.max(A[k]!, B[k]!) + onEdge) return;
      }
      const t = ((q[0] - A[0]) * d[0]! + (q[1] - A[1]) * d[1]! + (q[2] - A[2]) * d[2]!) / length2;
      if (t <= 0 || t >= 1) return;
      const distance = Math.hypot(A[0] + d[0]! * t - q[0], A[1] + d[1]! * t - q[1], A[2] + d[2]! * t - q[2]);
      if (distance < onEdge) found.push([t, i]);
    });
    const ordered = found.sort((x, y) => x[0] - y[0]).map(([, i]) => i);
    splits.set(key, ordered);
    for (const i of ordered) {
      tVertices.add(i);
      union(i, lo);
    }
    return a < b ? ordered : [...ordered].reverse();
  };
  const counts = new Map<string, number>();
  for (const [a, b] of directed) {
    const chain = [a, ...interior(a, b), b];
    for (let k = 0; k + 1 < chain.length; ++k) {
      const key = `${chain[k]},${chain[k + 1]}`;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }
  let openEdges = 0;
  let nonManifold = 0;
  const samples: MeshAccount["defectSamples"] = [];
  const sample = (kind: "open" | "non-manifold", a: number, b: number) => {
    if (samples.length >= 8) return;
    const [A, B] = [points[a]!, points[b]!];
    samples.push({ kind, at: [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2, (A[2] + B[2]) / 2] });
  };
  const seen = new Set<string>();
  for (const key of counts.keys()) {
    const [a, b] = key.split(",").map(Number) as [number, number];
    const undirected = a < b ? `${a},${b}` : `${b},${a}`;
    if (seen.has(undirected)) continue;
    seen.add(undirected);
    const forward = counts.get(`${a},${b}`) ?? 0;
    const backward = counts.get(`${b},${a}`) ?? 0;
    if (forward !== backward) {
      ++openEdges;
      sample("open", a, b);
    }
    if (forward + backward > 2) {
      ++nonManifold;
      sample("non-manifold", a, b);
    }
  }
  const used = new Set<number>();
  for (const [a] of directed) used.add(find(a));
  return { samples, weldedVertices: points.length, openEdges, nonManifold, tJunctionVertices: tVertices.size, components: used.size };
};
/** Measures several meshes, such as one model's parts, as one account without mutating input arrays. */

export const accountMeshes = (id: string, meshes: readonly IAutoMovieMesh[]): MeshAccount => {
  if (meshes.length === 0) throw new Error(`${id}: no meshes to account.`);
  const merged = mergeAutoMovieMeshes(meshes);
  const topology = inspectAutoMovieMeshTopology(merged);
  const validation = validateMeshTopology({ mesh: merged });
  const windingErrors = validation.success ? 0
    : validation.violations.filter((v) => /wind in opposite directions/.test(String(v.expected))).length;
  const resolved = resolveTJunctions(merged);
  const p = merged.positions;
  const min: [number, number, number] = [Infinity, Infinity, Infinity];
  const max: [number, number, number] = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < p.length; i += 3) {
    for (let k = 0; k < 3; ++k) {
      min[k] = Math.min(min[k]!, p[i + k]!);
      max[k] = Math.max(max[k]!, p[i + k]!);
    }
  }
  return {
    id, parts: meshes.length, vertices: p.length / 3, weldedVertices: resolved.weldedVertices,
    triangles: topology.triangles, degenerate: topology.degenerate, nonFinite: topology.nonFinite,
    boundaryEdges: topology.boundaryEdges, nonManifoldEdges: topology.nonManifoldEdges, windingErrors,
    openEdges: resolved.openEdges, resolvedNonManifold: resolved.nonManifold, defectSamples: resolved.samples,
    tJunctionVertices: resolved.tJunctionVertices, components: resolved.components,
    watertight: topology.watertight, volume: topology.volume, bounds: { min, max },
    partsWithNormals: meshes.filter((m) => m.normals !== null && m.normals.length === m.positions.length).length,
    partsWithUvs: meshes.filter((m) => m.uvs !== null && m.uvs.length === m.positions.length / 3 * 2).length,
  };
};
