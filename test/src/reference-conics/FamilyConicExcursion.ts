import fs from "node:fs/promises";
import path from "node:path";
import type { FamilyConicSection as C } from "./FamilyConicSection";
import { FamilyConicSource as R } from "./FamilyConicSource";

/**
 * Cuts a part that stands out of its host as an excursion of the host's level sections (an auricle out of the head, a nose's wing out of
 * the face) into closed sections of its own skin, the front end of a conversion that fits them as sections with inflections, not as hulls.
 *
 * For each level plane of the part's height range the reference head is cut by that plane. The reference's own lofting lines are these level
 * cuts: `.references/curves/f1` holds them fitted, but between 1,556 and 1,580 mm only 4 to 10 mm apart, so this cuts the same mesh in the
 * same planes at the part's own spacing. In each plane:
 * - the host's line across the part's box is a quadratic fitted to the host's cut on either side of the box;
 * - the excursion is the run of the cut inside the box between the first and last points standing farther than `threshold` out of that line
 *   (first pass); those roots jump where a shallow feature stands just past it (the tragus), so the second pass cuts every plane between the
 *   median roots of the planes within `ROOT_WINDOW` stations of it;
 * - the excursion is closed across its root along the host's line sunk `sink` mm into the host, so the part can be merged onto the host along
 *   one loop; a plane that cuts the part as a loop of its own (a free lobule) takes that loop.
 * Each section is counter-clockwise in its chart, and carries three landmarks (its back-most inmost, outermost and front-most inmost points)
 * and the points where its turning changes sign, read on the cut itself, so a back end can place the same layout's anchors at every station.
 *
 * Usage (from `test`): `node .shots/esbuild/FamilyConicExcursion.cjs <part>`; it writes `<part>.sections.json` under
 * `test/.shots/family-conic-excursion/<stamp>`. The reference is read only; nothing it writes enters the repository.
 */
export namespace FamilyConicExcursion {
  /** One part to cut out of its host. */
  export interface IPart {
    /** Part name. */
    name: string;

    /** Level planes from, to and step, mm of height. */
    heights: [number, number, number];

    /** The chart's origin in each plane, `[x, z]`, mm. */
    origin: [number, number];

    /** The chart's first axis in the level plane, out of the host. */
    u: R.V;

    /** The chart's second axis in the level plane, along the host, with `v x u` up so stations increase upward. */
    v: R.V;

    /** The part's box along `v`, chart mm: the excursion is read between these. */
    box: [number, number];

    /** Where the host's line is fitted, along `v`, chart mm: a band on either side of the box. */
    beside: [[number, number], [number, number]];

    /** How far out of the host's line a cut point must stand to be the part's, mm. */
    threshold: number;

    /** How far inside the host's line the root is closed, mm. */
    sink: number;
  }

  /** A plane's closed section of the part. */
  export interface ISection {
    /** The skin's points, counter-clockwise in the chart, mm. */
    points: C.P[];

    /** An excursion of the host's cut closed across its root, or a loop of its own. */
    kind: "excursion" | "loop";

    /** For an excursion, where it leaves the host's line behind and in front, chart `v`. */
    roots: [number, number] | null;
  }

  /** How many stations either side the median of the roots is read over. */
  const ROOT_WINDOW: number = 2;

  /** Least turning, radians over a window of `TURN_SPAN` mm of arclength, that counts as one sign of curvature. */
  const TURN_LEAST: number = 0.15;
  const TURN_SPAN: number = 1.5;

  /** The parts this cuts, by name; a nose's wing joins them with its own box, host band and threshold. */
  export const PARTS: IPart[] = [
    // The auricle on the +Z side: level planes through it from just over the lobule's free edge to just under the helix's top, 1.5 mm
    // apart; chart u straight out of the head (+z) and v backward (-x), so v x u is up. Its box runs from x -12 behind the helix's back to
    // x 30 in front of the tragus (`FamilyConicScan.ts ear`: the auricle spans x -6 to 26 at 78 mm out), and the head's line is fitted to
    // the cut 12 mm beyond it on either side. The threshold of 3 mm leaves the tragus (73 to 74 mm out over a head 72 to 73 mm out) to the
    // head: at 1.5 mm it was taken at some planes and not at their neighbours.
    { name: "auricle", heights: [1542, 1600.5, 1.5], origin: [9, 74], u: [0, 0, 1], v: [-1, 0, 0], box: [-21, 21], beside: [[-33, -21], [21, 33]], threshold: 3, sink: 4 },
  ];

  /** Cut every plane of a part out of the reference head. */
  export function sections(source: R.ISource, part: IPart): { y: number; section: ISection | null }[] {
    const [from, to, step] = part.heights;
    const heights: number[] = [];
    for (let y: number = from; y <= to + 1e-9; y += step) heights.push(round(y));
    const read: (y: number) => ISection | null = reader(source, part);
    return heights.map((y: number) => ({ y, section: read(y) }));
  }

  /**
   * A reader of the part's section at any height: the first pass reads the roots at the part's own planes once, and each later plane is cut
   * between the median roots of those planes within `ROOT_WINDOW` steps of it, so a fit may read its sections at its own stations.
   */
  export function reader(source: R.ISource, part: IPart): (y: number) => ISection | null {
    const [from, to, step] = part.heights;
    return along(source, part, (y: number) => ({ origin: [part.origin[0], y, part.origin[1]], u: part.u, v: part.v }), from, to, step);
  }

  /**
   * The same reader on any course: the section at station `s` is cut in the plane `frameAt(s)`, in that frame's chart, the roots read at the
   * stations from `from` to `to`, `step` apart. A course that leans or turns, so its planes are no longer level, still cuts the same
   * excursion; its course point must lie inside every section a family fitted to the skin reads.
   */
  export function along(source: R.ISource, part: IPart, frameAt: (s: number) => { origin: R.V; u: R.V; v: R.V }, from: number, to: number, step: number): (s: number) => ISection | null {
    const loopsAt = (y: number): C.P[][] => R.loops(source.head, frameAt(y));
    const rooted: { y: number; roots: [number, number] }[] = [];
    for (let y: number = from; y <= to + 1e-9; y += step) {
      const section: ISection | null = cut(loopsAt(y), part, null);
      if (section !== null && section.roots !== null) rooted.push({ y, roots: section.roots });
    }
    const median = (values: number[]): number => [...values].sort((a: number, b: number): number => a - b)[Math.floor(values.length / 2)]!;
    const limits = (y: number): [number, number] | null => {
      const near: { y: number; roots: [number, number] }[] = rooted.filter((r): boolean => Math.abs(r.y - y) <= ROOT_WINDOW * step + 1e-9);
      return near.length === 0 ? null : [median(near.map((r): number => r.roots[0])), median(near.map((r): number => r.roots[1]))];
    };
    return (y: number): ISection | null => {
      const loops: C.P[][] = loopsAt(y);
      const own: ISection | null = cut(loops, part, null);
      const at: [number, number] | null = own?.kind === "excursion" ? limits(y) : null;
      return at === null ? own : cut(loops, part, at);
    };
  }

  /**
   * The point inside a closed section farthest from its boundary (on a 0.25 mm grid, then refined), and that distance: where a course
   * through the section sees most of it, the centre of its largest inscribed circle.
   */
  export function kernel(loop: readonly C.P[]): { point: C.P; clearance: number } {
    const us: number[] = loop.map((p: C.P): number => p[0]);
    const vs: number[] = loop.map((p: C.P): number => p[1]);
    const inside = (q: C.P): boolean => {
      let c: boolean = false;
      for (let i: number = 0, j: number = loop.length - 1; i < loop.length; j = i++) {
        const a: C.P = loop[i]!;
        const b: C.P = loop[j]!;
        if (a[1] > q[1] !== b[1] > q[1] && q[0] < ((b[0] - a[0]) * (q[1] - a[1])) / (b[1] - a[1]) + a[0]) c = !c;
      }
      return c;
    };
    const clearance = (q: C.P): number => {
      let d: number = Infinity;
      for (let i: number = 0; i < loop.length; ++i) {
        const a: C.P = loop[i]!;
        const b: C.P = loop[(i + 1) % loop.length]!;
        const e: C.P = [b[0] - a[0], b[1] - a[1]];
        const l: number = e[0] * e[0] + e[1] * e[1];
        const t: number = l === 0 ? 0 : Math.max(0, Math.min(1, ((q[0] - a[0]) * e[0] + (q[1] - a[1]) * e[1]) / l));
        d = Math.min(d, Math.hypot(q[0] - a[0] - t * e[0], q[1] - a[1] - t * e[1]));
      }
      return d;
    };
    let best: { point: C.P; clearance: number } = { point: [(Math.min(...us) + Math.max(...us)) / 2, (Math.min(...vs) + Math.max(...vs)) / 2], clearance: -1 };
    for (let u: number = Math.min(...us); u <= Math.max(...us); u += 0.5)
      for (let v: number = Math.min(...vs); v <= Math.max(...vs); v += 0.5) {
        const q: C.P = [u, v];
        if (!inside(q)) continue;
        const d: number = clearance(q);
        if (d > best.clearance) best = { point: q, clearance: d };
      }
    return best;
  }

  /**
   * A section made star-shaped about the chart's origin: at `count` phases, the innermost or the outermost crossing of the ray from the origin
   * with the section, and how many of those rays crossed it more than once (zero for a section already star-shaped about the origin).
   * Innermost keeps what the origin sees first, so an overhang folding back over a groove (an auricle's helix over its scapha) is left out;
   * outermost keeps the overhang and bridges the groove under it. Null when a ray misses the section, the origin lying outside it.
   */
  export function star(loop: readonly C.P[], count: number, keep: "inner" | "outer"): { points: C.P[]; folds: number } | null {
    const points: C.P[] = [];
    let folds: number = 0;
    for (let k: number = 0; k < count; ++k) {
      const phi: number = (2 * Math.PI * k) / count;
      const d: C.P = [Math.cos(phi), Math.sin(phi)];
      const hits: number[] = [];
      for (let i: number = 0; i < loop.length; ++i) {
        const a: C.P = loop[i]!;
        const b: C.P = loop[(i + 1) % loop.length]!;
        const sa: number = a[0] * d[1] - a[1] * d[0];
        const sb: number = b[0] * d[1] - b[1] * d[0];
        if (sa > 0 === sb > 0) continue;
        const t: number = sa / (sa - sb);
        const r: number = (1 - t) * (a[0] * d[0] + a[1] * d[1]) + t * (b[0] * d[0] + b[1] * d[1]);
        if (r > 0) hits.push(r);
      }
      if (hits.length === 0) return null;
      if (hits.length > 1) ++folds;
      const r: number = keep === "inner" ? Math.min(...hits) : Math.max(...hits);
      points.push([r * d[0], r * d[1]]);
    }
    return { points, folds };
  }

  /**
   * The part's closed section in one plane's cut, or null when the plane misses it. With `limits` (behind, in front), the excursion is the
   * run between those `v`; without, between the first and last points past `threshold`.
   */
  export function cut(loops: C.P[][], part: IPart, limits: [number, number] | null): ISection | null {
    const inside = (p: C.P): boolean => p[1] > part.box[0] && p[1] < part.box[1];
    const area = (loop: readonly C.P[]): number => Math.abs(R.area(loop));

    // A loop of its own inside the box, standing out of the host: the free lobule.
    const own: C.P[][] = loops.filter((loop: C.P[]): boolean => loop.every(inside) && loop.some((p: C.P): boolean => p[0] > 0));

    // The host's loop: the largest. Its line across the box: u = a + b v + c v^2 over its points beside the box on the part's side.
    const host: C.P[] | undefined = [...loops].sort((a: C.P[], b: C.P[]): number => area(b) - area(a))[0];
    let excursion: C.P[] | null = null;
    let roots: [number, number] | null = null;
    if (host !== undefined && !host.every(inside)) {
      const beside: C.P[] = host.filter((p: C.P): boolean => p[0] > -25 && part.beside.some(([a, b]: [number, number]): boolean => p[1] >= a && p[1] <= b));
      const line: ((v: number) => number) | null = quadratic(beside);
      if (line !== null) {
        // The run of the host's loop across the box on the part's side, in the loop's own (counter-clockwise) order.
        const n: number = host.length;
        const near = (p: C.P): boolean => inside(p) && p[0] > line(p[1]) - 15;
        const startAt: number = host.findIndex((p: C.P, i: number): boolean => near(p) && !near(host[(i - 1 + n) % n]!));
        if (startAt >= 0) {
          const run: C.P[] = [];
          for (let k: number = 0; k < n && near(host[(startAt + k) % n]!); ++k) run.push(host[(startAt + k) % n]!);
          const past = (p: C.P): boolean => (limits === null ? p[0] - line(p[1]) > part.threshold : p[1] <= limits[0] && p[1] >= limits[1]);
          const out: number[] = run.map((p: C.P, i: number): number => (past(p) ? i : -1)).filter((i: number): boolean => i >= 0);
          if (out.length >= 3) {
            const piece: C.P[] = run.slice(out[0]!, out.at(-1)! + 1);
            const [a, b]: [C.P, C.P] = [piece[0]!, piece.at(-1)!];
            roots = [Math.max(a[1], b[1]), Math.min(a[1], b[1])];
            // Closed across the root along the host's line sunk into it, from the last point back to the first.
            const across: number = Math.max(2, Math.ceil(Math.abs(a[1] - b[1])));
            const sunk: C.P[] = Array.from({ length: across + 1 }, (_: unknown, k: number): C.P => {
              const v: number = b[1] + ((a[1] - b[1]) * k) / across;
              return [line(v) - part.sink, v];
            });
            excursion = [...piece, ...sunk];
          }
        }
      }
    }
    const ownLargest: C.P[] | null = own.length === 0 ? null : own.reduce((x: C.P[], y: C.P[]): C.P[] => (area(y) > area(x) ? y : x));
    if (excursion !== null && (ownLargest === null || area(excursion) >= area(ownLargest))) return { points: ccw(excursion), kind: "excursion", roots };
    return ownLargest === null ? null : { points: ccw(ownLargest), kind: "loop", roots: null };
  }

  /**
   * A counter-clockwise section's three landmarks, its back-most inmost (`v - u` greatest), outermost (`u` greatest) and front-most inmost
   * (`-v - u` greatest) points, as indices in order round it from the first.
   */
  export function landmarks(loop: readonly C.P[]): [number, number, number] {
    const best = (f: (p: C.P) => number): number => loop.reduce((b: number, p: C.P, i: number): number => (f(p) > f(loop[b]!) ? i : b), 0);
    const a: number = best((p: C.P): number => p[1] - p[0]);
    const n: number = loop.length;
    const along = (i: number): number => (i - a + n) % n;
    const m: number = best((p: C.P): number => p[0]);
    const f: number = best((p: C.P): number => -p[1] - p[0]);
    return along(f) <= along(m) ? [a, f, m] : [a, m, f];
  }

  /**
   * Where a counter-clockwise section's turning changes sign, as indices: its turning is read over a window of `TURN_SPAN` mm of arclength
   * either side of each point, and a sign counts only past `TURN_LEAST` radians, so a cut's facets do not count as inflections.
   */
  export function inflections(loop: readonly C.P[]): number[] {
    const n: number = loop.length;
    const lengths: number[] = [0];
    for (let i: number = 0; i < n; ++i) lengths.push(lengths[i]! + Math.hypot(loop[(i + 1) % n]![0] - loop[i]![0], loop[(i + 1) % n]![1] - loop[i]![1]));
    const total: number = lengths[n]!;
    const heading = (i: number): number => Math.atan2(loop[(i + 1) % n]![1] - loop[i]![1], loop[(i + 1) % n]![0] - loop[i]![0]);
    const turn = (i: number): number => {
      // Signed turning from the segment TURN_SPAN behind to the one TURN_SPAN ahead.
      let back: number = i;
      while ((lengths[i]! - lengths[back]! + total) % total < TURN_SPAN && (back - 1 + n) % n !== i) back = (back - 1 + n) % n;
      let ahead: number = i;
      while ((lengths[ahead]! - lengths[i]! + total) % total < TURN_SPAN && (ahead + 1) % n !== i) ahead = (ahead + 1) % n;
      let d: number = heading(ahead) - heading(back);
      while (d > Math.PI) d -= 2 * Math.PI;
      while (d < -Math.PI) d += 2 * Math.PI;
      return d;
    };
    const signs: number[] = loop.map((_: C.P, i: number): number => {
      const t: number = turn(i);
      return t > TURN_LEAST ? 1 : t < -TURN_LEAST ? -1 : 0;
    });
    const out: number[] = [];
    let last: number = 0;
    let lastAt: number = -1;
    for (let k: number = 0; k < 2 * n && out.length < n; ++k) {
      const i: number = k % n;
      const s: number = signs[i]!;
      if (s === 0) continue;
      if (last !== 0 && s !== last && k >= n) out.push(Math.round((lastAt + k) / 2) % n);
      last = s;
      lastAt = k;
    }
    return [...new Set(out)].sort((a: number, b: number): number => a - b);
  }

  /** Least-squares quadratic u(v) through points, or null with too few. */
  function quadratic(points: readonly C.P[]): ((v: number) => number) | null {
    if (points.length < 6) return null;
    const m: number[][] = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
    const r: number[] = [0, 0, 0];
    for (const [u, v] of points) {
      const row: number[] = [1, v, v * v];
      for (let i: number = 0; i < 3; ++i) {
        r[i]! += row[i]! * u;
        for (let j: number = 0; j < 3; ++j) m[i]![j]! += row[i]! * row[j]!;
      }
    }
    const c: number[] | null = solve(m, r);
    return c === null ? null : (v: number): number => c[0]! + c[1]! * v + c[2]! * v * v;
  }

  /** The loop counter-clockwise in the chart. */
  function ccw(loop: C.P[]): C.P[] {
    return R.area(loop) < 0 ? [...loop].reverse() : loop;
  }

  /** Gaussian elimination with partial pivoting; null when singular. */
  function solve(m: number[][], r: number[]): number[] | null {
    const n: number = r.length;
    const a: number[][] = m.map((row: number[], i: number): number[] => [...row, r[i]!]);
    for (let c: number = 0; c < n; ++c) {
      let p: number = c;
      for (let i: number = c + 1; i < n; ++i) if (Math.abs(a[i]![c]!) > Math.abs(a[p]![c]!)) p = i;
      if (Math.abs(a[p]![c]!) < 1e-12) return null;
      [a[c], a[p]] = [a[p]!, a[c]!];
      for (let i: number = 0; i < n; ++i) {
        if (i === c) continue;
        const f: number = a[i]![c]! / a[c]![c]!;
        for (let j: number = c; j <= n; ++j) a[i]![j]! -= f * a[c]![j]!;
      }
    }
    return a.map((row: number[], i: number): number => row[n]! / row[i]!);
  }

  function round(x: number): number {
    return Math.round(x * 1000) / 1000;
  }

  /** Cut the named part and write its sections with their landmarks and inflections. */
  export async function main(): Promise<void> {
    const name: string = process.argv[2] ?? "";
    const part: IPart | undefined = PARTS.find((p: IPart): boolean => p.name === name);
    if (part === undefined) throw new Error("No part " + name + "; the parts are " + PARTS.map((p: IPart): string => p.name).join(", "));
    const root: string = path.resolve(process.cwd(), "..");
    const source: R.ISource = await R.load(root);
    const rows = sections(source, part).map(({ y, section }) => {
      if (section === null) return { y, kind: null };
      const marks: [number, number, number] = landmarks(section.points);
      const bends: number[] = inflections(section.points);
      // The section's kernel point in the world, and how many rays from it cross the section more than once.
      const core: { point: C.P; clearance: number } = kernel(section.points);
      const shifted: C.P[] = section.points.map((p: C.P): C.P => [p[0] - core.point[0], p[1] - core.point[1]]);
      const world: number[] = [0, 1, 2].map((k: number): number => (k === 1 ? y : 0) + (k === 0 ? part.origin[0] : k === 2 ? part.origin[1] : 0) + core.point[0] * part.u[k]! + core.point[1] * part.v[k]!);
      process.stdout.write(JSON.stringify({ event: "excursion-section", part: part.name, y, kind: section.kind, points: section.points.length, roots: section.roots, inflections: bends.length, kernel: world.map(round), clearance: round(core.clearance), folds: star(shifted, 720, "inner")?.folds ?? -1 }) + "\n");
      return { y, kind: section.kind, roots: section.roots, landmarks: marks, inflections: bends, points: section.points };
    });
    const out: string = path.join(root, "test/.shots/family-conic-excursion", new Date().toISOString().replaceAll(":", "-"));
    await fs.mkdir(out, { recursive: true });
    await fs.writeFile(path.join(out, part.name + ".sections.json"), JSON.stringify({ part, stations: rows }));
    process.stdout.write(JSON.stringify({ event: "excursion-complete", part: part.name, out, stations: rows.filter((r): boolean => r.kind !== null).length }) + "\n");
  }
}

// Run only as its own tool: the fit tool imports the reader.
if (/FamilyConicExcursion\.c?[jt]s$/.test(process.argv[1] ?? ""))
  FamilyConicExcursion.main().catch((error: unknown): void => {
  process.stderr.write((error instanceof Error ? error.stack ?? error.message : String(error)) + "\n");
  process.exitCode = 1;
});
