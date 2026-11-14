import { AutoMovieNaturalSpline } from "@automovie/engine";
import { AutoMovieHumanConicSection as S } from "@automovie/human";
import type { FamilyConicFair as F } from "./FamilyConicFair";

/**
 * A family's layout and field vectors read off its faired, converted sections (#3412 stage 1, steps 4 and 5; lofting.md: "The arcs that
 * remain after fairing set the family's layout: its outline and inflection lines").
 *
 * The layout is the limb layout of a median depth with one feature run per groove line tracked along the stations (`featured`): the groove's
 * two inflections and its floor, each an `f` anchor whose numbers are fields like every other. At each station every anchor is read off the
 * converted conic chain in closed form, so no optimizer is run:
 * - an extreme (`u`, `v`) is the chain's point of greatest or least chart coordinate, where its tangent is the model's;
 * - a feature is the chain's point at the groove's inflection or floor phase with the chain's own tangent, on its frame's chord
 *   (`AutoMovieHumanConicSection.unplace`); where the line has faded at a station it stands at the phases of the nearest station that has it,
 *   on the chain there, so it lies on a convex stretch and the line never jumps;
 * - a median (`m`) is where the chain crosses the line from its neighbours' chord midpoint to their tangents' meeting, its share of that
 *   segment, as every conic's own median point stands;
 * - an arc's shoulder `rho = |M S| / |M A|` is read the same way on that arc, `S` the chain's crossing; it equals `w / (1 + w)` on an arc
 *   that is one converted conic of middle weight `w`, and it is stored as the model reads it (`AutoMovieHumanConicSection.shoulder`).
 * Along the stations each field is the linear least-squares natural cubic on shared knots (`smooth`), the representation the engine reads.
 */
export namespace FamilyConicLayout {
  /** A planar chart point, mm (`AutoMovieHumanConicSection.P`). */
  export type P = S.P;

  /** One groove line along the stations: at each station where it is seen, its two inflection phases and its floor's, radians. */
  export interface ILine {
    /** Per station index, the groove's phases, or null where it is not seen. */
    phases: ([number, number, number] | null)[];
  }

  /** A station's converted chain: its arcs in phase order (`FamilyConicFair.IArc`). */
  export type IChain = readonly F.IArc[];

  const wrap = (x: number): number => ((x % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);

  /** The point of a rational quadratic at `t`, and the direction of travel there. */
  function conic(arc: Pick<F.IArc, "controls" | "weight">, t: number): { point: P; tangent: P } {
    const [p0, p1, p2] = arc.controls;
    const w: number = arc.weight;
    const b0: number = (1 - t) ** 2, b1: number = 2 * t * (1 - t) * w, b2: number = t * t;
    const D: number = b0 + b1 + b2;
    const N: P = [b0 * p0[0] + b1 * p1[0] + b2 * p2[0], b0 * p0[1] + b1 * p1[1] + b2 * p2[1]];
    const dD: number = -2 * (1 - t) + 2 * (1 - 2 * t) * w + 2 * t;
    const dN: P = [-2 * (1 - t) * p0[0] + 2 * (1 - 2 * t) * w * p1[0] + 2 * t * p2[0], -2 * (1 - t) * p0[1] + 2 * (1 - 2 * t) * w * p1[1] + 2 * t * p2[1]];
    const d: P = [dN[0] * D - N[0] * dD, dN[1] * D - N[1] * dD];
    const l: number = Math.hypot(d[0], d[1]) || 1;
    return { point: [N[0] / D, N[1] / D], tangent: [d[0] / l, d[1] / l] };
  }

  /** The chain's point on the ray at phase `phi` from the course, and its tangent: the arc spanning that phase, bisected on its parameter. */
  export function on(chain: IChain, phi: number): { point: P; tangent: P } {
    const target: number = wrap(phi);
    // The arc whose phase interval holds the phase; the closed chain's arcs cover the whole turn.
    const index: number = Math.max(0, chain.findIndex((a: F.IArc): boolean => wrap(target - a.domain[0]) <= wrap(a.domain[1] - a.domain[0]) + 1e-12));
    const arc: F.IArc = chain[index]!;
    const start: number = Math.atan2(arc.controls[0][1], arc.controls[0][0]);
    const span: number = wrap(Math.atan2(arc.controls[2][1], arc.controls[2][0]) - start) || 2 * Math.PI;
    const want: number = Math.min(wrap(target - start), span);
    let lo: number = 0, hi: number = 1;
    for (let i: number = 0; i < 52; ++i) {
      const m: number = (lo + hi) / 2;
      const q: P = conic(arc, m).point;
      if (Math.min(wrap(Math.atan2(q[1], q[0]) - start), span) < want) lo = m;
      else hi = m;
    }
    return conic(arc, (lo + hi) / 2);
  }

  /** The chain sampled at `count` phases from `a` to `b` counter-clockwise. */
  function samples(chain: IChain, a: number, b: number, count: number): P[] {
    const span: number = wrap(b - a) || 2 * Math.PI;
    return Array.from({ length: count + 1 }, (_: unknown, k: number): P => on(chain, a + (span * k) / count).point);
  }

  /**
   * The share `lambda` at which the chain between phases `a` and `b` crosses the line `M + lambda (A - M)`, or null where it does not: the
   * reading of a median's share and of an arc's shoulder.
   */
  function crossing(chain: IChain, a: number, b: number, M: P, A: P): number | null {
    const d: P = [A[0] - M[0], A[1] - M[1]];
    const square: number = d[0] * d[0] + d[1] * d[1];
    if (!(square > 0)) return null;
    const side = (q: P): number => d[0] * (q[1] - M[1]) - d[1] * (q[0] - M[0]);
    const q: P[] = samples(chain, a, b, 96);
    for (let k: number = 0; k + 1 < q.length; ++k) {
      const s0: number = side(q[k]!), s1: number = side(q[k + 1]!);
      if (s0 === 0 || (s0 > 0) !== (s1 > 0)) {
        const t: number = s0 === s1 ? 0 : s0 / (s0 - s1);
        const x: P = [q[k]![0] + t * (q[k + 1]![0] - q[k]![0]), q[k]![1] + t * (q[k + 1]![1] - q[k]![1])];
        return ((x[0] - M[0]) * d[0] + (x[1] - M[1]) * d[1]) / square;
      }
    }
    return null;
  }

  /**
   * The family's layout: `limb(depth)` with a run of three feature anchors (inflection, floor, inflection) after the base anchor whose
   * nominal phase (an even share of the turn by its order) last precedes each line's mean phase.
   *
   * @returns The layout, its runs in the layout's order, and for each run the index of its line.
   */
  export function layout(depth: number, lines: readonly ILine[]): { layout: S.ILayout; runs: S.IFeatureRun[]; order: number[] } {
    const base: S.ILayout = S.limb(depth);
    const K: number = base.anchors.length;
    const means: number[] = lines.map((line: ILine): number => {
      const seen: [number, number, number][] = line.phases.filter((x): x is [number, number, number] => x !== null);
      return wrap(Math.atan2(seen.reduce((s: number, x): number => s + Math.sin(x[1]), 0), seen.reduce((s: number, x): number => s + Math.cos(x[1]), 0)));
    });
    const order: number[] = lines.map((_: ILine, i: number): number => i).sort((a: number, b: number): number => means[a]! - means[b]!);
    const runs: S.IFeatureRun[] = order.map((i: number): S.IFeatureRun => ({ after: Math.floor((means[i]! / (2 * Math.PI)) * K) % K, anchors: [{ kind: "f", feature: "inflection" }, { kind: "f", feature: "concave" }, { kind: "f", feature: "inflection" }] }));
    return { layout: S.featured(base, runs), runs, order };
  }

  /** A station's reading: its field vector and the arcs whose median or shoulder the chain did not cross (read as the model's middle). */
  export interface IReading {
    /** The field vector on the layout. */
    values: number[];

    /** How many medians and shoulders the chain did not cross, read as the model's middle (a median at 0.5, a shoulder at the circle's sqrt(2) - 1). */
    missed: number;
  }

  /**
   * Read one station's field vector off its converted chain (see the namespace): extremes, then features, then medians by level, then
   * shoulders.
   *
   * @param phases Each feature run's three phases at this station, in the layout's run order.
   */
  export function read(chain: IChain, target: S.ILayout, phases: readonly [number, number, number][]): IReading {
    const K: number = target.anchors.length;
    const { at, shoulders }: { at: number[]; shoulders: number } = S.offsets(target);
    const out: number[] = new Array<number>(S.units(target).length).fill(0);
    const points: (P | null)[] = new Array<P | null>(K).fill(null);
    const tangents: (P | null)[] = new Array<P | null>(K).fill(null);
    const phase: number[] = new Array<number>(K).fill(NaN);
    // Extremes: the chain sampled every eighth of a degree, refined by a golden search on the coordinate.
    const dense: { phi: number; point: P }[] = Array.from({ length: 2880 }, (_: unknown, k: number) => ({ phi: (2 * Math.PI * k) / 2880, point: on(chain, (2 * Math.PI * k) / 2880).point }));
    target.anchors.forEach((anchor: S.IAnchor, k: number): void => {
      if (anchor.kind !== "u" && anchor.kind !== "v") return;
      const axis: 0 | 1 = anchor.kind === "u" ? 0 : 1;
      const sign: number = anchor.pick === "min" ? -1 : 1;
      let best = dense[0]!;
      for (const d of dense) if (sign * d.point[axis] > sign * best.point[axis]) best = d;
      let lo: number = best.phi - (2 * Math.PI) / 2880, hi: number = best.phi + (2 * Math.PI) / 2880;
      const g: number = (Math.sqrt(5) - 1) / 2;
      for (let i: number = 0; i < 40; ++i) {
        const x1: number = hi - g * (hi - lo), x2: number = lo + g * (hi - lo);
        if (sign * on(chain, x1).point[axis] > sign * on(chain, x2).point[axis]) hi = x2;
        else lo = x1;
      }
      const p: P = on(chain, (lo + hi) / 2).point;
      points[k] = p;
      phase[k] = wrap((lo + hi) / 2);
      tangents[k] = anchor.kind === "u" ? [0, p[0] > 0 ? 1 : -1] : [p[1] > 0 ? -1 : 1, 0];
      out[at[k]!] = p[0];
      out[at[k]! + 1] = p[1];
    });
    // Features: each run's three phases, in order, on the chain with its tangent, on the frame's chord.
    let run: number = -1, j: number = 0, previous: number = 0;
    target.anchors.forEach((anchor: S.IAnchor, k: number): void => {
      if (anchor.kind !== "f") return;
      if (k === 0 || target.anchors[k - 1]!.kind !== "f") {
        ++run;
        j = 0;
        previous = 0;
      } else ++j;
      const phi: number = phases[run]![j]!;
      const got: { point: P; tangent: P } = on(chain, phi);
      const [before, after]: [number, number] = S.frame(k, target);
      const read: { values: [number, number, number]; t: number } = S.unplace(points[before]!, points[after]!, got.point, Math.atan2(got.tangent[1], got.tangent[0]), previous);
      // As the model resolves it (`along`, `place`), so the medians and shoulders read below stand on the stored feature.
      read.values[0] = S.clamp(read.values[0]);
      previous = S.along(previous, read.values[0]);
      const placed: { point: P; tangent: P } = S.place(points[before]!, points[after]!, previous, read.values[1], read.values[2]);
      points[k] = placed.point;
      tangents[k] = placed.tangent;
      phase[k] = wrap(phi);
      out[at[k]!] = read.values[0];
      out[at[k]! + 1] = read.values[1];
      out[at[k]! + 2] = read.values[2];
    });
    let missed: number = 0;
    // Medians, lower levels first, each on its resolved neighbours' triangle.
    for (const k of S.dependents(target)) {
      const [before, after]: [number, number] = S.neighbours(k, points);
      const p0: P = points[before]!, p2: P = points[after]!;
      const A: P = S.meet(p0, tangents[before]!, p2, tangents[after]!);
      const M: P = [(p0[0] + p2[0]) / 2, (p0[1] + p2[1]) / 2];
      let share: number | null = crossing(chain, phase[before]!, phase[after]!, M, A);
      if (share === null) {
        ++missed;
        share = 0.5;
      }
      share = S.clamp(share);
      out[at[k]!] = share;
      points[k] = [M[0] + share * (A[0] - M[0]), M[1] + share * (A[1] - M[1])];
      tangents[k] = [p2[0] - p0[0], p2[1] - p0[1]];
      phase[k] = wrap(Math.atan2(points[k]![1], points[k]![0]));
    }
    // Shoulders, one per arc between consecutive anchors.
    for (let j: number = 0; j < K; ++j) {
      const n: number = (j + 1) % K;
      const A: P = S.meet(points[j]!, tangents[j]!, points[n]!, tangents[n]!);
      const M: P = [(points[j]![0] + points[n]![0]) / 2, (points[j]![1] + points[n]![1]) / 2];
      let rho: number | null = crossing(chain, phase[j]!, phase[n]!, M, A);
      if (rho === null) {
        ++missed;
        rho = Math.SQRT2 - 1;
      }
      out[shoulders + j] = S.shoulder(rho, target, j);
    }
    return { values: out, missed };
  }

  /**
   * The linear least-squares natural cubic of each field on shared knots: the knot values whose natural spline (the engine's
   * `AutoMovieNaturalSpline`, which the family's reader evaluates) comes nearest the stations' values in the sum of squares. The spline is
   * linear in its knot values, so its basis is the splines of the unit vectors, and the normal equations are solved once for all fields.
   *
   * @param stations The stations, mm.
   * @param rows Each station's field vector.
   * @param knots The shared knots, mm.
   * @returns Per field, its values at the knots.
   */
  export function smooth(stations: readonly number[], rows: readonly (readonly number[])[], knots: readonly number[]): number[][] {
    const n: number = knots.length;
    const basis: number[][] = stations.map((s: number): number[] => Array.from({ length: n }, (_: unknown, j: number): number => AutoMovieNaturalSpline.evaluate(AutoMovieNaturalSpline.create([...knots], knots.map((_: number, i: number): number => (i === j ? 1 : 0))), s)));
    const normal: number[][] = Array.from({ length: n }, (_: unknown, a: number): number[] => Array.from({ length: n }, (_: unknown, b: number): number => basis.reduce((sum: number, row: number[]): number => sum + row[a]! * row[b]!, 0)));
    const fields: number = rows[0]!.length;
    return Array.from({ length: fields }, (_: unknown, f: number): number[] => {
      const rhs: number[] = Array.from({ length: n }, (_: unknown, a: number): number => basis.reduce((sum: number, row: number[], i: number): number => sum + row[a]! * rows[i]![f]!, 0));
      return solve(normal, rhs);
    });
  }

  /** Gaussian elimination with partial pivoting. */
  function solve(matrix: readonly (readonly number[])[], rhs: readonly number[]): number[] {
    const n: number = rhs.length;
    const a: number[][] = matrix.map((row: readonly number[], i: number): number[] => [...row, rhs[i]!]);
    for (let c: number = 0; c < n; ++c) {
      let pivot: number = c;
      for (let r: number = c + 1; r < n; ++r) if (Math.abs(a[r]![c]!) > Math.abs(a[pivot]![c]!)) pivot = r;
      [a[c], a[pivot]] = [a[pivot]!, a[c]!];
      for (let r: number = 0; r < n; ++r) {
        if (r === c) continue;
        const f: number = a[r]![c]! / a[c]![c]!;
        for (let k: number = c; k <= n; ++k) a[r]![k]! -= f * a[c]![k]!;
      }
    }
    return a.map((row: number[], i: number): number => row[n]! / row[i]!);
  }

  /** A field vector rounded as the family is stored: millimetres to 0.01, shares and angles to 1e-4 (`FamilyConicFit`, `stored`). */
  export function stored(values: readonly number[], target: S.ILayout): number[] {
    const units: S.Unit[] = S.units(target);
    return values.map((y: number, f: number): number => (units[f] === "mm" ? Math.round(y * 100) / 100 : Math.round(y * 1e4) / 1e4));
  }

  /**
   * Admission as the engine reads a family: every `step` mm between its first and last knot, the field vector read from the stored knots and
   * rounded as stored, resolved, and every arc's tangent lines meeting at least `margin` of its chord ahead and behind.
   *
   * @returns The stations refused, with the arc and its least meeting share, and the least meeting share over all.
   */
  export function admit(read: (s: number) => number[], target: S.ILayout, from: number, to: number, step: number, margin: number): { refused: string[]; least: number; checked: number } {
    const refused: string[] = [];
    let least: number = Infinity, checked: number = 0;
    for (let s: number = from; s <= to + 1e-9; s += step) {
      ++checked;
      const values: number[] = stored(read(s), target);
      const input = S.resolve(values, target).input;
      const n: number = input.points.length;
      let worst: number = Infinity, where: number = -1;
      for (let k: number = 0; k < n; ++k) {
        const p0 = input.points[k]!, p1 = input.points[(k + 1) % n]!, t0 = input.tangents[k]!, t1 = input.tangents[(k + 1) % n]!;
        const l0: number = Math.hypot(t0[0], t0[1]) || 1, l1: number = Math.hypot(t1[0], t1[1]) || 1;
        const u0: P = [t0[0] / l0, t0[1] / l0], u1: P = [t1[0] / l1, t1[1] / l1];
        const c: P = [p1[0] - p0[0], p1[1] - p0[1]];
        const det: number = u0[0] * u1[1] - u0[1] * u1[0];
        const chord: number = Math.hypot(c[0], c[1]) || 1;
        const side = (d: P): number => c[0] * d[1] - c[1] * d[0];
        // The meeting distances along each tangent, as shares of the chord; an arc whose tangents do not stand on opposite sides of the chord meets nowhere.
        const meeting: number = det === 0 || side(u0) * side(u1) >= 0 ? -Infinity : Math.min((c[0] * u1[1] - c[1] * u1[0]) / det, (u0[0] * c[1] - u0[1] * c[0]) / det) / chord;
        if (meeting < worst) [worst, where] = [meeting, k];
      }
      const fault: string | null = S.chain(values, target).fault;
      least = Math.min(least, worst);
      if (fault !== null || worst < margin) refused.push(`${s.toFixed(2)}: arc ${where} meets at ${Number.isFinite(worst) ? worst.toFixed(3) : "none"}${fault === null ? "" : "; " + fault.slice(0, 80)}`);
    }
    return { refused, least, checked };
  }
}
