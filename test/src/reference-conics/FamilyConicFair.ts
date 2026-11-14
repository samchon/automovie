import { AutoMovieRecoveryConicApproximation as V, approximateAutoMovieRecoveryConicsAhn } from "@automovie/recovery";
import type { FamilyConicSection as C } from "./FamilyConicSection";

/**
 * The fairing step before a section's conic conversion (#3401; lofting.md, Fitting and verification: "fair each section to the scale of
 * the form, which means removing the ripples smaller than the features the form keeps ... The arcs that remain after fairing set the
 * family's layout").
 *
 * The section is read as its radius about the course point by phase, and that radius is faired as the periodic smoothing spline of
 * curvature penalty: harmonic n shrunk by 1 / (1 + (n / cut)^4), cut = girth / fairMm, so the harmonic whose wavelength is `fairMm` mm of
 * girth keeps half its amplitude and a ripple of half that wavelength a seventeenth. The faired curve's inflections are the converter's
 * breaks, and so are the two phases where an invented closure meets the skin. The conversion is Ahn's
 * (`approximateAutoMovieRecoveryConicsAhn`), unchanged. `FamilyConicSection.converted` reads its sections through `curve` at `FAIR_MM`.
 */
export namespace FamilyConicFair {
  /**
   * Fairing cutoff of a trunk section before its conversion, mm of girth: the wavelength the fairing halves. lofting.md: "fair each section to
   * the scale of the form, which means removing the ripples smaller than the features the form keeps". f1's ripple is its facets': the
   * sections' turning per unit arclength peaks at 9 to 14 mm of wavelength on the trunk (the median of each 100 mm stretch). The narrowest
   * grooves the form keeps, the linea alba's and the sternal groove's, are 12 to 20 mm wide. A cutoff at the grooves' upper width takes a
   * 14 mm ripple to a fifth while the front median and back grooves keep their inflections on the chest (450 to 600 mm), and on the abdomen (300 to 400 mm) it leaves
   * 2.4 inflections on a side's back quarter where the least-squares cubic B-spline with a control every 6 mm left 11.8: that ripple, cut
   * by the converter into arcs at every inflection, spent its arc budget and the rest of the turn was dropped (a partial conversion).
   * Another region sets its own cutoff from its own narrowest kept feature (`FamilyConicConvert.cutoff`).
   */
  export const FAIR_MM: number = 20;

  /**
   * Radius of a closed polygon along one ray from the chart origin.
   *
   * A star-shaped section meets every ray once. Where a faceted source meets
   * it more than once the outermost hit is returned and `folds` counts the
   * event, so the caller reports the non-star interval instead of losing it.
   */
  export function radius(points: readonly C.P[], phi: number, folds?: { count: number }): number {
    const d: C.P = [Math.cos(phi), Math.sin(phi)];
    let best: number = NaN;
    let hits: number = 0;
    for (let i: number = 0; i < points.length; ++i) {
      const a: C.P = points[i]!;
      const b: C.P = points[(i + 1) % points.length]!;
      const sa: number = a[0] * d[1] - a[1] * d[0];
      const sb: number = b[0] * d[1] - b[1] * d[0];
      if ((sa > 0) === (sb > 0)) continue;
      const t: number = sa / (sa - sb);
      const r: number = (1 - t) * (a[0] * d[0] + a[1] * d[1]) + t * (b[0] * d[0] + b[1] * d[1]);
      if (!(r > 0)) continue;
      ++hits;
      if (!(best >= r)) best = r;
    }
    if (hits > 1 && folds !== undefined) ++folds.count;
    return best;
  }

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
    /** Phase of its start inflection, radians. */
    from: number;

    /** Phase of its end inflection, radians. */
    to: number;

    /** Phase of its floor, the point farthest inside the chord of its inflections, radians. */
    floor: number;

    /** Its whole inward turn, radians. */
    turn: number;

    /** Its depth, mm: how far its floor lies inside the chord of its two inflections. */
    depthMm: number;
  }

  /** A faired section's conversion. */
  export interface IConversion {
    /** The converter's status: complete, partial or refused. */
    status: V.IResult["status"];

    /** The converter's largest sampled error against the faired section, mm. */
    errorMm: number;

    /** The converted arcs in phase order. */
    arcs: IArc[];

    /** Its grooves, every maximal run of inward skin arcs, in phase order. */
    grooves: IGroove[];

    /** The faired radius's largest departure from the source's, mm, over 720 phases. */
    fairMaxMm: number;

    /** The faired radius's mean departure from the source's, mm, over 720 phases. */
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

    /** The fairing cutoff wavelength, mm of girth; default `FAIR_MM`. */
    fairMm?: number;

    /**
     * Each invented closure's phases, radians, where it leaves and rejoins the skin, running counter-clockwise from the first to the second:
     * one for a part closed across its root, two for a trunk loop closed across both arm cuts.
     */
    closures?: readonly (readonly [number, number])[];
  }

  /** Sampled phases of the radius. */
  const M: number = 720;

  /** The converter's work limits, as `FamilyConicSection.converted` sets them. */
  const LIMITS: { maximumArcs: number; maximumDepth: number } = { maximumArcs: 256, maximumDepth: 16 };

  /**
   * The closed curve's seam, where the converter starts and ends, at an eighth of a turn: started on the median line (phase 0), the
   * converter cut dozens of short arcs there whose bends flipped sign, a concavity and inflections on the front median of a section with
   * none (f1's made falling groove at 0 mm).
   */
  const SEAM: number = Math.PI / 4;

  const wrap = (x: number): number => ((x % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);

  /** The faired section as the converter's source: radius by phase about the origin, faired; breaks at its inflections and the closure's ends. */
  export function curve(points: readonly C.P[], options: Pick<IOptions, "fairMm" | "closures"> = {}): V.ICurve & { radius: (phi: number) => number; girth: number } {
    const fairMm: number = options.fairMm ?? FAIR_MM;
    const radii: number[] = Array.from({ length: M }, (_: unknown, k: number): number => radius(points, (2 * Math.PI * k) / M));
    let girth: number = 0;
    for (let i: number = 0; i < points.length; ++i) girth += Math.hypot(points[(i + 1) % points.length]![0] - points[i]![0], points[(i + 1) % points.length]![1] - points[i]![1]);
    // The periodic smoothing spline that penalises the radius's second derivative is, in the trigonometric basis, each harmonic n of the
    // data shrunk by 1 / (1 + lambda n^4) (Wahba, Spline Models for Observational Data, 1990, ch. 2, the periodic space W2), a roll-off that
    // passes the form and halves the harmonic whose wavelength is the cutoff: lambda = (fairMm / girth)^4. A least-squares spline on
    // fixed controls has no such cutoff: at a control every 6 mm it followed f1's facets.
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
    // r's derivative of an order: each harmonic's a cos + b sin turned by the order's quarter turns, its own number to the order a factor.
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
    // The curve p(phi) = r(phi) e(phi), e = (cos, sin): its derivatives by Leibniz's rule, e's k-th derivative being e turned by k quarter turns.
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
    // The faired curve's inflections, the sign changes of cross(p', p''), are the converter's breaks: it never fits an interval whose
    // curvature changes sign, so without them it bisects toward each inflection to its depth limit and a section of 28 spent its arc budget
    // (f1's chest at a 20 mm fairing). Recovery's own cubic adapter hands it the same roots (`AutoMovieRecoveryConicApproximation`
    // `.ICubicCriticalParameters`). The faired radius is a trigonometric polynomial of degree H, so the numerator is one of degree 2H, with
    // at most 4H roots a turn; each is bracketed on 16H samples and bisected to the double's resolution. On a straight stretch the curvature
    // is a residue of the harmonics past the cutoff, 1e-6 to 1e-5 a millimetre on f1's chest, whose sign flips every 0.3 to 0.7 degrees:
    // bracketed on eight samples a cutoff wavelength those roots went unseen, the converter met them inside its intervals, refused and
    // bisected, and 16 of 443 sections ran out of arcs. A pair of them costs two short arcs.
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
    for (const end of (options.closures ?? []).flat()) {
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
      const raw: number = radius(points, phi, folds);
      if (!Number.isFinite(raw)) continue;
      const off: number = Math.abs(source.radius(phi) - raw);
      fairMax = Math.max(fairMax, off);
      fairSum += off;
      ++fairCount;
    }
    const result: V.IResult = approximateAutoMovieRecoveryConicsAhn(source, { toleranceMm: options.toleranceMm, ...LIMITS });
    const onClosure = (phi: number): boolean => (options.closures ?? []).some(([a, b]): boolean => wrap(phi - a) < wrap(b - a));
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
      let depth: number = 0, floor: number = (run[0]!.domain[0] + run.at(-1)!.domain[1]) / 2;
      for (const arc of run)
        for (const p of [arc.controls[2], middle(arc)]) {
          const d: number = ((b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0])) / chord;
          if (d > depth) [depth, floor] = [d, Math.atan2(p[1], p[0])];
        }
      out.push({ from: wrap(run[0]!.domain[0]), to: wrap(run.at(-1)!.domain[1]), floor: wrap(floor), turn: run.reduce((s: number, x: IArc): number => s + x.turn, 0), depthMm: depth });
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
