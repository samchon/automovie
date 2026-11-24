import type {
  AutoMovieVector3Tuple,
  IAutoMovieConstructionBandEdge,
  IAutoMovieConstructionPortField,
  IAutoMovieSolidSurface,
  IAutoMovieViewHermite,
  IAutoMovieViewPart,
} from "@automovie/interface";
import { AutoMovieConstructionPortBand as PortBand } from "./AutoMovieConstructionPortBand";
import { AutoMovieConstructionPortField as Field } from "./AutoMovieConstructionPortField";
import { AutoMovieConstructionSplitContinuation as Continuation } from "./AutoMovieConstructionSplitContinuation";
import { AutoMovieConstructionSplitFork as Fork } from "./AutoMovieConstructionSplitFork";
import { AutoMovieNaturalSpline } from "./AutoMovieNaturalSpline";
import { AutoMovieSolidVector } from "./AutoMovieSolidVector";
import { AutoMovieViewHermite } from "./AutoMovieViewHermite";

/** World point or derivative, mm. */
type Vec3 = AutoMovieVector3Tuple;
const { combine, scale, sub } = AutoMovieSolidVector;

/** An exact line, plus any correction of its transverse derivative. */
type LineJet = {
  p: Vec3;
  d1: Vec3;
  d2: Vec3;
  across?: { p: Vec3; d1: Vec3; d2: Vec3 };
  retained?: (t: number) => IAutoMovieSolidSurface.IJet;
};

/**
 * A split band whose end edge is its child's rail curve at every clock, not only at its columns (`IAutoMovieConstructionSplit.ICut`).
 *
 * The column strip `B(u, c)` ends on the rail at its columns and, between them, on its own interpolation of the columns' ends. With
 * `E(c) = P(rho(chi(c)), chi(c))` the child's point on its rail at the band's correspondence `chi` (the periodic cubic through the
 * columns' child phases) and `V(s) = s^3 (10 - 15 s + 6 s^2)`, `s = u / L`, the band is
 *
 * ```text
 * S(u, c) = B(u, c) + V(u / L) (E(c) - B(L, c))
 * ```
 *
 * `V` is 0 with its first two derivatives at the loop and 1 with them zero at the rail, so `S` keeps the strip's loop edge and its
 * cross 2-jets at both edges and ends on `E(c)` itself. The displacement `E - B(L, .)` vanishes at every column and is the strip's
 * interpolation error between them. Every derivative is the chain rule on the child's 2-jet, the rail's and the correspondence's.
 */
export namespace AutoMovieConstructionSplitEdge {
  /** A fork owns the parent continuation shared by its two incident charts. */
  export interface IFork extends Fork.IRange {
    /** Evaluate the same parent material from either side of this fork. */
    retained: (t: number) => IAutoMovieSolidSurface.IJet;
  }

  /**
   * Carry a column strip's end edge onto its child's rail curve, or the reason it cannot be.
   *
   * @param strip The column strip's surface, chart `(station mm, clock rad)`.
   * @param length The strip's span, mm.
   * @param child The child's skin.
   * @param rail The rail's station at a child phase with two derivatives (`IAutoMovieConstructionSkinCut.ICut.at`).
   * @param childPhases The child's phase at each column, unwrapped along the clock.
   * @param start The loop's own curve at a band clock with its first and second clock derivatives (the host's ring on an arc, the shared seam on a seam), or absent to keep the strip's loop edge. With it the band's loop edge is that curve at every clock, carried by the complementary weight `1 - V`, so two bands that read one seam share its points and tangents between columns as well as at them; the curve's tangent turns at a fork, where the loop has its corner.
   * @param continuation The actual child cross-direction samples, if its whole rail jet is carried.
   * @param forks The source-owned continuations at the start loop's actual forks.
   * @returns The carried band, or the refusal.
   */
  export function carried(
    strip: IAutoMovieSolidSurface,
    length: number,
    child: IAutoMovieSolidSurface,
    rail: (psi: number) => [number, number, number],
    childPhases: readonly number[],
    start?: (clock: number) => LineJet,
    continuation?: Continuation.IInput,
    forks: readonly IFork[] = [],
  ): IAutoMovieConstructionBandEdge | string {
    const n: number = childPhases.length;
    const turn: number = 2 * Math.PI;
    const sense: number = Math.sign(childPhases[n - 1]! - childPhases[0]!);
    if (sense === 0)
      return "the child's phase between the band's columns does not advance with its clock";
    const delta: IAutoMovieConstructionPortField.IField = Field.periodic(
      childPhases.map((phase: number, k: number): number => phase - (sense * turn * k) / n),
    );
    const fitted = sense > 0 ? delta.slopes[0] > -1 : delta.slopes[1] < 1;

    /** The child's phase at a band clock with two derivatives. */
    const phase: ((c: number) => [number, number, number]) | string = fitted
      ? (c: number): [number, number, number] => {
          const [x, x1, x2]: [number, number, number] = delta.at(c);
          return [sense * c + x, sense + x1, x2];
        }
      : monotone(childPhases, sense, turn);
    if (typeof phase === "string") return phase;
    const extended = continuation === undefined ? undefined : Continuation.prepare(child, rail, phase, childPhases, continuation);
    if (typeof extended === "string") return extended;

    /** The child's point on its rail at a band clock with its first and second clock derivatives. */
    const edge = (c: number): { p: Vec3; d1: Vec3; d2: Vec3 } => {
      const [chi, chi1, chi2]: [number, number, number] = phase(c);
      const [r, r1, r2]: [number, number, number] = rail(chi);
      const j: IAutoMovieSolidSurface.IJet = child.jet(r, chi);
      const along: Vec3 = combine([[r1, j.u], [1, j.v]]);
      const bend: Vec3 = combine([[r1 * r1, j.uu], [2 * r1, j.uv], [1, j.vv], [r2, j.u]]);
      return {
        p: [j.p[0], j.p[1], j.p[2]],
        d1: combine([[chi1, along]]),
        d2: combine([[chi1 * chi1, bend], [chi2, along]]),
      };
    };
    const read = (u: number, c: number): IAutoMovieSolidSurface.IJet => {
      const base: IAutoMovieSolidSurface.IJet = strip.jet(u, c);
      const s: number = u / length;
      const V: number = s * s * s * (10 - 15 * s + 6 * s * s);
      const V1: number = (30 * s * s * (1 - s) * (1 - s)) / length;
      const V2: number = (60 * s * (1 - s) * (1 - 2 * s)) / (length * length);
      const zero: Vec3 = [0, 0, 0];

      // Each edge's displacement onto its owner's curve; its weight vanishes with its first two derivatives at the other edge.
      let [D, D1, D2]: [Vec3, Vec3, Vec3] = [zero, zero, zero];
      let [Du, Duu, Duv]: [Vec3, Vec3, Vec3] = [zero, zero, zero];
      if (s !== 0 && extended !== undefined) {
        const [t, t1, t2]: [number, number, number] = PortBand.sigma(1 - s);
        const target: IAutoMovieSolidSurface.IJet = extended(t, c);
        const prior: IAutoMovieSolidSurface.IJet = strip.jet(length * (1 - t), c);
        const rate: number = -t1 / length;
        const bend: number = t2 / (length * length);
        const slope: Vec3 = combine([[1, target.u], [length, prior.u]]);
        [D, D1, D2] = [sub(target.p, prior.p), sub(target.v, prior.v), sub(target.vv, prior.vv)];
        Du = scale(slope, rate);
        Duu = combine([[bend, slope], [rate * rate, target.uu], [-t1 * t1, prior.uu]]);
        Duv = combine([[rate, target.uv], [rate * length, prior.uv]]);
      } else if (s !== 0) {
        const last: IAutoMovieSolidSurface.IJet = strip.jet(length, c);
        const E: { p: Vec3; d1: Vec3; d2: Vec3 } = edge(c);
        [D, D1, D2] = [sub(E.p, last.p), sub(E.d1, last.v), sub(E.d2, last.vv)];
      }
      let [A, A1, A2]: [Vec3, Vec3, Vec3] = [zero, zero, zero];
      let [Au, Auu, Auv]: [Vec3, Vec3, Vec3] = [zero, zero, zero];
      const actual: LineJet | undefined = s === 1 ? undefined : start?.(c);
      if (actual?.retained !== undefined) {
        const [t, t1, t2]: [number, number, number] = PortBand.sigma(s);
        const target: IAutoMovieSolidSurface.IJet = actual.retained(t);
        const prior: IAutoMovieSolidSurface.IJet = strip.jet(length * t, c);
        const rate: number = t1 / length;
        const bend: number = t2 / (length * length);
        const slope: Vec3 = combine([[1, target.u], [-length, prior.u]]);
        [A, A1, A2] = [sub(target.p, prior.p), sub(target.v, prior.v), sub(target.vv, prior.vv)];
        Au = scale(slope, rate);
        Auu = combine([[bend, slope], [rate * rate, target.uu], [-t1 * t1, prior.uu]]);
        Auv = combine([[rate, target.uv], [-rate * length, prior.uv]]);
      } else if (actual !== undefined) {
        const first: IAutoMovieSolidSurface.IJet = strip.jet(0, c);
        [A, A1, A2] = [sub(actual.p, first.p), sub(actual.d1, first.v), sub(actual.d2, first.vv)];
        // Blend the residual of the same native arc at the actual fork.
        // Its value and first station derivative vanish on the exact
        // seam, where the two charts already agree on those data.
        for (const fork of forks) {
          const offset: number = c - fork.clock;
          const x: number = (offset - turn * Math.round(offset / turn)) / fork.radius;
          if (Math.abs(x) >= 1) continue;
          const [w, w1, w2] = Fork.weight(x);
          const [t, t1, t2]: [number, number, number] = PortBand.sigma(s);
          const actual = fork.retained(t);
          const prior = strip.jet(length * t, fork.clock);
          const d = sub(actual.p, prior.p);
          const p = combine([[1, actual.u], [-length, prior.u]]);
          const r: number = t1 / length;
          A = combine([[1, A], [w, d]]);
          A1 = combine([[1, A1], [w1 / fork.radius, d]]);
          A2 = combine([[1, A2], [w2 / (fork.radius * fork.radius), d]]);
          Au = scale(p, r * w);
          Auv = scale(p, r * w1 / fork.radius);
          Auu = combine([[t2 * w / (length * length), p], [r * r * w, actual.uu], [-t1 * t1 * w, prior.uu]]);
          break;
        }
      }
      const corrected: IAutoMovieSolidSurface.IJet = {
        p: combine([[1, base.p], [V, D], [1 - V, A]]),
        u: combine([[1, base.u], [V1, D], [V, Du], [-V1, A], [1 - V, Au]]),
        v: combine([[1, base.v], [V, D1], [1 - V, A1]]),
        uu: combine([[1, base.uu], [V2, D], [2 * V1, Du], [V, Duu], [-V2, A], [-2 * V1, Au], [1 - V, Auu]]),
        uv: combine([[1, base.uv], [V1, D1], [V, Duv], [-V1, A1], [1 - V, Auv]]),
        vv: combine([[1, base.vv], [V, D2], [1 - V, A2]]),
      };
      const across = actual?.across;
      if (across === undefined) return corrected;
      // Quintic Hermite weight of the initial cross derivative. At the
      // line it changes only the transverse germ, with value and bend held.
      const h = s * (1 - s) ** 3 * (1 + 3 * s);
      const h1 = (1 - s) ** 2 * (1 + 2 * s - 15 * s * s);
      const h2 = -12 * s * (1 - s) * (3 - 5 * s);
      return {
        p: combine([[1, corrected.p], [length * h, across.p]]),
        u: combine([[1, corrected.u], [h1, across.p]]),
        v: combine([[1, corrected.v], [length * h, across.d1]]),
        uu: combine([[1, corrected.uu], [h2 / length, across.p]]),
        uv: combine([[1, corrected.uv], [h1, across.d1]]),
        vv: combine([[1, corrected.vv], [length * h, across.d2]]),
      };
    };
    return {
      surface: {
        name: strip.name,
        orientation: strip.orientation,
        ...(strip.period === undefined ? {} : { period: strip.period }),
        ...(strip.domain === undefined ? {} : { domain: strip.domain }),
        jet: forks.length === 0 ? read : Fork.prepare(read, length, forks),
      },
      rail: (c: number): [number, number] => {
        const chi: number = phase(c)[0];
        return [rail(chi)[0], chi];
      },
      clock: (target: number): number => {
        // The clock in [0, 2 pi) whose phase stands at the target's turn: phase(c) - phase(0) runs monotonically through one turn.
        const base: number = phase(0)[0];
        const x: number = sense * (target - base);
        const goal: number = base + sense * (x - turn * Math.floor(x / turn));
        let [lo, hi]: [number, number] = [0, turn];
        for (let step: number = 0; step < 200; ++step) {
          const mid: number = (lo + hi) / 2;
          if (mid === lo || mid === hi) break;
          if (sense * (phase(mid)[0] - goal) < 0) lo = mid;
          else hi = mid;
        }
        return Math.abs(sense * (phase(lo)[0] - goal)) <= Math.abs(sense * (phase(hi)[0] - goal)) ? lo : hi % turn;
      },
    };
  }

  /**
   * Prepare an advancing, periodic C2 lift of the sampled phase map. A
   * positive directed column difference remains a premise.
   *
   * Zero second derivatives at the shared knots and endpoint slopes
   * bounded by both adjacent secants give derivative Bernstein controls
   * [m0, m0, 5d - 2m0 - 2m1, m1, m1], all strictly positive. The lift
   * therefore advances through each interval, even where the unconstrained
   * periodic cubic overshot between the measured columns.
   *
   * @see https://doi.org/10.1090/S0025-5718-1989-0962209-1
   */
  function monotone(
    phases: readonly number[],
    sense: number,
    turn: number,
  ): ((c: number) => [number, number, number]) | string {
    const base: number = phases[0]!;
    const y: number[] = [...phases.map((p): number => sense * (p - base)), turn];
    const n: number = phases.length;
    const h: number = turn / n;
    const rates: number[] = phases.map((_, k): number => (y[k + 1]! - y[k]!) / h);
    const least: number = Math.min(...rates);
    if (!(least > 0) || !rates.every(Number.isFinite))
      return "the child's phase between the band's columns does not advance with its clock, least directed column slope " + least;
    const x: number[] = y.map((_, k): number => (k === n ? turn : k * h));
    const knots: IAutoMovieViewPart.IKnot[] = y.map((value, k): IAutoMovieViewPart.IKnot => ({
      site: "split clock " + k,
      station: x[k]!,
      value,
      jet: { first: turn * Math.min(rates[(k + n - 1) % n]!, rates[k % n]!), second: 0 },
    }));
    const curve: IAutoMovieViewHermite.ICurve | string = AutoMovieViewHermite.create(
      AutoMovieNaturalSpline.create(x, y), knots, undefined,
    );
    if (typeof curve === "string") return curve;
    return (clock: number): [number, number, number] => {
      const cycle: number = Math.floor(clock / turn);
      const [p, p1, p2]: [number, number, number] = AutoMovieViewHermite.read(curve, clock - turn * cycle);
      return [base + sense * (turn * cycle + p), sense * p1, sense * p2];
    };
  }
}
