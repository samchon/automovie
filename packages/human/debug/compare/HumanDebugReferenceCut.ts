import type { IHumanDebugReferencePack } from "../contracts/IHumanDebugReferencePack";

type Vec3 = [number, number, number];

/** Least reference segments a cut keeps before its slab stops widening. */
const LEAST: number = 24;

/** Half thickness of the first slab, mm; it doubles up to {@link WIDEST}. */
const FIRST: number = 1.5;

/** Widest half slab, mm. */
const WIDEST: number = 24;

/** Gap that separates two pieces of skin in a cut, mm. */
const LINK: number = 10;

/**
 * The reference's skin cut by a built part's section plane, in that plane's chart.
 *
 * The pack holds horizontal sections, and a part's plane may lean (a forearm, a foot, a nose), so a
 * cut takes the reference's loop segments whose two ends lie within a slab about the plane and
 * projects them along the plane's normal into its chart `(u, v)`: exact for a horizontal plane on a
 * section, and for a leaning one the skin's trace wherever the skin runs along the part's axis
 * across the slab's thickness. The slab starts at {@link FIRST} mm on either side and doubles
 * until {@link LEAST} segments lie in it or it reaches {@link WIDEST} mm; only segments within a
 * reach of the axis (three times the built box's largest half extent plus 30 mm) are kept, so a
 * neighbouring limb does not enter.
 *
 * A diagnostic candidate around the axis is selected heuristically: segments are joined into pieces wherever
 * two ends lie within {@link LINK} mm, and the piece that surrounds the axis (whose points fill at
 * least 9 of 12 equal angle sectors about it, the most of any) is the part's; a part merged into a
 * larger one (a nose on the face) can have no candidate and is then read only by its distances.
 * This angle-coverage and 10 mm linkage rule proves neither a closed skin nor containment. Open
 * source arcs and slab projection leave E/B approximate or unavailable; T/R measure nearest kept
 * projected segments, not an exact three-dimensional or anatomical error. None is acceptance.
 *
 * @evidence contracts/common.md#principled-implementation Projects supplied reference segments in a bounded slab into a part's own section plane; nearest-segment distances are exact only for that projected segment set. Candidate extents use the documented linkage and angle heuristic, not a closed-region proof.
 * @evidence contracts/common.md#clear-and-simple-design Keeps reference flattening, plane selection, candidate extents and point-to-segment diagnostics together, outside Human construction and acceptance.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Uses no candidate-shape adjustment or fitted distance target; absent surrounding support remains null and absent distance support remains infinite.
 * @evidence contracts/common.md#meaningful-documentation States frames, slab/reach limits, heuristic support and the distinction from true surface or anatomical error.
 * @evidence contracts/performance.md#efficient-algorithms Each plane makes at most five scans of the selected reference segments. The linkage grid is local in 2D, with quadratic candidate comparisons in a fully crowded cell; each distance query scans its retained segments. No stronger bound is claimed.
 * @evidence contracts/performance.md#reuse-equivalent-work Flattened region segments serve all station cuts of one comparison, and each cut serves its four touch and 48 ring queries; the loader owns request-level rebuilding.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Region buffers belong to the comparison, while slab, grid and union-find scratch are bounded by one cut's segment count and released with that cut; no global cache or handle is held.
 */
export namespace HumanDebugReferenceCut {
  /** A region's segments, flat: `x0, y0, z0, x1, y1, z1` per segment. */
  export interface IRegion {
    /** The region's label. */
    name: string;

    /** Segments in pack mm. */
    segments: Float64Array;
  }

  /** One cut. */
  export interface ICut {
    /** Every kept segment in the chart, `x0, z0, x1, z1` per segment, mm. */
    segments: number[];

    /** Heuristic candidate extremes `[+u, +v, -u, -v]` about the axis (last two negated), or null; not proof of a closed surrounding skin. */
    extents: [number, number, number, number] | null;

    /** Half slab used, mm. */
    slab: number;
  }

  /**
   * Flatten a pack's loops into segments by region.
   *
   * @param pack The reference's sections.
   * @returns One record per region.
   *
   * @evidence contracts/common.md#principled-implementation Preserves every supplied closed-loop edge and each open arc's consecutive edges in pack mm; an open arc contributes no artificial return segment.
   * @evidence contracts/common.md#clear-and-simple-design One flat six-number record per segment serves the later plane cuts independently of the display style.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Reads source coordinates only and does not close a source opening or use the compared figure to invent support.
   * @evidence contracts/common.md#meaningful-documentation The region and segment declarations state labels, coordinate order, units and diagnostic ownership.
   * @evidence contracts/performance.md#efficient-algorithms O(P) source points produce O(P) segments; one temporary numeric list per region is converted once to a Float64Array.
   * @evidence contracts/performance.md#reuse-equivalent-work The caller shares each region's resulting segments across every built station instead of resampling Hermite spans per query.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Returns call-owned typed buffers, releases temporary lists after conversion and retains no pack or global cache.
   */
  export function regions(pack: IHumanDebugReferencePack): IRegion[] {
    return pack.regions.map((r: IHumanDebugReferencePack.IRegion): IRegion => {
      const out: number[] = [];
      for (const s of r.sections)
        for (const closed of [true, false])
        for (const loop of (closed ? s.loops : (s.arcs ?? []))) {
          const n: number = loop.length / 2;
          for (let i: number = 0; i < (closed ? n : n - 1); i++) {
            const j: number = (i + 1) % n;
            out.push(loop[2 * i]!, s.y, loop[2 * i + 1]!, loop[2 * j]!, s.y, loop[2 * j + 1]!);
          }
        }
      return { name: r.name, segments: Float64Array.from(out) };
    });
  }

  /**
   * Cut the reference by one plane.
   *
   * @param regions The regions to read.
   * @param origin Plane origin, mm.
   * @param u Chart's first axis, unit.
   * @param v Chart's second axis, unit.
   * @param reach Largest half extent of the built box there, mm.
   * @returns The cut.
   */
  export function of(regions: readonly IRegion[], origin: Vec3, u: Vec3, v: Vec3, reach: number): ICut {
    const w: Vec3 = [v[1] * u[2] - v[2] * u[1], v[2] * u[0] - v[0] * u[2], v[0] * u[1] - v[1] * u[0]];
    const radius: number = 3 * reach + 30;
    let slab: number = FIRST;
    let segments: number[] = [];
    for (;;) {
      segments = [];
      for (const r of regions) {
        const s: Float64Array = r.segments;
        for (let i: number = 0; i < s.length; i += 6) {
          const a: Vec3 = [s[i]! - origin[0], s[i + 1]! - origin[1], s[i + 2]! - origin[2]];
          const b: Vec3 = [s[i + 3]! - origin[0], s[i + 4]! - origin[1], s[i + 5]! - origin[2]];
          if (Math.abs(dot(a, w)) > slab || Math.abs(dot(b, w)) > slab) continue;
          const ax: number = dot(a, u);
          const az: number = dot(a, v);
          if (ax * ax + az * az > radius * radius) continue;
          segments.push(ax, az, dot(b, u), dot(b, v));
        }
      }
      if (segments.length / 4 >= LEAST || slab >= WIDEST) break;
      slab *= 2;
    }
    return { segments, extents: surround(segments), slab };
  }

  /**
   * Distance from a chart point to the nearest kept segment.
   *
   * @param cut The cut.
   * @param x Chart `u`, mm.
   * @param z Chart `v`, mm.
   * @returns The distance, mm; infinite without segments.
   */
  export function distance(cut: ICut, x: number, z: number): number {
    let best: number = Infinity;
    const s: number[] = cut.segments;
    for (let i: number = 0; i < s.length; i += 4) {
      const dx: number = s[i + 2]! - s[i]!;
      const dz: number = s[i + 3]! - s[i + 1]!;
      const length: number = dx * dx + dz * dz;
      const t: number = length > 0 ? Math.max(0, Math.min(1, ((x - s[i]!) * dx + (z - s[i + 1]!) * dz) / length)) : 0;
      best = Math.min(best, Math.hypot(s[i]! + t * dx - x, s[i + 1]! + t * dz - z));
    }
    return best;
  }

  /** Candidate extremes from 10 mm segment linkage and at least 9/12 occupied angle sectors, or null; this does not prove closure or containment. */
  function surround(segments: readonly number[]): [number, number, number, number] | null {
    const n: number = segments.length / 4;
    if (n === 0) return null;
    // Union-find over segments; two segments join when an end of one lies within LINK of an end of the other.
    const parent: number[] = Array.from({ length: n }, (_: unknown, i: number): number => i);
    const find = (i: number): number => (parent[i] === i ? i : (parent[i] = find(parent[i]!)));
    const cell = (x: number, z: number): string => Math.floor(x / LINK) + "," + Math.floor(z / LINK);
    const grid: Map<string, number[]> = new Map();
    for (let i: number = 0; i < n; i++)
      for (const e of [0, 2]) {
        const key: string = cell(segments[4 * i + e]!, segments[4 * i + e + 1]!);
        const list: number[] = grid.get(key) ?? [];
        list.push(i * 2 + e / 2);
        grid.set(key, list);
      }
    for (let i: number = 0; i < n; i++)
      for (const e of [0, 2]) {
        const x: number = segments[4 * i + e]!;
        const z: number = segments[4 * i + e + 1]!;
        const cx: number = Math.floor(x / LINK);
        const cz: number = Math.floor(z / LINK);
        for (let dx: number = -1; dx <= 1; dx++)
          for (let dz: number = -1; dz <= 1; dz++)
            for (const end of grid.get(cx + dx + "," + (cz + dz)) ?? []) {
              const j: number = end >> 1;
              const f: number = (end & 1) * 2;
              if (Math.hypot(segments[4 * j + f]! - x, segments[4 * j + f + 1]! - z) <= LINK) parent[find(i)] = find(j);
            }
      }
    const pieces: Map<number, number[]> = new Map();
    for (let i: number = 0; i < n; i++) {
      const root: number = find(i);
      const list: number[] = pieces.get(root) ?? [];
      list.push(i);
      pieces.set(root, list);
    }
    let best: number[] | null = null;
    let filled: number = 8;
    for (const list of pieces.values()) {
      const sectors: Set<number> = new Set();
      for (const i of list) sectors.add(Math.floor(((Math.atan2(segments[4 * i + 1]!, segments[4 * i]!) + Math.PI) / (2 * Math.PI)) * 12) % 12);
      if (sectors.size > filled) {
        filled = sectors.size;
        best = list;
      }
    }
    if (best === null) return null;
    let e: [number, number, number, number] = [-Infinity, -Infinity, -Infinity, -Infinity];
    for (const i of best)
      for (const k of [0, 2]) {
        const x: number = segments[4 * i + k]!;
        const z: number = segments[4 * i + k + 1]!;
        e = [Math.max(e[0], x), Math.max(e[1], z), Math.max(e[2], -x), Math.max(e[3], -z)];
      }
    return e;
  }

  /** Dot product. */
  function dot(a: Vec3, b: Vec3): number {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  }
}
