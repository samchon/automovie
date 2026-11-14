import { AutoMovieRecoveryConicApproximation as V, approximateAutoMovieRecoveryConicsAhn } from "@automovie/recovery";
import { FamilyConicSection as C } from "./FamilyConicSection";

/**
 * The fairing step before a section's conic conversion (#3401; lofting.md, Fitting and verification: "fair each section to the scale of
 * the form, which means removing the ripples smaller than the features the form keeps ... The arcs that remain after fairing set the
 * family's layout").
 *
 * The section is read as its radius about the course point by phase, and that radius is faired as the periodic smoothing spline of
 * curvature penalty (`FamilyConicSection.converted`, the same law and cutoff `FamilyConicSection.FAIR_MM`): harmonic n shrunk by
 * 1 / (1 + (n / cut)^4), cut = girth / FAIR_MM, so the harmonic whose wavelength is FAIR_MM mm of girth keeps half its amplitude and a
 * ripple of half that wavelength a seventeenth. The faired curve's inflections are the converter's breaks, and so are the two phases where
 * an invented closure meets the skin. The conversion is Ahn's (`approximateAutoMovieRecoveryConicsAhn`), unchanged; this file only exposes
 * the tolerance `converted` holds fixed, for the tolerance ladder, and reads the result as grooves.
 */
export namespace FamilyConicFair {
  /** One converted arc on the faired section. */
  export interface IArc {
    /** Its phase interval about the course point, radians, increasing. */
    domain: readonly [number, number];

    /** Its rational quadratic: endpoint, tangent intersection, endpoint, chart mm. */
    controls: V.IArc["controls"];

    /** Its middle weight; the shoulder `rho = w / (1 + w)`. */
    weight: number;

    /** +1 where it bends as the section does round its course (outward), -1 inward, 0 a line. */
    bend: number;

    /** Its turn, radians: the angle between its control legs. */
    turn: number;

    /** Whether it lies on an invented closure. */
    closure: boolean;
  }

  /** One groove of the faired, converted section: a maximal run of inward arcs on skin. */
  export interface IGroove {
    /** Phase of its start and end inflections, radians. */
    from: number;
    to: number;

    /** Its whole inward turn, radians. */
    turn: number;

    /** Its depth, mm: how far its floor lies inside the chord of its two inflections. */
    depthMm: number;
  }

  /** A faired section's conversion. */
  export interface IConversion {
    status: V.IResult["status"];
    errorMm: number;
    arcs: IArc[];
    grooves: IGroove[];

    /** The faired radius's largest and mean departure from the source's, mm, over 720 phases. */
    fairMaxMm: number;
    fairMeanMm: number;

    /** Rays from the course that meet the source more than once, of 720: zero for a star-shaped section. */
    folds: number;

    /** The source's girth, mm. */
    girthMm: number;

    /** The converter's diagnostics, deduplicated. */
    diagnostics: string[];

    /** The faired radius by phase, mm. */
    faired: (phi: number) => number;
  }

  /** Options of a conversion. */
  export interface IOptions {
    /** The converter's sampled tolerance, mm; `FamilyConicSection`'s own conversion uses 0.25. */
    toleranceMm: number;

    /** The fairing cutoff wavelength, mm of girth; default `FamilyConicSection.FAIR_MM`. */
    fairMm?: number;

    /** The phases, radians, where an invented closure leaves and rejoins the skin; the closure runs counter-clockwise from the first to the second. */
    closure?: readonly [number, number];
  }

  /** Sampled phases of the radius. */
  const M: number = 720;

  /** The converter's work limits, as `FamilyConicSection.converted` sets them. */
  const LIMITS: { maximumArcs: number; maximumDepth: number } = { maximumArcs: 256, maximumDepth: 16 };

  /** The converter's seam, at an eighth of a turn, as `FamilyConicSection.converted` sets it (off the front median). */
  const SEAM: number = Math.PI / 4;

  const wrap = (x: number): number => ((x % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);

  /** The faired section as the converter's source: radius by phase about the origin, faired; breaks at its inflections and the closure's ends. */
  export function curve(points: readonly C.P[], options: Pick<IOptions, "fairMm" | "closure"> = {}): V.ICurve & { radius: (phi: number) => number; girth: number } {
    const fairMm: number = options.fairMm ?? C.FAIR_MM;
    const radii: number[] = Array.from({ length: M }, (_: unknown, k: number): number => C.radius(points, (2 * Math.PI * k) / M));
    let girth: number = 0;
    for (let i: number = 0; i < points.length; ++i) girth += Math.hypot(points[(i + 1) % points.length]![0] - points[i]![0], points[(i + 1) % points.length]![1] - points[i]![1]);
    const H: number = M / 2;
    const A: number[] = [], B: number[] = [], W: number[] = [];
    const cut: number = girth / fairMm;
    for (let n: number = 0; n <= H; ++n) {
      let a: number = 0, b: number = 0;
      for (let k: number = 0; k < M; ++k) {
        a += radii[k]! * Math.cos((2 * Math.PI * n * k) / M);
        b += radii[k]! * Math.sin((2 * Math.PI * n * k) / M);
      }
      const half: boolean = n === 0 || n === H;
      A.push(((half ? 1 : 2) * a) / M);
      B.push(((half ? 1 : 2) * b) / M);
      W.push(1 / (1 + (n / cut) ** 4));
    }
    const rAt = (phi: number, order: number): number => {
      const c1: number = Math.cos(phi), s1: number = Math.sin(phi);
      let c: number = 1, s: number = 0, even: number = 0, odd: number = 0;
      for (let n: number = 0; n <= H; ++n) {
        const f: number = W[n]! * n ** order;
        even += f * (A[n]! * c + B[n]! * s);
        odd += f * (B[n]! * c - A[n]! * s);
        [c, s] = [c * c1 - s * s1, s * c1 + c * s1];
      }
      return [even, odd, -even, -odd][order % 4]!;
    };
    const binomial = (n: number, k: number): number => (k === 0 || k === n ? 1 : binomial(n - 1, k - 1) + binomial(n - 1, k));
    const domain: readonly [number, number] = [SEAM, SEAM + 2 * Math.PI];
    const derivative = (phi: number, order: 1 | 2 | 3 | 4 | 5): V.Point => {
      let x: number = 0, y: number = 0;
      for (let j: number = 0; j <= order; ++j) {
        const c: number = binomial(order, j) * rAt(phi, j);
        const q: number = order - j;
        x += c * Math.cos(phi + (q * Math.PI) / 2);
        y += c * Math.sin(phi + (q * Math.PI) / 2);
      }
      return [x, y];
    };
    // The inflections, the sign changes of cross(p', p''), bracketed on 16H samples and bisected (as `FamilyConicSection.converted`).
    const breaks: number[] = [];
    const numerator = (phi: number): number => {
      const d1: V.Point = derivative(phi, 1), d2: V.Point = derivative(phi, 2);
      return d1[0] * d2[1] - d1[1] * d2[0];
    };
    const steps: number = 16 * H;
    for (let i: number = 0; i < steps; ++i) {
      let lo: number = domain[0] + (2 * Math.PI * i) / steps, hi: number = domain[0] + (2 * Math.PI * (i + 1)) / steps;
      let below: number = numerator(lo);
      if (below === 0 || Math.sign(below) === Math.sign(numerator(hi))) continue;
      for (let k: number = 0; k < 64; ++k) {
        const mid: number = (lo + hi) / 2;
        if (mid === lo || mid === hi) break;
        const value: number = numerator(mid);
        if (Math.sign(value) === Math.sign(below)) [lo, below] = [mid, value];
        else hi = mid;
      }
      const root: number = (lo + hi) / 2;
      if (root > domain[0] && root < domain[1]) breaks.push(root);
    }
    // The closure's two ends: an invented closure is no skin, so no arc spans its joint with the skin.
    for (const end of options.closure ?? []) {
      const at: number = SEAM + wrap(end - SEAM);
      if (at > domain[0] + 1e-9 && at < domain[1] - 1e-9 && !breaks.some((b: number): boolean => Math.abs(b - at) < 1e-6)) breaks.push(at);
    }
    breaks.sort((a: number, b: number): number => a - b);
    return {
      domain,
      breaks,
      closed: true,
      evaluate: (phi: number): V.Point => [rAt(phi, 0) * Math.cos(phi), rAt(phi, 0) * Math.sin(phi)],
      derivative,
      radius: (phi: number): number => rAt(phi, 0),
      girth,
    };
  }

  /** Fair a section about its course point (the chart's origin), convert it, and read its arcs as grooves. */
  export function convert(points: readonly C.P[], options: IOptions): IConversion {
    const source = curve(points, options);
    const folds: { count: number } = { count: 0 };
    let fairMax: number = 0, fairSum: number = 0, fairCount: number = 0;
    for (let k: number = 0; k < M; ++k) {
      const phi: number = (2 * Math.PI * k) / M;
      const raw: number = C.radius(points, phi, folds);
      if (!Number.isFinite(raw)) continue;
      const off: number = Math.abs(source.radius(phi) - raw);
      fairMax = Math.max(fairMax, off);
      fairSum += off;
      ++fairCount;
    }
    const result: V.IResult = approximateAutoMovieRecoveryConicsAhn(source, { toleranceMm: options.toleranceMm, ...LIMITS });
    const onClosure = (phi: number): boolean => {
      if (options.closure === undefined) return false;
      const [a, b] = options.closure;
      return wrap(phi - a) < wrap(b - a);
    };
    const arcs: IArc[] = [...result.arcs]
      .sort((p: V.IArc, q: V.IArc): number => p.domain[0] - q.domain[0])
      .map((arc: V.IArc): IArc => {
        const [p0, p1, p2] = arc.controls;
        const cross: number = (p1[0] - p0[0]) * (p2[1] - p1[1]) - (p1[1] - p0[1]) * (p2[0] - p1[0]);
        const legs: number = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) * Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
        const d: number = Math.atan2(p2[1] - p1[1], p2[0] - p1[0]) - Math.atan2(p1[1] - p0[1], p1[0] - p0[0]);
        return {
          domain: arc.domain,
          controls: arc.controls,
          weight: arc.weight,
          bend: legs > 0 && Math.abs(cross) > 1e-12 * legs ? Math.sign(cross) : 0,
          turn: Math.abs(Math.atan2(Math.sin(d), Math.cos(d))),
          closure: onClosure((arc.domain[0] + arc.domain[1]) / 2),
        };
      });
    return { status: result.status, errorMm: result.maximumSampleErrorMm, arcs, grooves: grooves(arcs), fairMaxMm: fairMax, fairMeanMm: fairSum / Math.max(1, fairCount), folds: folds.count, girthMm: source.girth, diagnostics: [...new Set(result.diagnostics.map((d: string): string => d.replace(/-?\d[\d.]*(e-?\d+)?/g, "#")))], faired: source.radius };
  }

  /** The maximal runs of inward skin arcs, round the closed chain (a line inside a run belongs to it). */
  export function grooves(arcs: readonly IArc[]): IGroove[] {
    const n: number = arcs.length;
    if (n === 0) return [];
    const inward = (k: number): boolean => {
      const a: IArc = arcs[((k % n) + n) % n]!;
      return !a.closure && a.bend < 0;
    };
    const start: number = Array.from({ length: n }, (_: unknown, k: number): number => k).find((k: number): boolean => !inward(k)) ?? -1;
    if (start < 0) return [];
    const out: IGroove[] = [];
    for (let m: number = 1; m <= n; ++m) {
      const k: number = start + m;
      if (!inward(k) || inward(k - 1)) continue;
      const run: IArc[] = [];
      for (let j: number = k; inward(j) && run.length < n; ++j) run.push(arcs[((j % n) + n) % n]!);
      const a: V.Point = run[0]!.controls[0], b: V.Point = run.at(-1)!.controls[2];
      const chord: number = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
      // The floor: the farthest of the run's arc ends and middles from the chord, on the course's side.
      let depth: number = 0;
      for (const arc of run)
        for (const p of [arc.controls[2], middle(arc)]) depth = Math.max(depth, ((b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0])) / chord);
      out.push({ from: wrap(run[0]!.domain[0]), to: wrap(run.at(-1)!.domain[1]), turn: run.reduce((s: number, x: IArc): number => s + x.turn, 0), depthMm: depth });
    }
    return out.sort((x: IGroove, y: IGroove): number => x.from - y.from);
  }

  /** The point at the middle of a rational quadratic. */
  export function middle(arc: Pick<IArc, "controls" | "weight">): V.Point {
    const [p0, p1, p2] = arc.controls;
    const w: number = arc.weight;
    return [(p0[0] + 2 * w * p1[0] + p2[0]) / (2 + 2 * w), (p0[1] + 2 * w * p1[1] + p2[1]) / (2 + 2 * w)];
  }
}
