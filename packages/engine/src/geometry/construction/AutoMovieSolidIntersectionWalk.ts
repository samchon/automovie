import type {
  AutoMovieSolidChartVector4,
  AutoMovieVector3Tuple,
  IAutoMovieSolidAtlas,
  IAutoMovieSolidIntersection,
  IAutoMovieSolidIntersectionWalk,
  IAutoMovieSolidSurface,
  IAutoMovieSolidTraceLaw,
} from "@automovie/interface";

import { AutoMovieSolidTraceObservation as Observation } from "./AutoMovieSolidTraceObservation";
import { AutoMovieSolidDomain } from "./AutoMovieSolidDomain";
import { AutoMovieSolidTraceLaw } from "./AutoMovieSolidTraceLaw";
import { AutoMovieSolidTraceSolve } from "./AutoMovieSolidTraceSolve";
import { AutoMovieSolidVector } from "./AutoMovieSolidVector";

/** World point or direction used by the original predictor. */
type Vec3 = AutoMovieVector3Tuple;
/** Surface partials used to construct the intersection tangent. */
type IJet = IAutoMovieSolidSurface.IJet;
/** The unchanged public meeting-point result. */
type IPoint = IAutoMovieSolidIntersection.IPoint;
/** The oriented unit world tangent and its two original chart rates per mm. */
type Heading = { world: Vec3; chart: AutoMovieSolidChartVector4 };
/** World-vector operations for the original tangent and predictor equations. */
const { add, cross, dot, norm, scale, solve2, sub }: typeof AutoMovieSolidVector =
  AutoMovieSolidVector;

/**
 * Original arc-mode loop preparation, separate from parameterized trace publication.
 */
export namespace AutoMovieSolidIntersectionWalk {
  /**
   * Walk the loop from the seed by pseudo-arclength continuation, once to
   * measure its polygonal length and once in equal chords, then make the
   * reference-guide law used for requested normalized arclength.
   *
   * Each step predicts `P + h T` along the curve's unit tangent
   * `T = n_A x n_B` (turned with the previous) and corrects on the plane
   * square to `T` through the prediction. The same chord advances both
   * original chart addresses by the pullbacks of `T`; the first walk halves a step that
   * fails or lands more than a quarter step off, and ends where the start
   * lies ahead within a step; the second takes `walkPoints * count` equal
   * steps of that length. The first step's length is the arc a part ring
   * step covers there, `|A_phi| 2 pi / count`.
   *
   * The internal caller supplies captured count/tolerance values and the
   * unchanged public controls (64 first-walk steps per target, 4 guide
   * points per target and 6 closing trials). Valid finite counts, host-face
   * indices and regular callback jets remain premises, not new admissions.
   * Failed first walks retain at most the two actual terminal direction
   * contexts. An identical representable point and addresses cannot advance either
   * walk. An actual atlas face transfer remains eligible. Observation never queries
   * a surface or changes a proposal.
   *
   * @returns The walk, or why it failed.
   */
  export function create(
    part: IAutoMovieSolidSurface,
    host: IAutoMovieSolidAtlas,
    input: IAutoMovieSolidIntersection.IInput,
    count: number,
    tolerance: number,
    walkSteps: number,
    walkPoints: number,
    closingSteps: number,
  ): IAutoMovieSolidIntersectionWalk.IWalk | string {
    /** Read the two original jets and resolve one directed world tangent in both charts. */
    const tangent = (
      p: IPoint,
      along: Vec3,
      observation?: Observation.IState,
    ): Heading | null => {
      /** Part partials at this accepted preimage. */
      const a: IJet | null = AutoMovieSolidDomain.jet(part, p.s, p.phi);

      /** Current host-face partials at the same meeting. */
      const b: IJet | null = AutoMovieSolidDomain.jet(
        host.faces[p.face]!,
        p.y,
        p.theta,
      );
      if (a === null || b === null) return Observation.fail(observation, a === null ? "part-jet-unavailable" : "host-jet-unavailable", [p.s, p.phi, p.y, p.theta], p.face, { part: a, host: b });

      /** Original normalized intersection tangent, absent at degeneracy. */
      const t: Vec3 | null = AutoMovieSolidVector.unit(
        cross(cross(a.u, a.v), cross(b.u, b.v)),
      );
      if (t === null) return Observation.fail(observation, "singular-tangent", [p.s, p.phi, p.y, p.theta], p.face, { part: a, host: b });
      const world: Vec3 = dot(t, along) < 0 ? scale(t, -1) : t;
      const pullback = ({ u, v }: IJet): [number, number] | null => {
        const mixed: number = dot(u, v);
        return solve2(dot(u, u), mixed, mixed, dot(v, v), [dot(u, world), dot(v, world)]);
      };
      const pa = pullback(a), pb = pullback(b);
      if (pa === null || pb === null || ![...pa, ...pb].every(Number.isFinite))
        return Observation.fail(observation, "singular-first-rate", [p.s, p.phi, p.y, p.theta], p.face, { part: a, host: b });
      return { world, chart: [...pa, ...pb] };
    };

    /** The original affine plane equation for a pseudo-arclength correction. */
    const across: (c: Vec3, m: Vec3) => IAutoMovieSolidTraceLaw.ILaw = (
      c: Vec3,
      m: Vec3,
    ): IAutoMovieSolidTraceLaw.ILaw => ({
      g: (p: Vec3): number => dot(sub(p, c), m),
      grad: (): [Vec3, number] => [m, 0],
      gt: (): number => 0,
      extra: (): number => 0,
      angle: (): number => 0,
    });

    // The seed refined on the plane through it square to the curve.

    /** The caller's starting host-face identity. */
    const face0: number = input.seed.face ?? 0;

    /** Original seed preimages, in their established coordinate order. */
    const x0: AutoMovieSolidChartVector4 = [
      input.seed.s,
      input.seed.phi,
      input.seed.y,
      input.seed.theta,
    ];

    /** Part jet used by the original seed plane and initial chord. */
    const a0: IJet | null = AutoMovieSolidDomain.jet(part, x0[0], x0[1]);

    /** Host jet used by the seed-plane tangent. */
    const b0: IJet | null = AutoMovieSolidDomain.jet(
      host.faces[face0]!,
      x0[2],
      x0[3],
    );
    if (a0 === null || b0 === null)
      return "the seed has no owned regular surface chart";

    /** Original seed tangent before the existing correction solve. */
    const t0: Vec3 | null = AutoMovieSolidVector.unit(
      cross(cross(a0.u, a0.v), cross(b0.u, b0.v)),
    );
    if (t0 === null) return "the surfaces touch at the seed";

    /** Seed corrected on the original tangent-normal plane. */
    const start: IPoint | null = AutoMovieSolidTraceSolve.solve(
      part,
      host,
      across(a0.p, t0),
      0,
      x0,
      face0,
      tolerance,
    );
    if (start === null) return "no meeting near the seed";

    /** The corrected meeting owns both rates used for all initial chord attempts. */
    const T0: Heading | null = tangent(start, t0);
    if (T0 === null) return "the corrected seed has no regular continuation on both original charts";
    const heading = (sense: 1 | -1): Heading => sense === 1 ? T0 : {
      world: scale(T0.world, -1),
      chart: [-T0.chart[0], -T0.chart[1], -T0.chart[2], -T0.chart[3]],
    };

    // One step of length h from a point along its tangent.

    /** Original tangent prediction and correction, including its branch-distance acceptance. */
    const step: (
      p: IPoint,
      T: Heading,
      h: number,
      observation?: Observation.IState,
      halving?: number,
    ) => IPoint | null = (
      p: IPoint,
      T: Heading,
      h: number,
      observation?: Observation.IState,
      halving: number = 0,
    ): IPoint | null => {
      /** The same physical chord advances the world point and both unwrapped chart addresses. */
      const predicted: Vec3 = add(p.point, scale(T.world, h));
      const [ds, dphi, dy, dtheta] = T.chart;
      const guess: AutoMovieSolidChartVector4 = [
        p.s + h * ds, p.phi + h * dphi, p.y + h * dy, p.theta + h * dtheta,
      ];

      if (observation !== undefined) observation.step = {
        h, predicted, tangent: T.world, guess, halving, distance: null, allowance: null,
      };
      const chart: AutoMovieSolidChartVector4 = [p.s, p.phi, p.y, p.theta];
      const samePoint = (q: Vec3): boolean => q.every((value, i): boolean => value === p.point[i]);
      const stagnant = (): null => {
        const domain = part.domain;
        const exitsPart: boolean = domain !== undefined &&
          ((p.s === domain[0] && ds < 0) || (p.s === domain[1] && ds > 0));
        return Observation.fail(observation, exitsPart ? "walk-part-bound" : "walk-no-progress", chart, p.face);
      };
      if (samePoint(predicted) && guess.every((value, i): boolean => value === chart[i]))
        return stagnant();

      /** Meeting corrected using the original predicted plane. */
      const next: IPoint | null = AutoMovieSolidTraceSolve.solve(
        part,
        host,
        across(predicted, T.world),
        0,
        guess,
        p.face,
        tolerance,
        observation,
      );
      if (next === null) return null;
      const distance: number = norm(sub(next.point, predicted));
      const allowance: number = 0.25 * h + 10 * tolerance;
      if (observation?.step !== undefined && observation.step !== null) {
        observation.step.distance = distance; observation.step.allowance = allowance;
      }
      if (next.face === p.face && samePoint(next.point) &&
          next.s === p.s && next.phi === p.phi && next.y === p.y && next.theta === p.theta)
        return stagnant();
      return distance <= allowance ? next : Observation.fail(observation, "branch-distance", [next.s, next.phi, next.y, next.theta], next.face);
    };

    // The first walk: the loop's length.

    /** Original phase-sized initial chord, reduced only by existing failed halvings. */
    const stride: number = (norm(a0.v) * 2 * Math.PI) / count;

    /**
     * The first walk round the loop from the seed, along `T0` times `sense`: the loop's length, or why it failed. A closed loop is the same
     * curve walked either way, and a point where the two surfaces nearly touch can be passed from one side when it loses the walk from the
     * other: an ear's mirrored hollow lost its walk at the point its twin passes, the twin walking it the other way round.
     */
    const directions: Observation.IDirection[] = [];
    const around: (sense: 1 | -1) => number | string = (sense: 1 | -1): number | string => {
      let h: number = stride;

      /** Current accepted point of the first length walk. */
      let p: IPoint = start;

      /** Current consistently directed tangent. */
      let T: Heading = heading(sense);

      /** Accumulated world chords of the first walk, mm. */
      let length: number = 0;
      let attempt: Observation.IState | null = null;
      let before: IPoint | null = null;

      /** Detach only the terminal predecessor, accepted state and attempt before the other direction runs. */
      const retain: (reason: Observation.Reason) => void = (reason: Observation.Reason): void => {
        const tried: Observation.IDirection["step"] = attempt?.step ?? null;
        const address = (at: IPoint): Observation.IDirection["last"] =>
          ({ chart: [at.s, at.phi, at.y, at.theta], point: [...at.point], face: at.face });
        directions.push({ sense, reason, length, last: address(p), before: before === null ? null : address(before),
          step: tried === null ? null : { ...tried, predicted: [...tried.predicted],
            tangent: [...tried.tangent], guess: [...tried.guess] },
          solve: attempt?.failure ?? null,
        });
      };
      for (let k: number = 0; k < walkSteps * count; k++) {
        /** Displacement from the current point back toward its start. */
        const ahead: Vec3 = sub(start.point, p.point);
        if (k > 2 && norm(ahead) <= h && dot(ahead, T.world) > 0)
          return length + norm(ahead);

        /** Candidate retained through the original failed-halving loop. */
        let next: IPoint | null = null;
        for (
          let halving: number = 0;
          halving < AutoMovieSolidTraceSolve.HALVINGS && next === null;
          halving++
        ) {
          attempt = { failure: null, trial: null, meeting: null, step: null };
          before = p;
          next = step(p, T, h, attempt, halving);
          const reason = attempt.failure?.reason;
          if ((reason === "walk-no-progress" || reason === "walk-part-bound") &&
              attempt.step?.distance === null) break;
          if (next === null) h /= 2;
        }
        if (next === null) {
          retain(attempt?.failure?.reason ?? "walk-step-failed");
          return `lost after ${length} mm of the walk, at [${p.point.map((x: number): string => x.toFixed(1)).join(", ")}] mm on host face ${p.face}`;
        }
        length += norm(sub(next.point, p.point));
        p = next;

        // A step that was halved to pass a tight turn grows back once it is
        // past: kept halved, the walk ran out of steps before it came round.
        h = Math.min(stride, 2 * h);

        /** Continue the first walk with the same tangent orientation. */
        const t: Heading | null = tangent(p, T.world, attempt ?? undefined);
        if (t === null) { retain(attempt?.failure?.reason ?? "singular-tangent"); return `the original charts have no regular continuation ${length} mm along the walk`; }
        T = t;
      }
      retain("walk-step-limit");
      return `the walk does not return to its start in ${walkSteps * count} steps`;
    };

    /** The way round the loop the walks go: along `T0`, or against it where the walk along it was lost and the other way round closes. */
    let sense: 1 | -1 = 1;
    const forth: number | string = around(1);
    let length: number;
    if (typeof forth === "string") {
      const back: number | string = around(-1);
      if (typeof back === "string") return Observation.format(forth, directions);
      sense = -1;
      length = back;
    } else length = forth;

    // The second walk: equal chords whose last, closing the loop, matches the
    // others. The first walk's length sums uneven steps, so `length / n`
    // leaves the closing chord off by their difference; the chord is set by
    // the secant method on that closing mismatch, a few walks at most.

    /** Original reference point population from the public walkPoints control. */
    const n: number = walkPoints * count;

    /** Repeat the original fixed-chord walk for one secant candidate. */
    const equal: (chord: number) => Vec3[] | string = (
      chord: number,
    ): Vec3[] | string => {
      /** Accepted world points for this one reference candidate. */
      const points: Vec3[] = [start.point];

      /** Current point of the equal-chord walk. */
      let q: IPoint = start;

      /** Original consistently oriented equal-walk tangent, the way round the first walk went. */
      let along: Heading = heading(sense);
      for (let k: number = 1; k < n; k++) {
        /** Next accepted point of this fixed-chord reference walk. */
        let next: IPoint | null = step(q, along, chord);

        // Where the curve turns within less than a chord, the tangent
        // prediction a whole chord ahead is refused. The chord is then walked
        // in halved steps along the curve, as the first walk goes, and the
        // point its length ahead stands in for the one a straight chord ahead.
        if (next === null) {
          let from: IPoint = q;
          let current: Heading = along;
          let left: number = chord;
          let h: number = chord / 2;
          for (
            let halving: number = 0;
            left > 1e-9 * chord && halving < AutoMovieSolidTraceSolve.HALVINGS;
          ) {
            const part: IPoint | null = step(
              from,
              current,
              Math.min(h, left),
            );
            if (part === null) {
              h /= 2;
              halving++;
              continue;
            }
            left -= norm(sub(part.point, from.point));
            from = part;
            const turned: Heading | null = tangent(from, current.world);
            if (turned === null) break;
            current = turned;
          }
          if (left <= 1e-9 * chord) next = from;
        }
        if (next === null)
          return `the equal-chord walk is lost at step ${k} of ${n}, at [${q.point.map((x: number): string => x.toFixed(1)).join(", ")}] mm on host face ${q.face}`;
        points.push(next.point);
        q = next;

        /** Continue this candidate using the same directed tangent. */
        const t: Heading | null = tangent(q, along.world);
        if (t === null)
          return `the original charts have no regular continuation at step ${k} of the equal-chord walk`;
        along = t;
      }
      return points;
    };

    /** Closing chord minus the chosen chord, with the original sign. */
    const mismatch: (points: Vec3[], chord: number) => number = (
      points: Vec3[],
      chord: number,
    ): number => norm(sub(points[0]!, points[points.length - 1]!)) - chord;

    /** Current secant chord candidate from the first measured length. */
    let c0: number = length / n;

    /** Last accepted reference-point candidate. */
    let p0: Vec3[] | string = equal(c0);
    if (typeof p0 === "string") return p0;

    /** Closing mismatch at that accepted candidate. */
    let g0: number = mismatch(p0, c0);

    /** Original next secant trial chord. */
    let c1: number = c0 + g0 / n;
    for (let i: number = 0; i < closingSteps && Math.abs(g0) > 1e-9 * c0; i++) {
      /** Reference points for the next trial, or its original failure. */
      const p1: Vec3[] | string = equal(c1);
      if (typeof p1 === "string") break;

      /** Closing mismatch for the successful trial. */
      const g1: number = mismatch(p1, c1);

      /** Original secant update, including its equal-residual fallback. */
      const c2: number = g1 === g0 ? c1 : c1 - (g1 * (c1 - c0)) / (g1 - g0);
      [c0, p0, g0, c1] = [c1, p1, g1, c2];
    }
    // Walked against `T0`, the points are read back in its order from the seed, so the parameter still increases along `n_part x n_host`.
    const ordered: Vec3[] =
      sense === 1 ? p0 : [p0[0]!, ...p0.slice(1).reverse()];
    return {
      law: AutoMovieSolidTraceLaw.arc(ordered),
      x: [start.s, start.phi, start.y, start.theta],
      face: start.face,
    };
  }
}
