import type { HumanAnatomy } from "./HumanAnatomy";
import { HumanAnatomyVector } from "./HumanAnatomyVector";

type V3 = HumanAnatomyVector.V3;
type ISkin = HumanAnatomy.ISkin;
const V: typeof HumanAnatomyVector = HumanAnatomyVector;

/**
 * Queries on a skin's triangles: picking them by chain or by distance from a
 * segment, its openings, enclosed volume, skin passing into skin, axis rays,
 * vertex normals and distances to the surface. Grids built for a skin are
 * kept per skin object and dropped with it. Reached through `HumanAnatomy`,
 * which re-exports every function.
 */
export namespace HumanAnatomySurface {
  /** Vertex position. */
  export function point(skin: ISkin, v: number): V3 {
    return [skin.P[3 * v]!, skin.P[3 * v + 1]!, skin.P[3 * v + 2]!];
  }

  /** A joint's centre, mm. */
  export function joint(skin: ISkin, bone: string): V3 {
    const found: V3 | undefined = skin.joints.get(bone);
    if (found === undefined) throw new Error(`${skin.name} has no ${bone} joint`);
    return found;
  }

  /** Triangles whose chain name passes a test. */
  export function triangles(skin: ISkin, chain: RegExp): Uint32Array {
    const keep: boolean[] = skin.chains.map((c: string): boolean => chain.test(c));
    const out: number[] = [];
    for (let t: number = 0; t < skin.tri.length; t++) if (keep[skin.tri[t]!]) out.push(t);
    return Uint32Array.from(out);
  }

  /** Vertices of the triangles whose chain name passes a test. */
  export function vertices(skin: ISkin, chain: RegExp): V3[] {
    const seen: Set<number> = new Set();
    for (const t of triangles(skin, chain)) for (let k: number = 0; k < 3; k++) seen.add(skin.I[3 * t + k]!);
    return [...seen].map((v: number): V3 => point(skin, v));
  }

  /** Triangles with a vertex within a radius of a segment. */
  export function near(skin: ISkin, a: V3, b: V3, radius: number): Uint32Array {
    const ab: V3 = V.sub(b, a);
    const ll: number = V.dot(ab, ab);
    const close: (v: number) => boolean = (v: number): boolean => {
      const p: V3 = point(skin, v);
      const s: number = ll === 0 ? 0 : Math.max(0, Math.min(1, V.dot(V.sub(p, a), ab) / ll));
      return V.dist(p, V.add(a, V.scale(ab, s))) <= radius;
    };
    const ok: Uint8Array = new Uint8Array(skin.P.length / 3);
    for (let v: number = 0; v < ok.length; v++) ok[v] = close(v) ? 1 : 0;
    const out: number[] = [];
    for (let t: number = 0; t < skin.I.length / 3; t++) if (ok[skin.I[3 * t]!] || ok[skin.I[3 * t + 1]!] || ok[skin.I[3 * t + 2]!]) out.push(t);
    return Uint32Array.from(out);
  }

  /** Boundary loops of the skin: the openings the apertures cut. */
  export function openings(skin: ISkin): V3[][] {
    const count: Map<number, number> = new Map();
    const next: Map<number, number> = new Map();
    const n: number = skin.P.length / 3;
    for (let t: number = 0; t < skin.I.length; t += 3)
      for (let e: number = 0; e < 3; e++) {
        const a: number = skin.I[t + e]!;
        const b: number = skin.I[t + ((e + 1) % 3)]!;
        const k: number = Math.min(a, b) * n + Math.max(a, b);
        count.set(k, (count.get(k) ?? 0) + 1);
      }

    // An edge one triangle uses is on a boundary; follow it backward round the loop.
    for (let t: number = 0; t < skin.I.length; t += 3)
      for (let e: number = 0; e < 3; e++) {
        const a: number = skin.I[t + e]!;
        const b: number = skin.I[t + ((e + 1) % 3)]!;
        if (count.get(Math.min(a, b) * n + Math.max(a, b)) === 1) next.set(b, a);
      }
    const loops: V3[][] = [];
    const seen: Set<number> = new Set();
    for (const start of next.keys()) {
      if (seen.has(start)) continue;
      const loop: V3[] = [];
      let v: number | undefined = start;
      while (v !== undefined && !seen.has(v)) {
        seen.add(v);
        loop.push(point(skin, v));
        v = next.get(v);
      }
      if (loop.length > 2) loops.push(loop);
    }
    return loops;
  }

  /**
   * Signed volume the skin encloses, mm^3, by the divergence theorem over its
   * triangles. The openings stay where they are under a limb's pose, so a
   * change of this volume between two poses is the pose's own.
   */
  export function volume(skin: ISkin): number {
    let sum: number = 0;
    for (let t: number = 0; t < skin.I.length; t += 3) {
      const a: V3 = point(skin, skin.I[t]!);
      const b: V3 = point(skin, skin.I[t + 1]!);
      const c: V3 = point(skin, skin.I[t + 2]!);
      sum += V.dot(a, V.cross(b, c)) / 6;
    }
    return sum;
  }

  /**
   * Skin passing into skin: vertices of a region that lie inside the closed
   * skin, with how deep. A vertex pushed a hair outward along its normal is
   * inside when rays along the three axes cross the skin an odd number of
   * times on most of them (an opening can spoil one ray); its depth is the
   * least distance to a triangle along the rays that found it inside.
   */
  export function penetration(skin: ISkin, region: Uint32Array): { count: number; deepest: number; at: V3 | null } {
    const normals: Float64Array = vertexNormals(skin);
    const grid: IRayGrid = rayGrid(skin);
    const verts: Set<number> = new Set();
    for (const t of region) for (let k: number = 0; k < 3; k++) verts.add(skin.I[3 * t + k]!);
    let count: number = 0;
    let deepest: number = 0;
    let at: V3 | null = null;
    for (const v of verts) {
      const p: V3 = point(skin, v);
      const nv: V3 = [normals[3 * v]!, normals[3 * v + 1]!, normals[3 * v + 2]!];
      const q: V3 = V.add(p, V.scale(nv, 0.05));
      let inside: number = 0;
      let depth: number = Infinity;
      for (let axis: number = 0; axis < 3; axis++)
        for (const sign of [1, -1]) {
          const hit: { crossings: number; nearest: number } = cast(skin, grid, q, axis, sign);
          if (hit.crossings % 2 === 1) {
            inside++;
            depth = Math.min(depth, hit.nearest);
          }
        }
      if (inside >= 4) {
        count++;
        if (depth > deepest) {
          deepest = depth;
          at = p;
        }
      }
    }
    return { count, deepest, at };
  }

  /** Skin crossings of a ray along an axis (0 x, 1 y, 2 z) in a sense, and the nearest one's distance. */
  export function ray(skin: ISkin, p: V3, axis: number, sign: 1 | -1): { crossings: number; nearest: number } {
    return cast(skin, rayGrid(skin), p, axis, sign);
  }

  /** Area-weighted unit vertex normals. */
  export function vertexNormals(skin: ISkin): Float64Array {
    const out: Float64Array = new Float64Array(skin.P.length);
    for (let t: number = 0; t < skin.I.length; t += 3) {
      const a: V3 = point(skin, skin.I[t]!);
      const b: V3 = point(skin, skin.I[t + 1]!);
      const c: V3 = point(skin, skin.I[t + 2]!);
      const n: V3 = V.cross(V.sub(b, a), V.sub(c, a));
      for (let k: number = 0; k < 3; k++) for (let c3: number = 0; c3 < 3; c3++) out[3 * skin.I[t + k]! + c3]! += n[c3]!;
    }
    for (let v: number = 0; v < out.length; v += 3) {
      const l: number = Math.hypot(out[v]!, out[v + 1]!, out[v + 2]!) || 1;
      out[v]! /= l;
      out[v + 1]! /= l;
      out[v + 2]! /= l;
    }
    return out;
  }

  /** Distance from each point to the nearest triangle of the skin, by a grid of cells at least `reach` wide. */
  export function distances(skin: ISkin, points: V3[], reach: number): number[] {
    const cell: number = Math.max(reach, 2);
    const key: (i: number, j: number, k: number) => number = (i: number, j: number, k: number): number => ((i + 1000) * 2000 + (j + 1000)) * 2000 + (k + 1000);
    const P: Float64Array = skin.P;
    const cached: { cell: number; grid: Map<number, number[]> } | undefined = triangleGrids.get(skin);
    const fresh: boolean = cached?.cell !== cell;
    const grid: Map<number, number[]> = fresh ? new Map() : cached!.grid;
    if (fresh) triangleGrids.set(skin, { cell, grid });
    for (let t: number = 0; fresh && t < skin.I.length; t += 3) {
      const a: number = 3 * skin.I[t]!;
      const b: number = 3 * skin.I[t + 1]!;
      const c: number = 3 * skin.I[t + 2]!;
      const lo: number[] = [0, 1, 2].map((k: number): number => Math.floor(Math.min(P[a + k]!, P[b + k]!, P[c + k]!) / cell));
      const hi: number[] = [0, 1, 2].map((k: number): number => Math.floor(Math.max(P[a + k]!, P[b + k]!, P[c + k]!) / cell));
      for (let i: number = lo[0]!; i <= hi[0]!; i++)
        for (let j: number = lo[1]!; j <= hi[1]!; j++)
          for (let k: number = lo[2]!; k <= hi[2]!; k++) {
            const list: number[] | undefined = grid.get(key(i, j, k));
            if (list === undefined) grid.set(key(i, j, k), [t]);
            else list.push(t);
          }
    }
    return points.map((p: V3): number => {
      const i: number = Math.floor(p[0] / cell);
      const j: number = Math.floor(p[1] / cell);
      const k: number = Math.floor(p[2] / cell);
      let best: number = Infinity;
      for (let a: number = -1; a <= 1; a++)
        for (let b: number = -1; b <= 1; b++)
          for (let c: number = -1; c <= 1; c++)
            for (const t of grid.get(key(i + a, j + b, k + c)) ?? [])
              best = Math.min(best, V.triangleDistance(p, point(skin, skin.I[t]!), point(skin, skin.I[t + 1]!), point(skin, skin.I[t + 2]!)));
      return best;
    });
  }

  /** Ray-casting buckets of every triangle, along each axis. */
  interface IRayGrid {
    /** Bucket size, mm. */
    cell: number;

    /** Per axis, triangles by the cell of the other two coordinates. */
    cells: Map<number, number[]>[];
  }

  /** Bucket every triangle for axis rays, once per skin. */
  function rayGrid(skin: ISkin): IRayGrid {
    const found: IRayGrid | undefined = rayGrids.get(skin);
    if (found !== undefined) return found;
    const cell: number = 4;
    const cells: Map<number, number[]>[] = [new Map(), new Map(), new Map()];
    for (let t: number = 0; t < skin.I.length; t += 3) {
      const c: V3[] = [0, 1, 2].map((k: number): V3 => point(skin, skin.I[t + k]!));
      for (let axis: number = 0; axis < 3; axis++) {
        const a: number = (axis + 1) % 3;
        const b: number = (axis + 2) % 3;
        const i0: number = Math.floor(Math.min(c[0]![a]!, c[1]![a]!, c[2]![a]!) / cell);
        const i1: number = Math.floor(Math.max(c[0]![a]!, c[1]![a]!, c[2]![a]!) / cell);
        const j0: number = Math.floor(Math.min(c[0]![b]!, c[1]![b]!, c[2]![b]!) / cell);
        const j1: number = Math.floor(Math.max(c[0]![b]!, c[1]![b]!, c[2]![b]!) / cell);
        for (let i: number = i0; i <= i1; i++)
          for (let j: number = j0; j <= j1; j++) {
            const key: number = (i + 2000) * 4000 + (j + 2000);
            const list: number[] = cells[axis]!.get(key) ?? [];
            list.push(t);
            cells[axis]!.set(key, list);
          }
      }
    }
    const out: IRayGrid = { cell, cells };
    rayGrids.set(skin, out);
    return out;
  }

  /** Cast an axis ray from a point and count the triangles it crosses, by barycentric coordinates in the other two axes. */
  function cast(skin: ISkin, grid: IRayGrid, p: V3, axis: number, sign: number): { crossings: number; nearest: number } {
    const a: number = (axis + 1) % 3;
    const b: number = (axis + 2) % 3;
    const key: number = (Math.floor(p[a]! / grid.cell) + 2000) * 4000 + (Math.floor(p[b]! / grid.cell) + 2000);
    let crossings: number = 0;
    let nearest: number = Infinity;
    for (const t of grid.cells[axis]!.get(key) ?? []) {
      const c: V3[] = [0, 1, 2].map((k: number): V3 => point(skin, skin.I[t + k]!));
      const d: number = (c[1]![a]! - c[0]![a]!) * (c[2]![b]! - c[0]![b]!) - (c[1]![b]! - c[0]![b]!) * (c[2]![a]! - c[0]![a]!);
      if (Math.abs(d) < 1e-12) continue;
      const l1: number = ((c[1]![a]! - p[a]!) * (c[2]![b]! - p[b]!) - (c[1]![b]! - p[b]!) * (c[2]![a]! - p[a]!)) / d;
      const l2: number = ((c[2]![a]! - p[a]!) * (c[0]![b]! - p[b]!) - (c[2]![b]! - p[b]!) * (c[0]![a]! - p[a]!)) / d;
      const l3: number = 1 - l1 - l2;
      if (l1 < 0 || l2 < 0 || l3 < 0) continue;
      const at: number = l1 * c[0]![axis]! + l2 * c[1]![axis]! + l3 * c[2]![axis]!;
      const along: number = (at - p[axis]!) * sign;
      if (along > 0) {
        crossings++;
        nearest = Math.min(nearest, along);
      }
    }
    return { crossings, nearest };
  }
}

/** Ray buckets per skin, dropped with the skin. */
const rayGrids: WeakMap<HumanAnatomy.ISkin, { cell: number; cells: Map<number, number[]>[] }> = new WeakMap();

/** Distance grids per skin and cell size, dropped with the skin. */
const triangleGrids: WeakMap<HumanAnatomy.ISkin, { cell: number; grid: Map<number, number[]> }> = new WeakMap();
