/** Exact planar cuts preserve the authored tile's attributes and cut faces. */
import { triangulateAutoMovieRegion } from "@automovie/engine";
import type { IAutoMovieMesh } from "@automovie/interface";

export interface TileCutPlane { x: number; y: number; z: number; constant: number }
type Vertex = { p: number[]; n: number[]; uv: number[] };
type BoundaryNode = { p: number[]; adjacent: Set<string> };
const tolerance = 1e-9;
const key = (p: number[]): string => p.map((value) => Math.round(value / tolerance)).join(":");
const blend = (a: number[], b: number[], t: number): number[] => a.map((v, i) => v + (b[i]! - v) * t);

/** Keep the nonnegative half-spaces; new cut faces close the remaining solid. */
export const cutTileMesh = (input: IAutoMovieMesh, planes: readonly TileCutPlane[]): IAutoMovieMesh | null => {
  let mesh = input;
  for (const plane of planes) {
    if (![plane.x, plane.y, plane.z, plane.constant].every(Number.isFinite) ||
      Math.hypot(plane.x, plane.y, plane.z) < tolerance) throw new Error("invalid tile cut plane");
    const positions: number[] = [], normals: number[] = [], uvs: number[] = [], indices: number[] = [];
    const segments: [number[], number[]][] = [];
    const distance = (p: number[]): number => plane.x * p[0]! + plane.y * p[1]! + plane.z * p[2]! + plane.constant;
    if (!mesh.positions.some((_, i) => i % 3 === 0 && distance(mesh.positions.slice(i, i + 3)) > tolerance)) return null;
    const emit = (vertices: Vertex[]): void => {
      for (let i = 1; i < vertices.length - 1; i++) {
        const triangle = [vertices[0]!, vertices[i]!, vertices[i + 1]!];
        const a = triangle[0]!.p, b = triangle[1]!.p, c = triangle[2]!.p;
        const cross = [
          (b[1]! - a[1]!) * (c[2]! - a[2]!) - (b[2]! - a[2]!) * (c[1]! - a[1]!),
          (b[2]! - a[2]!) * (c[0]! - a[0]!) - (b[0]! - a[0]!) * (c[2]! - a[2]!),
          (b[0]! - a[0]!) * (c[1]! - a[1]!) - (b[1]! - a[1]!) * (c[0]! - a[0]!),
        ];
        if (Math.hypot(...cross) < 1e-12) continue;
        for (const vertex of triangle) {
          indices.push(positions.length / 3);
          positions.push(...vertex.p); normals.push(...vertex.n); uvs.push(...vertex.uv);
        }
      }
    };
    if (mesh.indices === null || mesh.normals === null || mesh.uvs === null) throw new Error("tile cut requires indexed normals and UVs");
    for (let i = 0; i < mesh.indices.length; i += 3) {
      const vertices = mesh.indices.slice(i, i + 3).map((index) => ({
        p: mesh.positions.slice(index * 3, index * 3 + 3),
        n: mesh.normals!.slice(index * 3, index * 3 + 3),
        uv: mesh.uvs!.slice(index * 2, index * 2 + 2),
      }));
      const distances = vertices.map((vertex) => distance(vertex.p));
      if (distances.every((d) => Math.abs(d) <= tolerance)) {
        const n = vertices[0]!.n;
        if (n[0]! * plane.x + n[1]! * plane.y + n[2]! * plane.z < 0) emit(vertices);
        continue;
      }
      if (distances.every((d) => d >= -tolerance)) { emit(vertices); continue; }
      if (distances.every((d) => d <= tolerance)) continue;
      const clipped: Vertex[] = [];
      for (let j = 0; j < vertices.length; j++) {
        const a = vertices[j]!, b = vertices[(j + 1) % vertices.length]!;
        const da = distance(a.p), db = distance(b.p);
        if (da >= -tolerance) clipped.push(a);
        if ((da > tolerance && db < -tolerance) || (da < -tolerance && db > tolerance)) {
          const t = da / (da - db);
          clipped.push({ p: blend(a.p, b.p, t), n: blend(a.n, b.n, t), uv: blend(a.uv, b.uv, t) });
        }
      }
      emit(clipped);
    }
    if (indices.length === 0) return null;
    for (let i = 0; i < indices.length; i += 3) {
      const triangle = indices.slice(i, i + 3).map((index) => positions.slice(index * 3, index * 3 + 3));
      for (let j = 0; j < 3; j++) {
        const a = triangle[j]!, b = triangle[(j + 1) % 3]!;
        if (Math.abs(distance(a)) < tolerance * 4 && Math.abs(distance(b)) < tolerance * 4) segments.push([a, b]);
      }
    }
    const nodes = new Map<string, BoundaryNode>();
    const edgeCounts = new Map<string, { from: string; to: string; count: number }>();
    const endpoints = new Map(segments.flatMap(([a, b]) => [[key(a), a], [key(b), b]] as [string, number[]][]));
    for (const [a, b] of segments) {
      const direction = b.map((value, i) => value - a[i]!);
      const length2 = direction.reduce((sum, value) => sum + value * value, 0);
      if (length2 < tolerance * tolerance) continue;
      // A triangulated cap can span intermediate side-face vertices. Split at
      // every geometrically incident endpoint before tracing the cut boundary.
      const incident = [...endpoints].map(([id, p]) => ({ id, p,
        t: p.reduce((sum, value, i) => sum + (value - a[i]!) * direction[i]!, 0) / length2,
      })).filter(({ p, t }) => t >= -tolerance && t <= 1 + tolerance &&
        Math.hypot(...p.map((value, i) => value - a[i]! - t * direction[i]!)) < tolerance * 8)
        .sort((left, right) => left.t - right.t);
      for (let i = 0; i < incident.length - 1; i++) {
        const from = incident[i]!, to = incident[i + 1]!;
        if (from.id === to.id) continue;
        const id = [from.id, to.id].sort((a, b) => a.localeCompare(b)).join("/");
        const edge = edgeCounts.get(id) ?? { from: from.id, to: to.id, count: 0 };
        edge.count++; edgeCounts.set(id, edge);
      }
    }
    for (const edge of edgeCounts.values()) {
      if (edge.count === 2) continue;
      if (edge.count !== 1) throw new Error("nonmanifold tile cut edge");
      if (!nodes.has(edge.from)) nodes.set(edge.from, { p: endpoints.get(edge.from)!, adjacent: new Set() });
      if (!nodes.has(edge.to)) nodes.set(edge.to, { p: endpoints.get(edge.to)!, adjacent: new Set() });
      nodes.get(edge.from)!.adjacent.add(edge.to); nodes.get(edge.to)!.adjacent.add(edge.from);
    }
    const magnitude = Math.hypot(plane.x, plane.y, plane.z);
    const normal = [-plane.x / magnitude, -plane.y / magnitude, -plane.z / magnitude];
    // U lies in the horizontal cut plane, V completes its outward frame.
    const horizontal = Math.hypot(normal[0]!, normal[2]!);
    const u = horizontal > tolerance ? [normal[2]! / horizontal, 0, -normal[0]! / horizontal] : [1, 0, 0];
    const v = [normal[1]! * u[2]! - normal[2]! * u[1]!, normal[2]! * u[0]! - normal[0]! * u[2]!, normal[0]! * u[1]! - normal[1]! * u[0]!];
    const dot = (a: number[], b: number[]): number => a.reduce((sum, value, i) => sum + value * b[i]!, 0);
    while (nodes.size > 0) {
      const first = [...nodes].find(([, node]) => node.adjacent.size === 1)?.[0] ?? nodes.keys().next().value!;
      const startDegree = nodes.get(first)!.adjacent.size;
      const ring: number[][] = [];
      let current: string | undefined = first, prior: string | undefined;
      while (current !== undefined && nodes.has(current)) {
        const node: BoundaryNode = nodes.get(current)!;
        if (node.adjacent.size > 2) throw new Error("branched tile cut boundary");
        ring.push(node.p); nodes.delete(current);
        const next: string | undefined = [...node.adjacent].find((candidate) => candidate !== prior && (candidate === first || nodes.has(candidate)));
        prior = current; current = next === first ? undefined : next;
      }
      if (ring.length < 3) continue;
      const projected = ring.map((p) => ({ x: dot(p, u), y: dot(p, v) }));
      const result = (() => {
        try { return triangulateAutoMovieRegion({ outer: projected }); }
        catch (error) { throw new Error(`tile cut startDegree=${startDegree} ${JSON.stringify(plane)} ring ${JSON.stringify(projected)}: ${String(error)}`); }
      })();
      for (let i = 0; i < result.triangles.length; i += 3) {
        emit(result.triangles.slice(i, i + 3).map((index) => {
          const p = ring[result.sourceIndices[index]!]!;
          return { p, n: normal, uv: [dot(p, u), dot(p, v)] };
        }));
      }
    }
    mesh = { positions, indices, normals, uvs, skin: null };
  }
  return mesh;
};
