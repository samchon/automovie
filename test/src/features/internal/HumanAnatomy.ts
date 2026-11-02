import { AutoMovieHumanBodySurface } from "../../../../packages/human/src/generation/AutoMovieHumanBodySurface";
import type { IAutoMovieHumanPose } from "../../../../packages/human/src/structures/pose/IAutoMovieHumanPose";
import { HumanPeople } from "./HumanPeople";

/**
 * Measurement of a generated person's skin: the closed triangle mesh the
 * surface emits, at the bind or under a pose through the public rig and pose
 * evaluator. Everything here reads positions and triangles only; nothing reads
 * the construction's constants, priors or fields, and sites are found on the
 * skin by the definitions the anatomy tests cite.
 *
 * Frame: forward +X, up +Y, the body's left +Z, millimetres, floor at y = 0.
 */
export namespace HumanAnatomy {
  /** A point or a direction. */
  export type V3 = [number, number, number];

  /** A skin: positions, triangles and where its joints stand. */
  export interface ISkin {
    /** Person's name. */
    name: string;

    /** Flat vertex positions, mm. */
    P: Float64Array;

    /** Flat triangle vertex indices, counter-clockwise from outside. */
    I: Uint32Array;

    /** Chain each triangle belongs to, an index into `chains`. */
    tri: Int32Array;

    /** Chain names the surface gave its triangle groups. */
    chains: string[];

    /** Joint centres of the rig in this skin's pose, mm. */
    joints: Map<string, V3>;
  }

  /** One component of a plane's section through the skin. */
  export interface ICut {
    /** Taut-tape girth: perimeter of the section's convex hull, mm. */
    girth: number;

    /** Enclosed area, mm². */
    area: number;

    /** Section points in 3D, mm. */
    points: V3[];

    /** Whether the component encloses the point it was picked by. */
    contained: boolean;

    /** Distance from the pick to the component when it does not enclose it, else zero, mm. */
    outside: number;
  }

  /**
   * A point on the median plane, a hair to the left: the skin's seam vertices
   * lie on the plane itself, where a section would cut through vertices.
   */
  export const MEDIAN: V3 = [0, 0, 1e-3];

  /** The skin at the bind, generated once per person. */
  export function bind(name: string): ISkin {
    const found: ISkin | undefined = binds.get(name);
    if (found !== undefined) return found;
    const person: HumanPeople.IRigged = HumanPeople.rigged(name);
    const surface: AutoMovieHumanBodySurface.IOutput =
      AutoMovieHumanBodySurface.generate(person.body, []);
    const chains: string[] = [];
    const index: Map<string, number> = new Map();
    const I: Uint32Array = Uint32Array.from(surface.mesh.indices);
    const tri: Int32Array = new Int32Array(I.length / 3).fill(-1);
    const groups = surface.mesh.groups;
    groups.forEach((g, k: number): void => {
      const chain: string = g.name.split("/")[0]!;
      if (!index.has(chain)) {
        index.set(chain, chains.length);
        chains.push(chain);
      }
      const end: number = k + 1 < groups.length ? groups[k + 1]!.start : I.length;
      for (let t: number = g.start / 3; t < end / 3; t++) tri[t] = index.get(chain)!;
    });
    const out: ISkin = {
      name,
      P: Float64Array.from(surface.mesh.positions),
      I,
      tri,
      chains,
      joints: joints(person, person.evaluate({}), false),
    };
    binds.set(name, out);
    return out;
  }

  /**
   * The skin under a pose, skinned by the rig's own binding and blended as dual
   * quaternions, the blend the rig declares for its skin.
   */
  export function posed(name: string, pose: IAutoMovieHumanPose): ISkin {
    const key: string = name + JSON.stringify(pose);
    const found: ISkin | undefined = poses.get(key);
    if (found !== undefined) return found;
    const rest: ISkin = bind(name);
    const person: HumanPeople.IRigged = HumanPeople.rigged(name);
    const skin = binding(name);
    const output = person.evaluate(pose);
    const world: Map<string, { r: number[]; d: number[] }> = transforms(person, output);
    const P: Float64Array = new Float64Array(rest.P.length);
    const n: number = rest.P.length / 3;
    for (let v: number = 0; v < n; v++) {
      const r: number[] = [0, 0, 0, 0];
      const d: number[] = [0, 0, 0, 0];
      let first: number[] | null = null;
      for (let k: number = 0; k < 4; k++) {
        const w: number = skin.weights[4 * v + k]!;
        if (w === 0) continue;
        const b = world.get(skin.joints[skin.boneIndices[4 * v + k]!]!)!;
        first ??= b.r;
        const s: number =
          b.r[0]! * first[0]! + b.r[1]! * first[1]! + b.r[2]! * first[2]! + b.r[3]! * first[3]! < 0 ? -w : w;
        for (let c: number = 0; c < 4; c++) {
          r[c] += s * b.r[c]!;
          d[c] += s * b.d[c]!;
        }
      }
      const len: number = Math.hypot(r[0]!, r[1]!, r[2]!, r[3]!);
      for (let c: number = 0; c < 4; c++) {
        r[c] /= len;
        d[c] /= len;
      }
      const p: V3 = [rest.P[3 * v]!, rest.P[3 * v + 1]!, rest.P[3 * v + 2]!];
      const q: V3 = rotate(r, p);
      // Translation of a unit dual quaternion: 2 (d conj(r)).xyz.
      const t: V3 = [
        2 * (r[3]! * d[0]! - d[3]! * r[0]! + (r[1]! * d[2]! - r[2]! * d[1]!)),
        2 * (r[3]! * d[1]! - d[3]! * r[1]! + (r[2]! * d[0]! - r[0]! * d[2]!)),
        2 * (r[3]! * d[2]! - d[3]! * r[2]! + (r[0]! * d[1]! - r[1]! * d[0]!)),
      ];
      P[3 * v] = q[0] + t[0];
      P[3 * v + 1] = q[1] + t[1];
      P[3 * v + 2] = q[2] + t[2];
    }
    const out: ISkin = { ...rest, P, joints: joints(person, output, true) };
    if (poses.size > 6) poses.delete(poses.keys().next().value!);
    poses.set(key, out);
    return out;
  }

  /** The rig's four influences on every bind vertex, prepared once per person. */
  export function binding(name: string): {
    joints: string[];
    boneIndices: number[];
    weights: number[];
  } {
    const found = bindings.get(name);
    if (found !== undefined) return found;
    const person: HumanPeople.IRigged = HumanPeople.rigged(name);
    const rest: ISkin = bind(name);
    const made = person.rig.bind(Array.from(rest.P, (c: number): number => c * person.scale));
    const out = {
      joints: made.joints as string[],
      boneIndices: made.boneIndices as number[],
      weights: made.weights as number[],
    };
    bindings.set(name, out);
    return out;
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
    for (const t of triangles(skin, chain))
      for (let k: number = 0; k < 3; k++) seen.add(skin.I[3 * t + k]!);
    return [...seen].map((v: number): V3 => point(skin, v));
  }

  /** Triangles with a vertex within a radius of a segment. */
  export function near(skin: ISkin, a: V3, b: V3, radius: number): Uint32Array {
    const ab: V3 = sub(b, a);
    const ll: number = dot(ab, ab);
    const close = (v: number): boolean => {
      const p: V3 = point(skin, v);
      const s: number = Math.max(0, Math.min(1, dot(sub(p, a), ab) / ll));
      return dist(p, add(a, scale(ab, s))) <= radius;
    };
    const ok: Uint8Array = new Uint8Array(skin.P.length / 3);
    for (let v: number = 0; v < ok.length; v++) ok[v] = close(v) ? 1 : 0;
    const out: number[] = [];
    for (let t: number = 0; t < skin.I.length / 3; t++)
      if (ok[skin.I[3 * t]!] || ok[skin.I[3 * t + 1]!] || ok[skin.I[3 * t + 2]!]) out.push(t);
    return Uint32Array.from(out);
  }

  /**
   * The section of the skin by a plane, as the component holding a point.
   *
   * Each crossing triangle gives a segment between two of its edges; segments
   * sharing an edge join, so a component is one loop of skin. The girth is the
   * perimeter of the loop's convex hull: a tape drawn taut round a section lies
   * on its hull and bridges every hollow, as a tape measure does.
   *
   * @param pick Point the wanted component encloses; the nearest component
   *   when none does.
   */
  export function cut(
    skin: ISkin,
    origin: V3,
    normal: V3,
    pick: V3,
    within?: Uint32Array,
  ): ICut | null {
    const all: IPieces = pieces(skin, origin, normal, within);
    if (all.components.length === 0) return null;
    const [u, w] = basis(normal);
    const at = (p: V3): [number, number] => [dot(sub(p, origin), u), dot(sub(p, origin), w)];
    const q: [number, number] = at(pick);
    let best: number = -1;
    let bestArea: number = Infinity;
    all.components.forEach((c: IComponent, k: number): void => {
      let crossings: number = 0;
      for (const [a, b] of c.segments) {
        const pa: [number, number] = at(a);
        const pb: [number, number] = at(b);
        if (pa[1] > q[1] !== pb[1] > q[1]) {
          const x: number = pa[0] + ((q[1] - pa[1]) * (pb[0] - pa[0])) / (pb[1] - pa[1]);
          if (x > q[0]) crossings++;
        }
      }
      if (crossings % 2 === 1 && c.area < bestArea) {
        best = k;
        bestArea = c.area;
      }
    });
    let contained: boolean = true;
    let nearest: number = 0;
    if (best < 0) {
      contained = false;
      nearest = Infinity;
      all.components.forEach((c: IComponent, k: number): void => {
        for (const [a] of c.segments) {
          const d: number = dist(a, pick);
          if (d < nearest) {
            nearest = d;
            best = k;
          }
        }
      });
    }
    const chosen: IComponent = all.components[best]!;
    const points: V3[] = chosen.segments.map((s: [V3, V3]): V3 => s[0]);
    return {
      girth: hull(points.map(at)),
      area: chosen.area,
      points,
      contained,
      outside: nearest,
    };
  }

  /** Every component of a plane's section, each as an ordered polyline. */
  export function polylines(
    skin: ISkin,
    origin: V3,
    normal: V3,
    within?: Uint32Array,
  ): { points: V3[]; closed: boolean }[] {
    const all: IPieces = pieces(skin, origin, normal, within);
    return all.components.map((c: IComponent): { points: V3[]; closed: boolean } => {
      const uses: Map<number, number[]> = new Map();
      c.keys.forEach(([a, b], k: number): void => {
        for (const e of [a, b]) {
          const list: number[] = uses.get(e) ?? [];
          list.push(k);
          uses.set(e, list);
        }
      });
      let start: number = 0;
      let startKey: number = c.keys[0]![0];
      let closed: boolean = true;
      for (const [e, list] of uses)
        if (list.length === 1) {
          start = list[0]!;
          startKey = e;
          closed = false;
          break;
        }
      const done: Uint8Array = new Uint8Array(c.keys.length);
      const out: V3[] = [];
      let seg: number = start;
      let key: number = startKey;
      for (;;) {
        done[seg] = 1;
        const [a, b] = c.keys[seg]!;
        const from: number = a === key ? 0 : 1;
        out.push(c.segments[seg]![from]);
        const next: number = from === 0 ? b : a;
        const list: number[] = uses.get(next) ?? [];
        const other: number | undefined = list.find((s: number): boolean => done[s] === 0);
        if (other === undefined) {
          out.push(c.segments[seg]![1 - from]);
          break;
        }
        seg = other;
        key = next;
      }
      return { points: out, closed };
    });
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

  /** Vertex position. */
  export function point(skin: ISkin, v: number): V3 {
    return [skin.P[3 * v]!, skin.P[3 * v + 1]!, skin.P[3 * v + 2]!];
  }

  /** Perimeter of the convex hull of planar points. */
  export function hull(points: [number, number][]): number {
    const p: [number, number][] = [...points].sort(
      (a: [number, number], b: [number, number]): number => a[0] - b[0] || a[1] - b[1],
    );
    if (p.length < 3) return 0;
    const cross = (o: [number, number], a: [number, number], b: [number, number]): number =>
      (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
    const lower: [number, number][] = [];
    for (const q of p) {
      while (lower.length >= 2 && cross(lower[lower.length - 2]!, lower[lower.length - 1]!, q) <= 0) lower.pop();
      lower.push(q);
    }
    const upper: [number, number][] = [];
    for (let i: number = p.length - 1; i >= 0; i--) {
      const q: [number, number] = p[i]!;
      while (upper.length >= 2 && cross(upper[upper.length - 2]!, upper[upper.length - 1]!, q) <= 0) upper.pop();
      upper.push(q);
    }
    const ring: [number, number][] = [...lower.slice(0, -1), ...upper.slice(0, -1)];
    let sum: number = 0;
    for (let i: number = 0; i < ring.length; i++) {
      const a: [number, number] = ring[i]!;
      const b: [number, number] = ring[(i + 1) % ring.length]!;
      sum += Math.hypot(b[0] - a[0], b[1] - a[1]);
    }
    return sum;
  }

  /**
   * Signed volume the skin encloses, mm³, by the divergence theorem over its
   * triangles. The openings stay where they are under a limb's pose, so a
   * change of this volume between two poses is the pose's own.
   */
  export function volume(skin: ISkin): number {
    let sum: number = 0;
    for (let t: number = 0; t < skin.I.length; t += 3) {
      const a: V3 = point(skin, skin.I[t]!);
      const b: V3 = point(skin, skin.I[t + 1]!);
      const c: V3 = point(skin, skin.I[t + 2]!);
      sum += dot(a, cross(b, c)) / 6;
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
      const n: V3 = [normals[3 * v]!, normals[3 * v + 1]!, normals[3 * v + 2]!];
      const q: V3 = add(p, scale(n, 0.05));
      let inside: number = 0;
      let depth: number = Infinity;
      for (let axis: number = 0; axis < 3; axis++)
        for (const sign of [1, -1]) {
          const hit = cast(skin, grid, q, axis, sign);
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
      const n: V3 = cross(sub(b, a), sub(c, a));
      for (let k: number = 0; k < 3; k++)
        for (let c3: number = 0; c3 < 3; c3++) out[3 * skin.I[t + k]! + c3]! += n[c3]!;
    }
    for (let v: number = 0; v < out.length; v += 3) {
      const l: number = Math.hypot(out[v]!, out[v + 1]!, out[v + 2]!) || 1;
      out[v]! /= l;
      out[v + 1]! /= l;
      out[v + 2]! /= l;
    }
    return out;
  }

  /** Distance from each point to the nearest triangle of the skin, by a grid. */
  export function distances(skin: ISkin, points: V3[], reach: number): number[] {
    const cell: number = Math.max(reach, 2);
    const key = (i: number, j: number, k: number): number => ((i + 1000) * 2000 + (j + 1000)) * 2000 + (k + 1000);
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
              best = Math.min(
                best,
                triangleDistance(p, point(skin, skin.I[t]!), point(skin, skin.I[t + 1]!), point(skin, skin.I[t + 2]!)),
              );
      return best;
    });
  }

  /** Exact distance from a point to a triangle. */
  export function triangleDistance(p: V3, a: V3, b: V3, c: V3): number {
    const ab: V3 = sub(b, a);
    const ac: V3 = sub(c, a);
    const ap: V3 = sub(p, a);
    const d1: number = dot(ab, ap);
    const d2: number = dot(ac, ap);
    if (d1 <= 0 && d2 <= 0) return dist(p, a);
    const bp: V3 = sub(p, b);
    const d3: number = dot(ab, bp);
    const d4: number = dot(ac, bp);
    if (d3 >= 0 && d4 <= d3) return dist(p, b);
    const vc: number = d1 * d4 - d3 * d2;
    if (vc <= 0 && d1 >= 0 && d3 <= 0) return dist(p, add(a, scale(ab, d1 / (d1 - d3))));
    const cp: V3 = sub(p, c);
    const d5: number = dot(ab, cp);
    const d6: number = dot(ac, cp);
    if (d6 >= 0 && d5 <= d6) return dist(p, c);
    const vb: number = d5 * d2 - d1 * d6;
    if (vb <= 0 && d2 >= 0 && d6 <= 0) return dist(p, add(a, scale(ac, d2 / (d2 - d6))));
    const va: number = d3 * d6 - d5 * d4;
    if (va <= 0 && d4 - d3 >= 0 && d5 - d6 >= 0)
      return dist(p, add(b, scale(sub(c, b), (d4 - d3) / (d4 - d3 + (d5 - d6)))));
    const denom: number = 1 / (va + vb + vc);
    return dist(p, add(a, add(scale(ab, vb * denom), scale(ac, vc * denom))));
  }

  /** Difference. */
  export function sub(a: V3, b: V3): V3 {
    return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  }

  /** Sum. */
  export function add(a: V3, b: V3): V3 {
    return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  }

  /** Scaled vector. */
  export function scale(a: V3, s: number): V3 {
    return [a[0] * s, a[1] * s, a[2] * s];
  }

  /** Dot product. */
  export function dot(a: V3, b: V3): number {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  }

  /** Cross product. */
  export function cross(a: V3, b: V3): V3 {
    return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  }

  /** Distance. */
  export function dist(a: V3, b: V3): number {
    return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
  }

  /** Unit vector. */
  export function unit(a: V3): V3 {
    const l: number = Math.hypot(a[0], a[1], a[2]);
    return [a[0] / l, a[1] / l, a[2] / l];
  }

  /** Point along a line. */
  export function lerp(a: V3, b: V3, s: number): V3 {
    return [a[0] + (b[0] - a[0]) * s, a[1] + (b[1] - a[1]) * s, a[2] + (b[2] - a[2]) * s];
  }

  /** Two unit vectors completing a normal to an orthonormal frame. */
  export function basis(n: V3): [V3, V3] {
    const helper: V3 = Math.abs(n[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
    const u: V3 = unit(cross(n, helper));
    return [u, cross(n, u)];
  }

  /** The vector's part perpendicular to a unit axis. */
  export function reject(a: V3, axis: V3): V3 {
    return sub(a, scale(axis, dot(a, axis)));
  }
}

/** One component of a section. */
interface IComponent {
  /** Segment end points. */
  segments: [HumanAnatomy.V3, HumanAnatomy.V3][];

  /** Edge keys of each segment's ends. */
  keys: [number, number][];

  /** Enclosed area, mm². */
  area: number;
}

/** A section's components. */
interface IPieces {
  /** Components, one per loop of skin. */
  components: IComponent[];
}

/** Ray-casting buckets of every triangle, along each axis. */
interface IRayGrid {
  /** Bucket size, mm. */
  cell: number;

  /** Per axis, triangles by the cell of the other two coordinates. */
  cells: Map<number, number[]>[];
}

const binds: Map<string, HumanAnatomy.ISkin> = new Map();
const poses: Map<string, HumanAnatomy.ISkin> = new Map();
const bindings: Map<string, { joints: string[]; boneIndices: number[]; weights: number[] }> = new Map();
const rayGrids: WeakMap<HumanAnatomy.ISkin, IRayGrid> = new WeakMap();
const triangleGrids: WeakMap<HumanAnatomy.ISkin, { cell: number; grid: Map<number, number[]> }> = new WeakMap();

/** Cut every triangle a plane crosses into segments, joined into loops by shared edges. */
function pieces(
  skin: HumanAnatomy.ISkin,
  origin: HumanAnatomy.V3,
  normal: HumanAnatomy.V3,
  within?: Uint32Array,
): IPieces {
  const n: number = skin.P.length / 3;
  const parent: Map<number, number> = new Map();
  const find = (k: number): number => {
    let r: number = k;
    while (parent.get(r) !== r) r = parent.get(r)!;
    let c: number = k;
    while (parent.get(c) !== r) {
      const next: number = parent.get(c)!;
      parent.set(c, r);
      c = next;
    }
    return r;
  };
  const segments: [HumanAnatomy.V3, HumanAnatomy.V3][] = [];
  const keys: [number, number][] = [];
  const signs: number[] = [];
  const count: number = within === undefined ? skin.I.length / 3 : within.length;
  const P: Float64Array = skin.P;
  for (let i: number = 0; i < count; i++) {
    const t: number = within === undefined ? i : within[i]!;
    const v: number[] = [skin.I[3 * t]!, skin.I[3 * t + 1]!, skin.I[3 * t + 2]!];
    const d: number[] = v.map(
      (x: number): number =>
        (P[3 * x]! - origin[0]) * normal[0] + (P[3 * x + 1]! - origin[1]) * normal[1] + (P[3 * x + 2]! - origin[2]) * normal[2],
    );
    const above: boolean[] = d.map((x: number): boolean => x >= 0);
    if (above[0] === above[1] && above[1] === above[2]) continue;
    const ends: HumanAnatomy.V3[] = [];
    const edgeKeys: number[] = [];
    for (let e: number = 0; e < 3; e++) {
      const a: number = e;
      const b: number = (e + 1) % 3;
      if (above[a] === above[b]) continue;
      const s: number = d[a]! / (d[a]! - d[b]!);
      const va: number = v[a]!;
      const vb: number = v[b]!;
      ends.push([
        P[3 * va]! + (P[3 * vb]! - P[3 * va]!) * s,
        P[3 * va + 1]! + (P[3 * vb + 1]! - P[3 * va + 1]!) * s,
        P[3 * va + 2]! + (P[3 * vb + 2]! - P[3 * va + 2]!) * s,
      ]);
      edgeKeys.push(Math.min(va, vb) * n + Math.max(va, vb));
    }
    // Orient the segment round the outward normal so loop areas add up.
    const pa: HumanAnatomy.V3 = HumanAnatomy.point(skin, v[0]!);
    const tn: HumanAnatomy.V3 = HumanAnatomy.cross(
      HumanAnatomy.sub(HumanAnatomy.point(skin, v[1]!), pa),
      HumanAnatomy.sub(HumanAnatomy.point(skin, v[2]!), pa),
    );
    const dir: HumanAnatomy.V3 = HumanAnatomy.sub(ends[1]!, ends[0]!);
    const flip: boolean = HumanAnatomy.dot(HumanAnatomy.cross(normal, tn), dir) < 0;
    segments.push(flip ? [ends[1]!, ends[0]!] : [ends[0]!, ends[1]!]);
    keys.push(flip ? [edgeKeys[1]!, edgeKeys[0]!] : [edgeKeys[0]!, edgeKeys[1]!]);
    signs.push(1);
    for (const k of edgeKeys) if (!parent.has(k)) parent.set(k, k);
    const ra: number = find(edgeKeys[0]!);
    const rb: number = find(edgeKeys[1]!);
    if (ra !== rb) parent.set(ra, rb);
  }
  const [u, w] = HumanAnatomy.basis(normal);
  const groups: Map<number, IComponent> = new Map();
  segments.forEach((s: [HumanAnatomy.V3, HumanAnatomy.V3], k: number): void => {
    const root: number = find(keys[k]![0]);
    let c: IComponent | undefined = groups.get(root);
    if (c === undefined) {
      c = { segments: [], keys: [], area: 0 };
      groups.set(root, c);
    }
    c.segments.push(s);
    c.keys.push(keys[k]!);
    const a: HumanAnatomy.V3 = HumanAnatomy.sub(s[0], origin);
    const b: HumanAnatomy.V3 = HumanAnatomy.sub(s[1], origin);
    c.area +=
      (HumanAnatomy.dot(a, u) * HumanAnatomy.dot(b, w) - HumanAnatomy.dot(a, w) * HumanAnatomy.dot(b, u)) / 2;
  });
  const components: IComponent[] = [...groups.values()];
  for (const c of components) c.area = Math.abs(c.area);
  return { components };
}

/** World rigid transform of every rig bone under an evaluated pose, as dual quaternions in mm. */
function transforms(
  person: HumanPeople.IRigged,
  output: ReturnType<HumanPeople.IRigged["evaluate"]>,
): Map<string, { r: number[]; d: number[] }> {
  const rest: Map<string, HumanAnatomy.V3> = new Map();
  for (const bone of person.rig.skeleton.bones) {
    const base: HumanAnatomy.V3 = bone.parent === null ? [0, 0, 0] : rest.get(bone.parent)!;
    const t = bone.rest.translation;
    rest.set(bone.bone, [base[0] + t.x, base[1] + t.y, base[2] + t.z]);
  }
  const placed = new Map(output.posed.map((p): [string, (typeof output.posed)[number]] => [p.bone, p]));
  const out: Map<string, { r: number[]; d: number[] }> = new Map();
  const mm: number = 1 / person.scale;
  for (const bone of person.rig.skeleton.bones) {
    const own = placed.get(
      bone.bone === "leftToes" || bone.bone === "rightToes" ? bone.bone.replace("Toes", "HalluxProximal") : bone.bone,
    )!;
    const r: number[] = [...own.rotation];
    const from: HumanAnatomy.V3 = HumanAnatomy.scale(rest.get(bone.bone)!, mm);
    const to: HumanAnatomy.V3 = HumanAnatomy.scale(own.position, mm);
    const rf: HumanAnatomy.V3 = rotate(r, from);
    const t: HumanAnatomy.V3 = HumanAnatomy.sub(to, rf);
    // d = 0.5 (t, 0) r
    const d: number[] = [
      0.5 * (t[0] * r[3]! + (t[1] * r[2]! - t[2] * r[1]!)),
      0.5 * (t[1] * r[3]! + (t[2] * r[0]! - t[0] * r[2]!)),
      0.5 * (t[2] * r[3]! + (t[0] * r[1]! - t[1] * r[0]!)),
      -0.5 * (t[0] * r[0]! + t[1] * r[1]! + t[2] * r[2]!),
    ];
    out.set(bone.bone, { r, d });
  }
  return out;
}

/** Joint centres of an evaluated pose, mm. */
function joints(
  person: HumanPeople.IRigged,
  output: ReturnType<HumanPeople.IRigged["evaluate"]>,
  isPosed: boolean,
): Map<string, HumanAnatomy.V3> {
  const mm: number = 1 / person.scale;
  const list = isPosed ? output.posed : output.bones;
  return new Map(
    list.map((b): [string, HumanAnatomy.V3] => [b.bone, HumanAnatomy.scale(b.position, mm)]),
  );
}

/** Rotate a vector by a unit quaternion `[x, y, z, w]`. */
function rotate(q: number[], v: HumanAnatomy.V3): HumanAnatomy.V3 {
  const x: number = q[0]!;
  const y: number = q[1]!;
  const z: number = q[2]!;
  const w: number = q[3]!;
  const t: HumanAnatomy.V3 = [2 * (y * v[2] - z * v[1]), 2 * (z * v[0] - x * v[2]), 2 * (x * v[1] - y * v[0])];
  return [
    v[0] + w * t[0] + (y * t[2] - z * t[1]),
    v[1] + w * t[1] + (z * t[0] - x * t[2]),
    v[2] + w * t[2] + (x * t[1] - y * t[0]),
  ];
}

/** Bucket every triangle for axis rays. */
function rayGrid(skin: HumanAnatomy.ISkin): IRayGrid {
  const found: IRayGrid | undefined = rayGrids.get(skin);
  if (found !== undefined) return found;
  const cell: number = 4;
  const cells: Map<number, number[]>[] = [new Map(), new Map(), new Map()];
  for (let t: number = 0; t < skin.I.length; t += 3) {
    const c: HumanAnatomy.V3[] = [0, 1, 2].map((k: number): HumanAnatomy.V3 => HumanAnatomy.point(skin, skin.I[t + k]!));
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

/** Cast an axis ray from a point and count the triangles it crosses. */
function cast(
  skin: HumanAnatomy.ISkin,
  grid: IRayGrid,
  p: HumanAnatomy.V3,
  axis: number,
  sign: number,
): { crossings: number; nearest: number } {
  const a: number = (axis + 1) % 3;
  const b: number = (axis + 2) % 3;
  const key: number = (Math.floor(p[a]! / grid.cell) + 2000) * 4000 + (Math.floor(p[b]! / grid.cell) + 2000);
  let crossings: number = 0;
  let nearest: number = Infinity;
  for (const t of grid.cells[axis]!.get(key) ?? []) {
    const c: HumanAnatomy.V3[] = [0, 1, 2].map((k: number): HumanAnatomy.V3 => HumanAnatomy.point(skin, skin.I[t + k]!));
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
