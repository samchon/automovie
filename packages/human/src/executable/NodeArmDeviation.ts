import { AutoMovieLoftChain, type AutoMovieLoftFrame, type IAutoMovieLoftChain } from "@automovie/engine";

import { AutoMovieHumanArmCurveSpec } from "../generation/arm/AutoMovieHumanArmCurveSpec";
import type { AutoMovieHumanArmSegmentFrames } from "../generation/arm/AutoMovieHumanArmSegmentFrames";
import type { AutoMovieHumanArmViewCurves } from "../generation/arm/AutoMovieHumanArmViewCurves";
import type { AutoMovieHumanArmViewLoft } from "../generation/arm/AutoMovieHumanArmViewLoft";
import { AutoMovieHumanFairOutline } from "../generation/arm/AutoMovieHumanFairOutline";
import type { AutoMovieHumanHandDigits } from "../generation/hand/AutoMovieHumanHandDigits";
import { NodeArmDraw } from "./NodeArmDraw";

type V3 = AutoMovieHumanArmCurveSpec.Vec3;
type V2 = [number, number];

/**
 * Deviation of the arm's lofted sections, and of each digit's outlines, from
 * f1's reference, diagnostic only; nothing here feeds generation.
 *
 * Frame: the reference is placed by bone landmarks on its own skin
 * (`NodeArmReference.placeByLandmarks`: GH shared, epicondyles, styloids),
 * never by soft-tissue centroids. Every 2 mm of each segment's walk, the
 * loft's own section plane (the chain's frame at that station) cuts the
 * placed reference mesh into closed loops, and the loop enclosing the
 * chain's axis point is f1's section there; the model's section is the
 * chain's actual ring. Shape is compared about each section's own box centre
 * (half the difference of its extents along the segment's lateral and
 * anterior directions), so a placement offset never reads as shape; the
 * centres are reported separately. Eight curves are read: the four guides
 * (the outlines: lateral, anterior, medial, posterior) and the four
 * diagonals between them (the fullness), each as the ray's farthest crossing
 * from the centre. Deviation is the model less the reference: positive is
 * fuller.
 */
export namespace NodeArmDeviation {
  /** One curve's deviation. */
  export interface IRow {
    /** `<segment>.<curve>`, or `digit.<n>.<side>`. */
    curve: string;

    /** The view that sees it. */
    view: "front" | "side" | "top";

    /** Stations read. */
    samples: number;

    /** Stations without an enclosing reference loop. */
    uncovered: number;

    /** Largest absolute deviation, mm. */
    max: number;

    /** Mean absolute deviation, mm. */
    mean: number;

    /** Mean signed deviation, mm (positive: the model is fuller). */
    signed: number;

    /** Walk station of the largest deviation and its signed value. */
    worst: { at: number; deviation: number };
  }

  /** One section's box centre, model and reference, from the chain's axis point along the segment's lateral and anterior directions, mm. */
  export interface ICentre {
    /** Segment. */ segment: string;
    /** Walk station. */ walk: number;
    /** The model's centre. */ model: V2;
    /** The reference's. */ reference: V2;
  }

  /** One sampled pair for drawing, world mm. */
  export interface IPair {
    /** The view. */ view: "front" | "side" | "top";
    /** The model's point. */ ours: V3;
    /** The reference's. */ reference: V3;
    /** Signed deviation, mm. */ deviation: number;
  }

  /** The arm's build parts this reads. */
  export interface IBuild {
    /** The segment frames. */
    frames: AutoMovieHumanArmSegmentFrames.IOutput;

    /** The view curves: segments and girth sites. */
    curves: AutoMovieHumanArmViewCurves.IOutput;

    /** The loft: its station map. */
    loft: AutoMovieHumanArmViewLoft.IOutput;

    /** The lofted chain. */
    chain: IAutoMovieLoftChain | null;

    /** The digits with their outline knots. */
    digits: readonly AutoMovieHumanHandDigits.IDigit[];

    /** World placement of the humerus frame. */
    root: AutoMovieHumanArmCurveSpec.ITransform;
  }

  /** The placed reference mesh, world mm. */
  export interface IMesh {
    /** Vertices. */
    points: readonly V3[];

    /** Triangles as indices into `points`. */
    triangles: readonly [number, number, number][];
  }

  /** The eight curves: name, view and direction in the section's (lateral, anterior) chart. */
  export const CURVES: readonly [string, "front" | "side" | "top", V2][] = [
    ["lateral", "front", [1, 0]],
    ["anterior-lateral diagonal", "top", [Math.SQRT1_2, Math.SQRT1_2]],
    ["anterior", "side", [0, 1]],
    ["anterior-medial diagonal", "top", [-Math.SQRT1_2, Math.SQRT1_2]],
    ["medial", "front", [-1, 0]],
    ["posterior-medial diagonal", "top", [-Math.SQRT1_2, -Math.SQRT1_2]],
    ["posterior", "side", [0, -1]],
    ["posterior-lateral diagonal", "top", [Math.SQRT1_2, -Math.SQRT1_2]],
  ];

  /** Every row, the centres and the sampled pairs. */
  export function measure(b: IBuild, mesh: IMesh): { rows: IRow[]; centres: ICentre[]; pairs: IPair[] } {
    const rows: IRow[] = [];
    const centres: ICentre[] = [];
    const pairs: IPair[] = [];
    if (mesh.points.length === 0) return { rows, centres, pairs };
    sections(b, mesh, rows, centres, pairs);
    digits(b, mesh, rows, pairs);
    return { rows, centres, pairs };
  }

  /** The chain's sections against the reference's, per segment and curve. */
  function sections(b: IBuild, mesh: IMesh, rows: IRow[], centres: ICentre[], pairs: IPair[]): void {
    const S: typeof AutoMovieHumanArmCurveSpec = AutoMovieHumanArmCurveSpec;
    const chain: IAutoMovieLoftChain | null = b.chain;
    if (chain === null) return;
    const around: number[] = Array.from({ length: 360 }, (_: unknown, k: number): number => (2 * Math.PI * k) / 360);
    // Above the axilla level the arm's skin and the chest's are one surface: the humerus rows stop there.
    const axilla: number = b.curves.sites.find((s: AutoMovieHumanArmViewCurves.ISite): boolean => s.name === "axilla level")?.walk ?? -Infinity;
    for (const seg of b.curves.segments) {
      const t: AutoMovieHumanArmCurveSpec.ITransform = b.frames.chain(seg.frame, b.root);
      const lateral: V3 = S.rotate(t, seg.lateral);
      const anterior: V3 = S.rotate(t, seg.anterior);
      const reads: [number, number][][] = CURVES.map((): [number, number][] => []);
      let uncovered: number = 0;
      const first: number = seg.name === "humerus" ? Math.max(seg.interval[0], axilla) : seg.interval[0];
      for (let w: number = first + 1; w < seg.interval[1]; w += 2) {
        const s: number = b.loft.station(w);
        const f: AutoMovieLoftFrame.IFrame = AutoMovieLoftChain.frame(chain, s);
        const centre: V3 = AutoMovieLoftChain.axis(chain, s) as V3;
        const normal: V3 = S.unit(S.cross(f.u, f.v));
        // The section chart: the segment's lateral and anterior directions in the loft's plane.
        const x: V3 = S.unit(NodeArmDraw.sub(lateral, NodeArmDraw.scale(normal, S.dot(lateral, normal))));
        const a: V3 = NodeArmDraw.sub(anterior, NodeArmDraw.scale(normal, S.dot(anterior, normal)));
        const y: V3 = S.unit(NodeArmDraw.sub(a, NodeArmDraw.scale(x, S.dot(a, x))));
        const loop: V2[] | null = enclosing(cut(mesh, centre, normal, x, y));
        if (loop === null) {
          ++uncovered;
          continue;
        }
        const ring: V2[] = (AutoMovieLoftChain.ring(chain, s, around) as V3[]).map((p: V3): V2 => {
          const d: V3 = NodeArmDraw.sub(p, centre);
          return [S.dot(d, x), S.dot(d, y)];
        });
        const mc: V2 = boxCentre(ring);
        const rc: V2 = boxCentre(loop);
        centres.push({ segment: seg.name, walk: w, model: mc, reference: rc });
        const model: V2[] = ring.map((p: V2): V2 => [p[0] - mc[0], p[1] - mc[1]]);
        const reference: V2[] = loop.map((p: V2): V2 => [p[0] - rc[0], p[1] - rc[1]]);
        CURVES.forEach(([, view, dir]: readonly [string, "front" | "side" | "top", V2], k: number): void => {
          const ours: number | null = ray(model, dir);
          const theirs: number | null = ray(reference, dir);
          if (ours === null || theirs === null) return;
          reads[k]!.push([w, ours - theirs]);
          const at = (c: V2, r: number): V3 => NodeArmDraw.add(centre, NodeArmDraw.add(NodeArmDraw.scale(x, c[0] + r * dir[0]), NodeArmDraw.scale(y, c[1] + r * dir[1])));
          pairs.push({ view, ours: at(mc, ours), reference: at(rc, theirs), deviation: ours - theirs });
        });
      }
      CURVES.forEach(([name, view]: readonly [string, "front" | "side" | "top", V2], k: number): void => {
        rows.push(row(`${seg.name}.${name}`, view, reads[k]!, uncovered));
      });
    }
  }

  /** Digits: each digit's half-breadth on both lateral sides and half-depth on both v sides every 1 mm, against the reference loop enclosing the digit's axis, about each section's own centre. */
  function digits(b: IBuild, mesh: IMesh, rows: IRow[], pairs: IPair[]): void {
    for (const d of b.digits) {
      const front: { q: number[]; jets: AutoMovieHumanFairOutline.IJet[] } = jets(d.knots);
      const side: { q: number[]; jets: AutoMovieHumanFairOutline.IJet[] } = jets(d.depth);
      const sides: [string, V2, { q: number[]; jets: AutoMovieHumanFairOutline.IJet[] }][] = [
        ["lateral", [1, 0], front],
        ["medial", [-1, 0], front],
        ["v", [0, 1], side],
        ["-v", [0, -1], side],
      ];
      const reads: [number, number][][] = [[], [], [], []];
      let uncovered: number = 0;
      for (let s: number = 1; s < d.length - 1; s += 1) {
        const centre: V3 = NodeArmDraw.add(d.root, NodeArmDraw.scale(d.axes.distal, s));
        const loop: V2[] | null = enclosing(cut(mesh, centre, d.axes.distal, d.axes.lateral, d.axes.v));
        if (loop === null) {
          ++uncovered;
          continue;
        }
        const rc: V2 = boxCentre(loop);
        const half: number[] = sides.map(([, , outline]: [string, V2, { q: number[]; jets: AutoMovieHumanFairOutline.IJet[] }]): number => AutoMovieHumanFairOutline.evaluate(outline.q, outline.jets, -Math.sqrt(Math.max(0, d.length - s)))[0]);
        const mc: V2 = [(half[0]! - half[1]!) / 2, (half[2]! - half[3]!) / 2];
        sides.forEach(([, along]: [string, V2, unknown], k: number): void => {
          const ours: number = half[k]! - (along[0] * mc[0] + along[1] * mc[1]);
          const theirs: number = Math.max(...loop.map((p: V2): number => (p[0] - rc[0]) * along[0] + (p[1] - rc[1]) * along[1]));
          const dir: V3 = NodeArmDraw.add(NodeArmDraw.scale(d.axes.lateral, along[0]), NodeArmDraw.scale(d.axes.v, along[1]));
          reads[k]!.push([s, ours - theirs]);
          pairs.push({ view: k < 2 ? "front" : "side", ours: NodeArmDraw.add(centre, NodeArmDraw.scale(dir, half[k]!)), reference: NodeArmDraw.add(centre, NodeArmDraw.scale(dir, theirs + along[0] * rc[0] + along[1] * rc[1])), deviation: ours - theirs });
        });
      }
      sides.forEach(([name]: [string, V2, unknown], k: number): void => {
        rows.push(row(`${d.name}.${name}`, k < 2 ? "front" : "side", reads[k]!, uncovered));
      });
    }
  }

  /**
   * The mesh's section enclosing a point: the plane through `centre` normal to
   * `normal` cuts the mesh into closed loops in the plane's `(x, y)`
   * coordinates about `centre`, and the innermost loop around `centre` is
   * returned, or null when none encloses it.
   */
  export function section(mesh: IMesh, centre: V3, normal: V3, x: V3, y: V3): V2[] | null {
    return enclosing(cut(mesh, centre, normal, x, y));
  }

  /** The mesh's section by the plane through `centre` normal to `normal`: closed loops in the plane's `(x, y)` coordinates. */
  export function cut(mesh: IMesh, centre: V3, normal: V3, x: V3, y: V3): V2[][] {
    const S: typeof AutoMovieHumanArmCurveSpec = AutoMovieHumanArmCurveSpec;
    const height: (i: number) => number = (i: number): number => S.dot(NodeArmDraw.sub(mesh.points[i]!, centre), normal);
    const point: Map<string, V2> = new Map();
    const links: Map<string, string[]> = new Map();
    const crossing = (a: number, b: number, ha: number, hb: number): string => {
      const name: string = a < b ? `${a}/${b}` : `${b}/${a}`;
      if (!point.has(name)) {
        const p: V3 = NodeArmDraw.add(mesh.points[a]!, NodeArmDraw.scale(NodeArmDraw.sub(mesh.points[b]!, mesh.points[a]!), ha / (ha - hb)));
        const d: V3 = NodeArmDraw.sub(p, centre);
        point.set(name, [S.dot(d, x), S.dot(d, y)]);
      }
      return name;
    };
    for (const [a, b, c] of mesh.triangles) {
      const h: number[] = [height(a), height(b), height(c)];
      const above: boolean[] = h.map((v: number): boolean => v >= 0);
      if (above[0] === above[1] && above[1] === above[2]) continue;
      const ids: number[] = [a, b, c];
      const ends: string[] = [];
      for (let k: number = 0; k < 3; ++k) if (above[k] !== above[(k + 1) % 3]) ends.push(crossing(ids[k]!, ids[(k + 1) % 3]!, h[k]!, h[(k + 1) % 3]!));
      if (ends.length !== 2) continue;
      const [p, q]: string[] = ends;
      links.set(p!, [...(links.get(p!) ?? []), q!]);
      links.set(q!, [...(links.get(q!) ?? []), p!]);
    }
    const loops: V2[][] = [];
    const seen: Set<string> = new Set();
    for (const start of links.keys()) {
      if (seen.has(start)) continue;
      const loop: V2[] = [];
      let previous: string | null = null;
      let current: string | undefined = start;
      while (current !== undefined && !seen.has(current)) {
        seen.add(current);
        loop.push(point.get(current)!);
        const next: string | undefined = (links.get(current) ?? []).find((n: string): boolean => n !== previous && !seen.has(n));
        previous = current;
        current = next;
      }
      if (loop.length >= 3) loops.push(loop);
    }
    return loops;
  }

  /** The innermost loop enclosing the plane's origin, by ray parity; null when none does. */
  function enclosing(loops: V2[][]): V2[] | null {
    let best: V2[] | null = null;
    let area: number = Infinity;
    for (const loop of loops) {
      let inside: boolean = false;
      let twice: number = 0;
      for (let k: number = 0; k < loop.length; ++k) {
        const a: V2 = loop[k]!;
        const b: V2 = loop[(k + 1) % loop.length]!;
        if (a[1] > 0 !== b[1] > 0 && a[0] + ((0 - a[1]) * (b[0] - a[0])) / (b[1] - a[1]) > 0) inside = !inside;
        twice += a[0] * b[1] - b[0] * a[1];
      }
      if (inside && Math.abs(twice) < area) {
        best = loop;
        area = Math.abs(twice);
      }
    }
    return best;
  }

  /** Half the difference of a polygon's extents along x and along y: its box centre. */
  function boxCentre(points: readonly V2[]): V2 {
    const xs: number[] = points.map((p: V2): number => p[0]);
    const ys: number[] = points.map((p: V2): number => p[1]);
    return [(Math.max(...xs) + Math.min(...xs)) / 2, (Math.max(...ys) + Math.min(...ys)) / 2];
  }

  /** The farthest crossing of the ray from the origin along unit `u` with the closed polygon, or null. */
  function ray(loop: readonly V2[], u: V2): number | null {
    let far: number | null = null;
    for (let k: number = 0; k < loop.length; ++k) {
      const a: V2 = loop[k]!;
      const b: V2 = loop[(k + 1) % loop.length]!;
      const e: V2 = [b[0] - a[0], b[1] - a[1]];
      const den: number = u[0] * e[1] - u[1] * e[0];
      if (den === 0) continue;
      const t: number = (a[0] * e[1] - a[1] * e[0]) / den;
      const s: number = (a[0] * u[1] - a[1] * u[0]) / den;
      if (t > 0 && s >= 0 && s <= 1) far = Math.max(far ?? 0, t);
    }
    return far;
  }

  function jets(knots: readonly AutoMovieHumanHandDigits.IKnot[]): { q: number[]; jets: AutoMovieHumanFairOutline.IJet[] } {
    return {
      q: knots.map((k: AutoMovieHumanHandDigits.IKnot): number => k.q),
      jets: knots.map((k: AutoMovieHumanHandDigits.IKnot): AutoMovieHumanFairOutline.IJet => ({ value: k.value, first: k.first, second: k.second })),
    };
  }

  function row(curve: string, view: IRow["view"], read: [number, number][], uncovered: number): IRow {
    if (read.length === 0) return { curve, view, samples: 0, uncovered, max: NaN, mean: NaN, signed: NaN, worst: { at: NaN, deviation: NaN } };
    let worst: [number, number] = read[0]!;
    for (const r of read) if (Math.abs(r[1]) > Math.abs(worst[1])) worst = r;
    return {
      curve,
      view,
      samples: read.length,
      uncovered,
      max: Math.abs(worst[1]),
      mean: read.reduce((s: number, r: [number, number]): number => s + Math.abs(r[1]), 0) / read.length,
      signed: read.reduce((s: number, r: [number, number]): number => s + r[1], 0) / read.length,
      worst: { at: worst[0], deviation: worst[1] },
    };
  }
}
