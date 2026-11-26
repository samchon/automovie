import type {
  AutoMovieSolidChartVector4,
  AutoMovieVector3Tuple,
  IAutoMovieSolidAtlas,
  IAutoMovieSolidIntersection,
  IAutoMovieSolidIntersectionWalk,
  IAutoMovieSolidSurface,
  IAutoMovieSolidTraceLaw,
} from "@automovie/interface";

import { AutoMovieSolidDomain } from "./AutoMovieSolidDomain";
import { AutoMovieSolidTraceLaw } from "./AutoMovieSolidTraceLaw";
import { AutoMovieSolidTraceObservation as Observation } from "./AutoMovieSolidTraceObservation";
import { AutoMovieSolidTraceSolve } from "./AutoMovieSolidTraceSolve";
import { AutoMovieSolidVector } from "./AutoMovieSolidVector";

/** World point or direction used by the original predictor. */
type Vec3 = AutoMovieVector3Tuple;
/** Surface partials used to construct the intersection tangent. */
type IJet = IAutoMovieSolidSurface.IJet;
/** The unchanged public meeting-point result. */
type IPoint = IAutoMovieSolidIntersection.IPoint;
/** World-vector operations for the original tangent and predictor equations. */
const { add, cross, dot, norm, scale, sub }: typeof AutoMovieSolidVector =
  AutoMovieSolidVector;

/**
 * Original arc-mode loop preparation, separate from parameterized trace
 * publication.
 */
export namespace AutoMovieSolidIntersectionWalk {
  /**
   * Walk the loop by pseudo-arclength continuation and sample the accepted walk
   * at uniform accumulated chord distances. The periodic reference guide
   * supplies normal planes to the final exact surface solve.
   *
   * Each step predicts `P + h T` along the curve's unit tangent `T = n_A x n_B`
   * (turned with the previous) and corrects on the plane square to `T` through
   * the prediction. It halves a step that fails or lands more than a quarter
   * step off and ends where the start lies ahead within a step. The initial
   * step is the original part-phase arc `|A_phi| 2 pi / count`. Guide density
   * is independent of the continuation's step limit.
   *
   * The internal caller supplies captured count/tolerance values and the
   * unchanged walk and guide counts (64 steps and 4 guide points per target).
   * Valid finite counts, host-face indices and regular callback jets remain
   * premises, not new admissions. Failed first walks retain at most the two
   * actual terminal direction contexts. Observation never queries a surface or
   * changes a proposal.
   *
   * @param _closingSteps Compatibility argument for the former closing walk.
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
    _closingSteps: number,
  ): IAutoMovieSolidIntersectionWalk.IWalk | string {
    /**
     * Read the two original surface jets and consistently orient their
     * cross-normal tangent.
     */
    const tangent: (
      p: IPoint,
      along: Vec3 | null,
      observation?: Observation.IState,
    ) => Vec3 | null = (
      p: IPoint,
      along: Vec3 | null,
      observation?: Observation.IState,
    ): Vec3 | null => {
      /** Part partials at this accepted preimage. */
      const a: IJet | null = AutoMovieSolidDomain.jet(part, p.s, p.phi);

      /** Current host-face partials at the same meeting. */
      const b: IJet | null = AutoMovieSolidDomain.jet(
        host.faces[p.face]!,
        p.y,
        p.theta,
      );
      if (a === null || b === null)
        return Observation.fail(
          observation,
          a === null ? "part-jet-unavailable" : "host-jet-unavailable",
          [p.s, p.phi, p.y, p.theta],
          p.face,
          { part: a, host: b },
        );

      /** Original normalized intersection tangent, absent at degeneracy. */
      const t: Vec3 | null = AutoMovieSolidVector.unit(
        cross(cross(a.u, a.v), cross(b.u, b.v)),
      );
      if (t === null)
        return Observation.fail(
          observation,
          "singular-tangent",
          [p.s, p.phi, p.y, p.theta],
          p.face,
          { part: a, host: b },
        );
      return along !== null && dot(t, along) < 0 ? scale(t, -1) : t;
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

    /** The same corrected tangent with its existing seed-tangent fallback. */
    const T0: Vec3 = tangent(start, t0) ?? t0;

    // One step of length h from a point along its tangent.

    /**
     * Original tangent prediction and correction, including its branch-distance
     * acceptance.
     */
    const step: (
      p: IPoint,
      T: Vec3,
      h: number,
      previous: IPoint | null,
      observation?: Observation.IState,
      halving?: number,
    ) => IPoint | null = (
      p: IPoint,
      T: Vec3,
      h: number,
      previous: IPoint | null,
      observation?: Observation.IState,
      halving: number = 0,
    ): IPoint | null => {
      /** World tangent prediction at the requested mm chord. */
      const predicted: Vec3 = add(p.point, scale(T, h));

      /** Accepted preimages before the original secant guess. */
      const x: AutoMovieSolidChartVector4 = [p.s, p.phi, p.y, p.theta];

      /** Previous accepted world chord, which may differ from the new step. */
      const previousChord: number =
        previous === null || previous.face !== p.face
          ? 0
          : norm(sub(p.point, previous.point));
      const advance: number = previousChord === 0 ? 0 : h / previousChord;

      /** Same-face secant in the requested chord's scale. */
      const guess: AutoMovieSolidChartVector4 =
        previous === null || previousChord === 0
          ? x
          : [
              x[0] + (x[0] - previous.s) * advance,
              x[1] + (x[1] - previous.phi) * advance,
              x[2] + (x[2] - previous.y) * advance,
              x[3] + (x[3] - previous.theta) * advance,
            ];

      if (observation !== undefined)
        observation.step = {
          h,
          predicted,
          tangent: T,
          guess,
          halving,
          distance: null,
          allowance: null,
        };

      /** Meeting corrected using the original predicted plane. */
      const next: IPoint | null = AutoMovieSolidTraceSolve.solve(
        part,
        host,
        across(predicted, T),
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
        observation.step.distance = distance;
        observation.step.allowance = allowance;
      }
      return distance <= allowance
        ? next
        : Observation.fail(
            observation,
            "branch-distance",
            [next.s, next.phi, next.y, next.theta],
            next.face,
          );
    };

    // The walk and its accumulated physical length.

    /**
     * Original phase-sized initial chord, reduced only by existing failed
     * halvings.
     */
    const n: number = walkPoints * count;
    const stride: number = (norm(a0.v) * 2 * Math.PI) / count;

    /**
     * The first walk round the loop from the seed, along `T0` times `sense`:
     * the loop's length, or why it failed. A closed loop is the same curve
     * walked either way, and a point where the two surfaces nearly touch can be
     * passed from one side when it loses the walk from the other: an ear's
     * mirrored hollow lost its walk at the point its twin passes, the twin
     * walking it the other way round.
     */
    const directions: Observation.IDirection[] = [];
    const around: (
      sense: 1 | -1,
    ) => { points: Vec3[]; distances: number[] } | string = (
      sense: 1 | -1,
    ): { points: Vec3[]; distances: number[] } | string => {
      let h: number = stride;
      const points: Vec3[] = [start.point];
      const distances: number[] = [0];

      /** Current accepted point of the first length walk. */
      let p: IPoint = start;

      /** Current consistently directed tangent. */
      let T: Vec3 = scale(T0, sense);

      /** Previous first-walk iterate used by the existing predictor. */
      let previous: IPoint | null = null;

      /** Accumulated world chords of the first walk, mm. */
      let length: number = 0;
      let attempt: Observation.IState | null = null;

      /**
       * Detach only a terminal accepted/attempted pair before the other
       * direction runs.
       */
      const retain: (reason: Observation.Reason) => void = (
        reason: Observation.Reason,
      ): void => {
        const tried: Observation.IDirection["step"] = attempt?.step ?? null;
        directions.push({
          sense,
          reason,
          length,
          last: {
            chart: [p.s, p.phi, p.y, p.theta],
            point: [...p.point],
            face: p.face,
          },
          step:
            tried === null
              ? null
              : {
                  ...tried,
                  predicted: [...tried.predicted],
                  tangent: [...tried.tangent],
                  guess: [...tried.guess],
                },
          solve: attempt?.failure ?? null,
        });
      };
      for (let k: number = 0; k < walkSteps * count; k++) {
        /** Displacement from the current point back toward its start. */
        const ahead: Vec3 = sub(start.point, p.point);
        const closing: number = norm(ahead);
        if (k > 2 && closing <= h && dot(ahead, T) > 0) {
          points.push(start.point);
          distances.push(length + closing);
          return { points, distances };
        }

        /** Candidate retained through the original failed-halving loop. */
        let next: IPoint | null = null;
        for (
          let halving: number = 0;
          halving < AutoMovieSolidTraceSolve.HALVINGS && next === null;
          halving++
        ) {
          attempt = { failure: null, trial: null, meeting: null, step: null };
          next = step(p, T, h, previous, attempt, halving);
          if (next === null) h /= 2;
        }
        if (next === null) {
          retain(attempt?.failure?.reason ?? "walk-step-failed");
          return `lost after ${length} mm of the walk, at [${p.point.map((x: number): string => x.toFixed(1)).join(", ")}] mm on host face ${p.face}`;
        }
        length += norm(sub(next.point, p.point));
        points.push(next.point);
        distances.push(length);
        previous = p;
        p = next;

        // A step that was halved to pass a tight turn grows back once it is
        // past: kept halved, the walk ran out of steps before it came round.
        h = Math.min(stride, 2 * h);

        /** Continue the first walk with the same tangent orientation. */
        const t: Vec3 | null = tangent(p, T, attempt ?? undefined);
        if (t === null) {
          retain(attempt?.failure?.reason ?? "singular-tangent");
          return `the surfaces touch ${length} mm along the walk`;
        }
        T = t;
      }
      retain("walk-step-limit");
      return `the walk does not return to its start in ${walkSteps * count} steps`;
    };

    /**
     * The way round the loop the walks go: along `T0`, or against it where the
     * walk along it was lost and the other way round closes.
     */
    let sense: 1 | -1 = 1;
    const forth = around(1);
    let adaptive: Exclude<ReturnType<typeof around>, string>;
    if (typeof forth === "string") {
      const back = around(-1);
      if (typeof back === "string")
        return Observation.format(forth, directions);
      sense = -1;
      adaptive = back;
    } else adaptive = forth;

    // Interpolate the accepted loop by length. Each spline plane then
    // determines its own point on the actual surface intersection.
    const { points, distances } = adaptive;
    const length: number = distances.at(-1)!;
    let edge: number = 1;
    const p0: Vec3[] = Array.from({ length: n }, (_, k: number): Vec3 => {
      const target: number = (length * k) / n;
      while (distances[edge]! <= target && edge + 1 < distances.length) edge++;
      const share: number =
        (target - distances[edge - 1]!) /
        (distances[edge]! - distances[edge - 1]!);
      return add(
        points[edge - 1]!,
        scale(sub(points[edge]!, points[edge - 1]!), share),
      );
    });

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
