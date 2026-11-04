import type { HumanAnatomy } from "./HumanAnatomy";
import { HumanAnatomySurfaceIndex } from "./HumanAnatomySurfaceIndex";
import { HumanAnatomyVector } from "./HumanAnatomyVector";

type V3 = HumanAnatomyVector.V3;
type ISkin = HumanAnatomy.ISkin;
const V: typeof HumanAnatomyVector = HumanAnatomyVector;

/**
 * Queries on a skin's triangles: picking them by chain or by distance from a
 * segment, its openings, enclosed volume, skin passing into skin, axis rays,
 * vertex normals and distances to the surface. One bounding hierarchy per
 * immutable skin serves rays and global nearest-distance queries, retained
 * weakly by skin identity. Reached through `HumanAnatomy`,
 * which re-exports every function.
 */
export namespace HumanAnatomySurface {
  /** Existing index population and exact typed-array capacity, excluding object overhead. */
  export interface IStatistics {
    /** Zero before acquisition, then one hierarchy shared by both query kinds. */
    indexes: number;

    /** One reference per indexed triangle, with no coordinate-cell replication. */
    triangleReferences: number;

    /** Hierarchy and traversal typed-array bytes; borrowed mesh buffers are excluded. */
    typedBytes: number;
  }

  /**
   * Read existing index capacity without creating one or copying its arrays.
   *
   * @evidence contracts/common.md#principled-implementation Reads the weak-key index and its typed-array byte lengths without changing query inputs or acquisition/release points; object overhead is not estimated.
   * @evidence contracts/common.md#clear-and-simple-design The query owner exposes only counts and capacity; geometry and hierarchy arrays remain private.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No consumer, person or expected measurement changes the count.
   * @evidence contracts/common.md#meaningful-documentation Names acquisition state, one reference per triangle, typed bytes and excluded overhead.
   * @evidence contracts/performance.md#efficient-algorithms Reads a fixed number of array byte lengths in O(1) time with O(1) scalar scratch.
   * @evidence contracts/performance.md#reuse-equivalent-work Reads the same immutable-skin identity cache as queries and performs no generation, insertion or invalidation.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Returns three numbers and retains no skin or index; the weak-key cache lifetime is unchanged.
   */
  export function statistics(skin: ISkin): IStatistics {
    const found: HumanAnatomySurfaceIndex | undefined = indexes.get(skin);
    return { indexes: found === undefined ? 0 : 1, triangleReferences: found?.triangles ?? 0, typedBytes: found?.typedBytes ?? 0 };
  }

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
    const index: HumanAnatomySurfaceIndex = indexOf(skin);
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
          const hit: { crossings: number; nearest: number } = index.ray(q, axis, sign);
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
    return indexOf(skin).ray(p, axis, sign);
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

  /**
   * Distance from each point to the globally nearest triangle, mm.
   *
   * The former grid-cell width was an acceleration detail, not a measurement
   * input; the internal callers now request only the skin and query points.
   *
   * @evidence contracts/common.md#principled-implementation Delegates to global box-distance branch and bound, so interior and far points remain measured. The closed-triangle leaf distance includes collapsed segments and points without dropping their candidates.
   * @evidence contracts/common.md#clear-and-simple-design Shares one immutable-skin index with rays instead of retaining a second coordinate grid.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not turn missing local candidates into Infinity or change any consumer's tolerance.
   * @evidence contracts/common.md#meaningful-documentation Names global scope, units and removal of the obsolete grid-cell width.
   * @evidence contracts/performance.md#efficient-algorithms Builds one O(T)-storage hierarchy, then prunes by lower distance bound for each query, with O(T) worst-case query work.
   * @evidence contracts/performance.md#reuse-equivalent-work Both query kinds share the same immutable-skin index; a new skin identity acquires a new one.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Returns one scalar per point and retains no point list; only the weakly keyed skin index survives the call.
   */
  export function distances(skin: ISkin, points: V3[]): number[] {
    if (points.length === 0) return [];
    const index: HumanAnatomySurfaceIndex = indexOf(skin);
    return points.map((p: V3): number => index.distance(p));
  }
}

/** One hierarchy per immutable skin, released when its external readers release the skin. */
const indexes: WeakMap<HumanAnatomy.ISkin, HumanAnatomySurfaceIndex> = new WeakMap();

/**
 * Acquire lazily, publishing only a completed hierarchy so failures are not cached.
 *
 * Immutable skin identity defines one index's complete geometry; the weak map is an ephemeron, so its value's borrowed skin does not keep an otherwise unreachable key alive.
 * One acquisition owner serves rays, penetration and distance queries.
 * Uses no person name, pose alias or reach-dependent fallback.
 * Names lazy construction and failure publication semantics.
 * A hit is one weak-map lookup; a miss builds one linear-storage primitive hierarchy with its documented split costs.
 * Queries on the same immutable skin share the completed hierarchy; copied or posed skins acquire independent bounds.
 * Caches only after construction succeeds and adds no strong registry. Releasing every external skin reader makes the key and its index collectible; garbage-collection scheduling is not promised.
 */
function indexOf(skin: HumanAnatomy.ISkin): HumanAnatomySurfaceIndex {
  let found: HumanAnatomySurfaceIndex | undefined = indexes.get(skin);
  if (found === undefined) {
    found = new HumanAnatomySurfaceIndex(skin);
    indexes.set(skin, found);
  }
  return found;
}
