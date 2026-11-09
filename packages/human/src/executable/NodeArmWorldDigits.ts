import { AutoMovieViewSection } from "@automovie/engine";

import { AutoMovieHumanArmCurveSpec } from "../generation/arm/AutoMovieHumanArmCurveSpec";
import { NodeArmDeviation } from "./NodeArmDeviation";
import { NodeArmDraw } from "./NodeArmDraw";

type V3 = AutoMovieHumanArmCurveSpec.Vec3;
type V2 = [number, number];
type Extents = [number, number, number, number];
type Quarters = [number, number, number, number];

/**
 * Step 1 of the owner's method for f1's digits (`node:arm-world`): each of
 * her five digits' world lines in her own pose, read off the reference.
 *
 * A digit is found where it leaves her palm: from this arm's own metacarpal
 * head posed into her pose (the frame curve of `NodeArmWorld`), planes normal
 * to the posed digit direction are cut every `STEP` mm until the loop around
 * the ray is digit-sized (under `DIGIT_AREA`, a 30 mm disc; her widest digit
 * base is the thumb's, about 24 mm); the thumb, whose pose differs most from
 * the neutral zero, falls back to the most proximal digit-sized loop on the
 * palm's lateral side in planes normal to her hand axis. From there the digit
 * is tracked to its tip: each step advances `STEP` mm along the current
 * direction, the loop around that point is the digit's, its area centroid is
 * the next centreline point, the direction is the chord over the last two
 * steps, and the lateral direction is carried along by projection (a
 * rotation-minimising frame). The tip ends where no loop surrounds the point;
 * the apex is her farthest skin point along the last direction within 10 mm
 * of the centreline.
 *
 * Each sample is the section normal to the centreline at its centroid: the
 * four outline values from the centreline (lateral toward her thumb side,
 * medial, anterior palmar, posterior dorsal) and the four quarter shoulders,
 * as the arm's. Samples whose value leaves the mean of its two neighbours by
 * more than `TOLERANCE` (her hatching, holes, touching digits) are flagged and
 * left out. The centreline's three coordinates and the eight section series
 * (shoulders as reaches in mm) are reduced together to the fewest knots whose
 * natural cubic spline holds every unflagged sample within `TOLERANCE` mm,
 * the ends and every extremum of prominence `TOLERANCE` pinned. The digit's
 * clay is the sweep of those knots' conic sections along the spline
 * centreline, closed at the apex.
 */
export namespace NodeArmWorldDigits {
  /** Sampling step along a digit, mm. */
  const STEP: number = 1.5;

  /** Knot tolerance, mm (the owner's 0.5 mm). */
  const TOLERANCE: number = 0.5;

  /** A loop below this area is one digit, mm^2 (a 30 mm disc). */
  const DIGIT_AREA: number = 700;

  /** The digit names, thumb first (the metacarpal order). */
  export const NAMES: readonly string[] = ["thumb", "index", "middle", "ring", "little"];

  /** Her hand frame at the wrist zero, world. */
  export interface IHand {
    /** The wrist zero. */ origin: V3;
    /** Unit hand axis. */ axis: V3;
    /** Unit lateral (thumb side). */ lateral: V3;
    /** Unit anterior (palmar). */ anterior: V3;
  }

  /** A digit's seed: this arm's metacarpal head and digit direction posed into her pose. */
  export interface ISeed {
    /** Metacarpal head, world. */ point: V3;
    /** Unit digit direction, world. */ direction: V3;
  }

  /** One section sample of a digit. */
  export interface ISample {
    /** Arc length along the centreline from the digit's start, mm. */ s: number;
    /** Centreline point (the section's area centroid), world. */ centre: V3;
    /** Unit direction, the section's normal. */ distal: V3;
    /** Unit lateral. */ lateral: V3;
    /** Unit anterior. */ anterior: V3;
    /** Outline values lateral, medial, anterior, posterior, mm. */ extents: Extents;
    /** Quarter shoulders lateral-posterior, posterior-medial, medial-anterior, anterior-lateral. */ shoulders: Quarters;
    /** Artifact flags, empty when sound. */ flags: string[];
  }

  /** One digit's world line. */
  export interface IDigit {
    /** Name. */ name: string;
    /** Every sample. */ samples: ISample[];
    /** Indices of the knots in `samples`. */ knots: number[];
    /** Her tip's apex, world. */ apex: V3;
    /** Largest reduction error, mm. */ worst: number;
    /** How the start was found. */ start: string;
  }

  /**
   * Extract her five digits.
   *
   * @param mesh Her hand's triangles.
   * @param hand Her hand frame.
   * @param seeds This arm's metacarpal heads and digit directions posed into her pose, thumb first.
   */
  export function extract(mesh: NodeArmDeviation.IMesh, hand: IHand, seeds: readonly ISeed[]): IDigit[] {
    const D: typeof NodeArmDraw = NodeArmDraw;
    const S: typeof AutoMovieHumanArmCurveSpec = AutoMovieHumanArmCurveSpec;
    const across = (v: V3, axis: V3): V3 => S.unit(D.sub(v, D.scale(axis, S.dot(v, axis))));
    return seeds.map((seed: ISeed, k: number): IDigit => {
      // The start: along the posed ray, the first digit-sized loop around it.
      let start: { centre: V3; direction: V3; how: string } | null = null;
      for (let t: number = 0; t <= 70 && start === null; t += STEP) {
        const c: V3 = D.add(seed.point, D.scale(seed.direction, t));
        const x: V3 = across(hand.lateral, seed.direction);
        const y: V3 = S.unit(S.cross(seed.direction, x));
        const loop: V2[] | null = NodeArmDeviation.section(mesh, c, seed.direction, x, y);
        if (loop !== null && Math.abs(area(loop)) < DIGIT_AREA) {
          const [cx, cy]: V2 = centroid(loop);
          start = { centre: D.add(c, D.add(D.scale(x, cx), D.scale(y, cy))), direction: seed.direction, how: `on the posed ray ${t.toFixed(1)} mm past the metacarpal head` };
        }
      }
      // The thumb's fallback: the most proximal digit-sized loop on the palm's lateral side, planes normal to her hand axis.
      if (start === null && k === 0) {
        const y: V3 = hand.anterior;
        for (let u: number = 20; u <= 140 && start === null; u += STEP) {
          const c: V3 = D.add(hand.origin, D.scale(hand.axis, u));
          for (const loop of NodeArmDeviation.cut(mesh, c, hand.axis, hand.lateral, y)) {
            const [cx, cy]: V2 = centroid(loop);
            if (cx > 25 && Math.abs(area(loop)) < DIGIT_AREA && Math.abs(area(loop)) > 40 && Math.hypot(cx, cy) < 90) {
              start = { centre: D.add(c, D.add(D.scale(hand.lateral, cx), D.scale(y, cy))), direction: hand.axis, how: `the most proximal lateral digit-sized loop, ${u.toFixed(1)} mm along her hand axis` };
              break;
            }
          }
        }
      }
      if (start === null) return { name: NAMES[k]!, samples: [], knots: [], apex: seed.point, worst: NaN, start: "not found" };

      // Tracking to the tip.
      const samples: ISample[] = [];
      let centre: V3 = start.centre;
      let distal: V3 = start.direction;
      let lateral: V3 = across(hand.lateral, distal);
      const path: V3[] = [centre];
      for (let i: number = 0; i < 160; ++i) {
        const anterior: V3 = S.unit(S.cross(distal, lateral));
        const loop: V2[] | null = NodeArmDeviation.section(mesh, centre, distal, lateral, anterior);
        if (loop === null || Math.abs(area(loop)) > DIGIT_AREA * 1.3) break;
        const [cx, cy]: V2 = centroid(loop);
        const c: V3 = D.add(centre, D.add(D.scale(lateral, cx), D.scale(anterior, cy)));
        // The sample: the section through the centroid, normal to the current direction.
        const own: V2[] | null = NodeArmDeviation.section(mesh, c, distal, lateral, anterior);
        if (own === null) break;
        const read: { extents: Extents; shoulders: Quarters } = measure(own);
        const s: number = samples.length === 0 ? 0 : samples[samples.length - 1]!.s + Math.hypot(...D.sub(c, samples[samples.length - 1]!.centre));
        samples.push({ s, centre: c, distal, lateral, anterior, extents: read.extents, shoulders: read.shoulders, flags: [] });
        path.push(c);
        if (Math.abs(area(own)) < 10) break;
        // The next direction: the chord over the last two steps, then a step along it.
        const back: V3 = path[Math.max(0, path.length - 3)]!;
        if (path.length >= 3) {
          const chord: V3 = S.unit(D.sub(c, back));
          if (S.dot(chord, distal) < 0.5) break;
          distal = chord;
          lateral = across(lateral, distal);
        }
        centre = D.add(c, D.scale(distal, STEP));
      }
      if (samples.length < 3) return { name: NAMES[k]!, samples, knots: samples.map((_: ISample, i: number): number => i), apex: start.centre, worst: NaN, start: start.how };

      // Her apex: the farthest skin point along the last direction within 10 mm of the centreline.
      const last: ISample = samples[samples.length - 1]!;
      let apex: V3 = last.centre;
      for (const p of mesh.points) {
        const r: V3 = D.sub(p, last.centre);
        const along: number = S.dot(r, last.distal);
        if (along > S.dot(D.sub(apex, last.centre), last.distal) && Math.hypot(...D.sub(r, D.scale(last.distal, along))) < 10 && along < 25) apex = p;
      }

      // Flags (the jump rule) and the joint reduction of the eleven series.
      const series: number[][] = [0, 1, 2].map((c: number): number[] => samples.map((x: ISample): number => x.centre[c]!));
      for (let j: number = 0; j < 4; ++j) series.push(samples.map((x: ISample): number => x.extents[j]!));
      const pairs: [number, number][] = [[0, 3], [3, 1], [1, 2], [2, 0]];
      for (let j: number = 0; j < 4; ++j) series.push(samples.map((x: ISample): number => (x.shoulders[j]! * Math.hypot(x.extents[pairs[j]![0]]!, x.extents[pairs[j]![1]]!)) / 2));
      for (let i: number = 1; i + 1 < samples.length; ++i)
        series.forEach((g: number[], j: number): void => {
          const jump: number = g[i]! - (g[i - 1]! + g[i + 1]!) / 2;
          if (Math.abs(jump) > TOLERANCE) samples[i]!.flags.push(`jump ${j < 3 ? `centre ${"xyz"[j]}` : j < 7 ? `extent ${j - 3}` : `reach ${j - 7}`} ${jump.toFixed(2)} mm`);
        });
      const kept: number[] = samples.flatMap((x: ISample, i: number): number[] => (x.flags.length === 0 || i === 0 || i === samples.length - 1 ? [i] : []));
      const reduced: { knots: number[]; worst: number } = reduce(
        samples.map((x: ISample): number => x.s),
        series,
        kept,
        [0, samples.length - 1],
        TOLERANCE,
      );
      return { name: NAMES[k]!, samples, knots: reduced.knots, apex, worst: reduced.worst, start: start.how };
    });
  }

  /** The clay of a digit's knots: its conic sections swept every millimetre along the spline centreline, closed at the apex. */
  export function sweep(digit: IDigit): [V3, V3, V3][] {
    if (digit.knots.length < 2) return [];
    const D: typeof NodeArmDraw = NodeArmDraw;
    const S: typeof AutoMovieHumanArmCurveSpec = AutoMovieHumanArmCurveSpec;
    const knots: ISample[] = digit.knots.map((i: number): ISample => digit.samples[i]!);
    const xs: number[] = knots.map((x: ISample): number => x.s);
    const of = (f: (x: ISample) => number): ((s: number) => number) => spline(xs, knots.map(f));
    const centre: ((s: number) => number)[] = [0, 1, 2].map((c: number): ((s: number) => number) => of((x: ISample): number => x.centre[c]!));
    const extents: ((s: number) => number)[] = [0, 1, 2, 3].map((j: number): ((s: number) => number) => of((x: ISample): number => x.extents[j]!));
    const shoulders: ((s: number) => number)[] = [0, 1, 2, 3].map((j: number): ((s: number) => number) => of((x: ISample): number => x.shoulders[j]!));
    const point = (s: number): V3 => [centre[0]!(s), centre[1]!(s), centre[2]!(s)];
    const end: number = xs[xs.length - 1]!;
    const rows: V3[][] = [];
    let lateral: V3 = knots[0]!.lateral;
    for (let s: number = 0; s <= end + 1e-9; s += 1) {
      const c: V3 = point(s);
      const distal: V3 = S.unit(D.sub(point(Math.min(end, s + 0.5)), point(Math.max(0, s - 0.5))));
      lateral = S.unit(D.sub(lateral, D.scale(distal, S.dot(lateral, distal))));
      const anterior: V3 = S.unit(S.cross(distal, lateral));
      const [l, m, a, p]: number[] = extents.map((f: (s: number) => number): number => Math.max(0.5, f(s)));
      const q: number[] = shoulders.map((f: (s: number) => number): number => Math.min(0.98, Math.max(0.02, f(s))));
      // Guide order lateral, posterior, medial, anterior (the arm's chart), as NodeArmWorld's rings.
      const section: AutoMovieViewSection.ISection = AutoMovieViewSection.of({ extents: [l!, p!, m!, a!] }, [q[0]!, q[1]!, q[2]!, q[3]!]);
      const down: V3 = D.scale(anterior, -1);
      rows.push(
        Array.from({ length: 48 }, (_: unknown, k: number): V3 => {
          const phi: number = (2 * Math.PI * k) / 48;
          const r: number = AutoMovieViewSection.radius(section, phi)[0];
          return D.add(c, D.add(D.scale(lateral, r * Math.cos(phi)), D.scale(down, r * Math.sin(phi))));
        }),
      );
    }
    const out: [V3, V3, V3][] = [];
    for (let i: number = 0; i + 1 < rows.length; ++i)
      for (let k: number = 0; k < 48; ++k) {
        const k1: number = (k + 1) % 48;
        out.push([rows[i]![k]!, rows[i + 1]![k]!, rows[i + 1]![k1]!], [rows[i]![k]!, rows[i + 1]![k1]!, rows[i]![k1]!]);
      }
    const tip: V3[] = rows[rows.length - 1]!;
    for (let k: number = 0; k < 48; ++k) out.push([tip[k]!, digit.apex, tip[(k + 1) % 48]!]);
    return out;
  }

  /** The literals of a digit's knots: arc length, centreline, extents and shoulders. */
  export function literals(digit: IDigit): string {
    return digit.knots
      .map((i: number): string => {
        const x: ISample = digit.samples[i]!;
        return `    { s: ${x.s.toFixed(1)}, centre: [${x.centre.map((v: number): string => v.toFixed(2)).join(", ")}], extents: [${x.extents.map((v: number): string => v.toFixed(2)).join(", ")}], shoulders: [${x.shoulders.map((v: number): string => v.toFixed(4)).join(", ")}] },`;
      })
      .join("\n");
  }

  /** Extents and quarter shoulders of a loop about its origin (a missed quarter, flat or concave, at shoulder 0). */
  function measure(loop: readonly V2[]): { extents: Extents; shoulders: Quarters } {
    const xs: number[] = loop.map((p: V2): number => p[0]);
    const ys: number[] = loop.map((p: V2): number => p[1]);
    const extents: Extents = [Math.max(...xs), -Math.min(...xs), Math.max(...ys), -Math.min(...ys)];
    const [l, m, a, p]: Extents = extents;
    const quarter = (g1: V2, e1: number, g2: V2, e2: number): number => {
      const corner: V2 = [g1[0] * e1 + g2[0] * e2, g1[1] * e1 + g2[1] * e2];
      const mid: V2 = [corner[0] / 2, corner[1] / 2];
      const toward: V2 = [corner[0] - mid[0], corner[1] - mid[1]];
      const length: number = Math.hypot(...toward);
      let far: number | null = null;
      for (let k: number = 0; k < loop.length; ++k) {
        const a0: V2 = [loop[k]![0] - mid[0], loop[k]![1] - mid[1]];
        const c0: V2 = [loop[(k + 1) % loop.length]![0] - mid[0], loop[(k + 1) % loop.length]![1] - mid[1]];
        const e: V2 = [c0[0] - a0[0], c0[1] - a0[1]];
        const u: V2 = [toward[0] / length, toward[1] / length];
        const den: number = u[0] * e[1] - u[1] * e[0];
        if (den === 0) continue;
        const t: number = (a0[0] * e[1] - a0[1] * e[0]) / den;
        const s: number = (a0[0] * u[1] - a0[1] * u[0]) / den;
        if (t > 0 && s >= 0 && s <= 1) far = Math.max(far ?? 0, t);
      }
      return far === null ? 0 : far / length;
    };
    return { extents, shoulders: [quarter([1, 0], l, [0, -1], p), quarter([0, -1], p, [-1, 0], m), quarter([-1, 0], m, [0, 1], a), quarter([0, 1], a, [1, 0], l)] };
  }

  /**
   * The fewest knots among `kept` whose natural cubic splines hold every kept
   * sample of every series within the tolerance, `pinned` and every extremum
   * of prominence at least the tolerance kept; greedy insertion of the worst.
   */
  export function reduce(xs: readonly number[], series: readonly (readonly number[])[], kept: readonly number[], pinned: readonly number[], tolerance: number): { knots: number[]; worst: number } {
    const knots: Set<number> = new Set<number>([...pinned, kept[0]!, kept[kept.length - 1]!]);
    for (const g of series) for (const j of prominent(kept.map((i: number): number => g[i]!), tolerance)) knots.add(kept[j]!);
    let worst: number = Infinity;
    while (worst > tolerance) {
      const k: number[] = [...knots].sort((a: number, b: number): number => a - b);
      worst = 0;
      let at: number = -1;
      for (const g of series) {
        const f: (x: number) => number = spline(
          k.map((i: number): number => xs[i]!),
          k.map((i: number): number => g[i]!),
        );
        for (const i of kept) {
          const e: number = Math.abs(f(xs[i]!) - g[i]!);
          if (e > worst) {
            worst = e;
            at = i;
          }
        }
      }
      if (worst > tolerance) knots.add(at);
    }
    return { knots: [...knots].sort((a: number, b: number): number => a - b), worst };
  }

  /** Indices of the local extrema of `values` whose topographic prominence is at least `floor`. */
  export function prominent(values: readonly number[], floor: number): number[] {
    const out: number[] = [];
    for (const sign of [1, -1]) {
      const v: number[] = values.map((x: number): number => sign * x);
      for (let i: number = 1; i + 1 < v.length; ++i) {
        if (!(v[i]! >= v[i - 1]! && v[i]! > v[i + 1]!)) continue;
        let left: number = v[i]!;
        for (let j: number = i - 1; j >= 0 && v[j]! <= v[i]!; --j) left = Math.min(left, v[j]!);
        let right: number = v[i]!;
        for (let j: number = i + 1; j < v.length && v[j]! <= v[i]!; ++j) right = Math.min(right, v[j]!);
        if (v[i]! - Math.max(left, right) >= floor) out.push(i);
      }
    }
    return out;
  }

  /** The natural cubic spline through (xs, ys), xs increasing (minimum bending energy through the knots). */
  export function spline(xs: readonly number[], ys: readonly number[]): (x: number) => number {
    const n: number = xs.length;
    if (n < 3) return (x: number): number => ys[0]! + ((ys[n - 1]! - ys[0]!) * (x - xs[0]!)) / (xs[n - 1]! - xs[0]! || 1);
    const h: number[] = Array.from({ length: n - 1 }, (_: unknown, i: number): number => xs[i + 1]! - xs[i]!);
    // Second derivatives M with M0 = M(n-1) = 0: tridiagonal (Thomas).
    const a: number[] = new Array<number>(n).fill(0);
    const b: number[] = new Array<number>(n).fill(1);
    const c: number[] = new Array<number>(n).fill(0);
    const d: number[] = new Array<number>(n).fill(0);
    for (let i: number = 1; i + 1 < n; ++i) {
      a[i] = h[i - 1]!;
      b[i] = 2 * (h[i - 1]! + h[i]!);
      c[i] = h[i]!;
      d[i] = 6 * ((ys[i + 1]! - ys[i]!) / h[i]! - (ys[i]! - ys[i - 1]!) / h[i - 1]!);
    }
    for (let i: number = 1; i < n; ++i) {
      const m: number = a[i]! / b[i - 1]!;
      b[i] = b[i]! - m * c[i - 1]!;
      d[i] = d[i]! - m * d[i - 1]!;
    }
    const M: number[] = new Array<number>(n).fill(0);
    for (let i: number = n - 1; i >= 0; --i) M[i] = (d[i]! - c[i]! * (M[i + 1] ?? 0)) / b[i]!;
    return (x: number): number => {
      let i: number = 0;
      while (i + 2 < n && x > xs[i + 1]!) ++i;
      const t: number = x - xs[i]!;
      const u: number = xs[i + 1]! - x;
      const hi: number = h[i]!;
      return (M[i]! * u * u * u + M[i + 1]! * t * t * t) / (6 * hi) + (ys[i]! / hi - (M[i]! * hi) / 6) * u + (ys[i + 1]! / hi - (M[i + 1]! * hi) / 6) * t;
    };
  }

  /** Signed area of a closed polygon. */
  function area(loop: readonly V2[]): number {
    let twice: number = 0;
    for (let k: number = 0; k < loop.length; ++k) {
      const p: V2 = loop[k]!;
      const q: V2 = loop[(k + 1) % loop.length]!;
      twice += p[0] * q[1] - q[0] * p[1];
    }
    return twice / 2;
  }

  /** The area centroid of a closed polygon. */
  export function centroid(loop: readonly V2[]): V2 {
    let twice: number = 0;
    let cx: number = 0;
    let cy: number = 0;
    for (let k: number = 0; k < loop.length; ++k) {
      const p: V2 = loop[k]!;
      const q: V2 = loop[(k + 1) % loop.length]!;
      const cross: number = p[0] * q[1] - q[0] * p[1];
      twice += cross;
      cx += (p[0] + q[0]) * cross;
      cy += (p[1] + q[1]) * cross;
    }
    return [cx / (3 * twice), cy / (3 * twice)];
  }
}
