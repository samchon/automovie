import type {
  IAutoMovieMotionHumanQuadraticProgram,
  IAutoMovieMotionHumanSequentialConvex,
} from "@automovie/interface";

import { HUMAN_ARM_COORDINATE_RATES as RATES } from "./HUMAN_ARM_COORDINATE_RATES";
import type { HumanArmSeed } from "./HumanArmSeed";
import { HumanArmSiteStepFeasible } from "./HumanArmSiteStepFeasible";
import { HumanArmTrajectoryConvex } from "./HumanArmTrajectoryConvex";
import { HumanArmTrajectoryKnots as Knots } from "./HumanArmTrajectoryKnots";
import { HumanArmTrajectoryModel as M } from "./HumanArmTrajectoryModel";
import { HumanArmTrajectoryRateProjection as Projection } from "./HumanArmTrajectoryRateProjection";
import { HumanArmTrajectorySmooth } from "./HumanArmTrajectorySmooth";
import type { HumanQuadraticInteriorSession } from "./HumanQuadraticInteriorSession";
import { HumanQuadraticProgram as QP } from "./HumanQuadraticProgram";
import { HumanSequentialConvex as SCO } from "./HumanSequentialConvex";

/**
 * TrajOpt's solve of an arms' waypoints (Schulman et al. 2014, "Motion planning
 * with sequential convex optimization and convex collision checking", IJRR
 * 33:1251) under `HumanArmTrajectoryModel`'s objective and constraints:
 * trajopt's sequential convex loop (`HumanSequentialConvex`, the port of
 * `sco::BasicTrustRegionSQP::optimize`) at the settings trajopt's own
 * trajectory entry gives it (`OptimizeProblem`,
 * `src/trajopt/problem_description.cpp` lines 244-257,
 * github.com/joschu/trajopt at commit 8da5bb00b690647318a12fa4f5dd7e6c8a0f501c,
 * BSD-2-Clause, Copyright (c) 2013, John Schulman). Each convex model
 * (`HumanArmTrajectoryConvex`) is solved inside the trust box, intersected with
 * the coordinates' hard ranges as `setTrustBoxConstraints` intersects it, by
 * the interior-point method of `HumanQuadraticProgram.interior`; a model that
 * method cannot solve ends the solve failed, as trajopt's ends where its convex
 * solver fails.
 */
export namespace HumanArmOptimiser {
  /** An optimised course: its waypoints, their reading and the coefficient. */
  export interface IOptimised {
    /** Each arm's coordinates at each waypoint. */
    x: number[][][];

    /**
     * Each arm's velocity and acceleration at each knot, where the waypoints
     * are knots on a finer frame grid; absent where they are read themselves.
     */
    rates?: Knots.IRates;

    /** Their reading, which admits or refuses the path played. */
    evaluation: M.IEvaluation;

    /** The merit coefficient the solve ended at. */
    penalty: number;
  }

  /**
   * Optimise from an iterate.
   *
   * @param context The problem's context.
   * @param start Each arm's coordinates at each waypoint; the first and the
   *   last waypoint stay.
   * @param from The merit coefficient to start at, a solve continued from an
   *   earlier one of the same problem on other waypoints (`penalty` of its
   *   result), set as trajopt's caller sets `merit_error_coeff_`; trajopt's
   *   trajectory setting when absent.
   * @param fine The context at the frame grid's instants over the same span.
   *   When it holds more instants than `context`, the waypoints are knots:
   *   every evaluation and linearisation is the grid's, on the knots'
   *   interpolant, and the steps are the knots' (`HumanArmTrajectoryKnots`);
   *   absent, or for a still configuration, the waypoints are read themselves.
   * @param rates The knots' velocities and accelerations to start from; the
   *   minimum-jerk spline's through `start` when absent (`Knots.rates`).
   * @param pinned The hold poses whose positions stay fixed.
   * @param fixSite The hold's hard contact equality, at its projection or a
   *   point selected within an inscribed region.
   * @returns The last iterate at the waypoints, its evaluation and the merit
   *   coefficient it was reached at.
   */
  export function optimise(
    context: M.IContext,
    start: readonly (readonly (readonly number[])[])[],
    from?: number,
    fine?: M.IContext,
    rates?: Knots.IRates,
    pinned?: HumanArmSeed.IHolds,
    fixSite: boolean | "region" = false,
  ): IOptimised {
    // With a frame grid finer than the waypoints, the waypoints are knots:
    // the model is read and linearised at every grid instant on their
    // interpolant, and each subproblem is carried onto the knots' steps.
    const grid: M.IContext | undefined =
      fine !== undefined && !context.still && fine.n > context.n
        ? fine
        : undefined;
    const read: M.IContext = grid ?? context;
    const weights: Knots.IWeight[][] | undefined =
      grid === undefined ? undefined : Knots.weights(context.times, grid.times);
    const spread = (it: IIterate): number[][][] =>
      grid === undefined
        ? it.x
        : Knots.read(context.times, grid.times, it.x, it.rates);

    // The clearance is read at the knots' own instants and over the
    // intervals between them, every motion term on every frame
    // (`HumanArmTrajectoryEvaluate`), trajopt's timesteps and the casts
    // between them.
    const contact: boolean[] | undefined =
      grid === undefined
        ? undefined
        : ((): boolean[] => {
            const at: Set<number> = new Set(context.times);
            return grid.times.map((t: number): boolean => at.has(t));
          })();

    // The objective's exact quadratic terms, the same at every iterate.
    const smooth: HumanArmTrajectorySmooth.ISmooth =
      HumanArmTrajectorySmooth(read);

    // The subproblems of one solve share one interior-point session; a model
    // at another coefficient has data of another magnitude and is
    // equilibrated again (`scaledAt`).
    const session: HumanQuadraticInteriorSession.ISession = {};
    const scaled: IScaled = { at: undefined };

    // A still solve never steps its fixed endpoints: its first reading
    // supplies those placements throughout this synchronous solve.
    const changing: boolean[] | undefined = read.still
      ? read.times.map((_time: number, i: number): boolean => M.inner(read, i))
      : undefined;
    const kept: IKept = { fixed: undefined };

    const problem: IAutoMovieMotionHumanSequentialConvex.IProblem<
      IIterate,
      IReading
    > = {
      closest: (it: IIterate): IIterate => ({
        x: it.x,
        ...(it.rates === undefined
          ? {}
          : { rates: limited(context, it.rates) }),
      }),
      evaluate: (x: IIterate): IReading => {
        const evaluation: M.IEvaluation = M.evaluate(
          read,
          spread(x),
          kept.fixed,
          contact,
        );
        if (changing !== undefined && kept.fixed === undefined)
          kept.fixed = { reading: evaluation, laid: changing };
        return { ...evaluation, greatest: evaluation.worst.value };
      },
      convexify: (
        x: IIterate,
        evaluation: IReading,
        coefficient: number,
      ): IAutoMovieMotionHumanSequentialConvex.IModel<IIterate> => {
        // A new linearisation has other rows: no earlier point starts it.
        session.point = undefined;

        // The rows are the iterate's own reading's pairs within trajopt's
        // contact distance of their bounds (`HumanArmTrajectoryTerms.CHECK`).
        const built: IAutoMovieMotionHumanQuadraticProgram.IProblem =
          HumanArmTrajectoryConvex.convexify(
            read,
            spread(x),
            evaluation,
            coefficient,
            smooth,
            fixSite,
          );
        return shell(
          grid === undefined ? built : Knots.reduce(context, weights!, built),
          x,
          evaluation,
          coefficient,
        );
      },
    };

    // One linearisation at one coefficient as the loop's model.
    const shell = (
      model: IAutoMovieMotionHumanQuadraticProgram.IProblem,
      x: IIterate,
      evaluation: IReading,
      coefficient: number,
    ): IAutoMovieMotionHumanSequentialConvex.IModel<IIterate> => {
      // The box's rows, one per variable, built once for the model: a
      // smaller box changes only their two ends (`setTrustBoxConstraints`).
      const ranges: IRange[] = rangesOf(
        context,
        x,
        model.n,
        grid !== undefined,
        pinned,
      );
      const trust: IAutoMovieMotionHumanQuadraticProgram.IRow[] = ranges.map(
        (
          _range: IRange,
          i: number,
        ): IAutoMovieMotionHumanQuadraticProgram.IRow => ({
          index: [i],
          coef: [1],
          l: 0,
          u: 0,
          key: `t|${i}`,
        }),
      );
      const trusted: IAutoMovieMotionHumanQuadraticProgram.IProblem = {
        ...model,
        rows: [...model.rows, ...trust],
      };
      const siteRows: IAutoMovieMotionHumanQuadraticProgram.IRow[] = fixSite
        ? model.rows.filter(
            (row) => row.weight === undefined && row.l === row.u,
          )
        : [];
      return {
        solve: (
          box: number,
        ): IAutoMovieMotionHumanSequentialConvex.IStep<IIterate> => {
          // lbtrust = fmax(x - box, lb), ubtrust = fmin(x + box, ub), as steps.
          ranges.forEach((range: IRange, i: number): void => {
            trust[i]!.l = Math.max(-box * range.scale, range.low);
            trust[i]!.u = Math.min(box * range.scale, range.high);
          });
          if (
            siteRows.some(
              (row) => !HumanArmSiteStepFeasible(row, trust, M.TOLERANCE),
            )
          )
            return { trial: x, merit: Infinity, failed: true };
          if (scaled.at !== coefficient) {
            session.scaling = undefined;
            session.point = undefined;
            scaled.at = coefficient;
          }
          const solved: Float64Array | undefined = QP.interior(
            trusted,
            session,
          )?.x;
          if (solved === undefined)
            return { trial: x, merit: Infinity, failed: true };

          // The model merit: the convexified costs and the priced linearised
          // constraints at the solution. The model omits the costs' value at
          // the iterate, its constant, which the iterate's exact objective is.
          return {
            trial: stepped(context, x, solved, grid !== undefined, pinned),
            merit: evaluation.objective + QP.value(model, solved),
            failed: false,
          };
        },
      };
    };

    const first: number[][][] = closest(context, start, pinned);
    const solved: IAutoMovieMotionHumanSequentialConvex.IResult<
      IIterate,
      IReading
    > = SCO.minimise(
      problem,
      {
        x: first,
        ...(grid === undefined
          ? {}
          : { rates: rates ?? Knots.rates(context.times, first) }),
      },
      {
        ...SCO.DEFAULTS,
        ...TRAJECTORY,
        ...(from === undefined ? {} : { meritErrorCoeff: from }),
      },
    );
    return {
      x: solved.x.x,
      ...(solved.x.rates === undefined ? {} : { rates: solved.x.rates }),
      evaluation: solved.evaluation,
      penalty: solved.coefficient,
    };
  }

  /**
   * The knots' rates nearest an iterate's within the coordinates' velocity
   * limits (`HUMAN_ARM_COORDINATE_RATES`), the moving knots' clamped and the
   * others kept, as the waypoints are projected into their ranges (`closest`),
   * so every trust box holds the step of no change.
   */
  function limited(c: M.IContext, rates: Knots.IRates): Knots.IRates {
    return {
      velocities: rates.velocities.map((arm: number[][]): number[][] =>
        arm.map((v: number[], k: number): number[] =>
          M.inner(c, k)
            ? v.map((value: number, d: number): number => {
                const rate: number = RATES[d] ?? Infinity;
                return Math.min(rate, Math.max(-rate, value));
              })
            : [...v],
        ),
      ),
      accelerations: rates.accelerations.map((arm: number[][]): number[][] =>
        arm.map((v: number[]): number[] => [...v]),
      ),
    };
  }
  /**
   * The waypoints nearest an iterate inside the coordinates' hard ranges
   * (`OptProb::getClosestFeasiblePoint`): each inner waypoint projected by
   * `HumanArmTrajectoryModel.ranged`, the others kept.
   */
  function closest(
    c: M.IContext,
    x: readonly (readonly (readonly number[])[])[],
    pinned?: HumanArmSeed.IHolds,
  ): number[][][] {
    return x.map((arm: readonly (readonly number[])[], a: number): number[][] =>
      arm.map((v: readonly number[], k: number): number[] => {
        const held: number[] | undefined = pinned?.get(c.times[k]!)?.[a];
        if (held !== undefined && c.sites[a]![k] !== undefined)
          return [...held];
        return M.inner(c, k) ? M.ranged(c, a, v) : [...v];
      }),
    );
  }

  /**
   * Each variable's hard range as a step from the iterate, the variable laid
   * out as `HumanArmTrajectoryModel.stepped` reads it: a boxed coordinate's
   * bounds less its value, the chart's two unbounded (its disc is met by the
   * projection after the step).
   */
  function rangesOf(
    c: M.IContext,
    it: IIterate,
    n: number,
    knotted: boolean,
    pinned?: HumanArmSeed.IHolds,
  ): IRange[] {
    const out: IRange[] = Array.from(
      { length: n },
      (): IRange => ({ low: -Infinity, high: Infinity, scale: 1 }),
    );
    const stride: number = knotted ? 3 * c.width : c.width;
    for (let k: number = 1; k < c.n; ++k) {
      if (!M.inner(c, k)) continue;
      const fixed: boolean = pinned?.has(c.times[k]!) === true;
      // A knot's velocity and acceleration are the subproblem's variables in
      // its own time scale (`Knots.span`), in the positions' units.
      const span: number = Knots.span(c.times, k);
      c.free.forEach((free: readonly number[], a: number): void =>
        free.forEach((d: number, f: number): void => {
          const base: number = (k - 1) * stride + c.offset[a]! + f;
          const b: Bound = c.bounds[a]![d] ?? null;
          if (b !== null) {
            const value: number = it.x[a]![k]![d]!;
            out[base] = { low: b[0] - value, high: b[1] - value, scale: 1 };
          }
          // Hold this arm's position only while it has a site of its own.
          if (fixed && c.sites[a]![k] !== undefined)
            out[base] = { low: 0, high: 0, scale: 1 };
          if (!knotted || it.rates === undefined) return;
          // The velocity within the coordinate's own rate, the limit the
          // retiming holds it to (`HUMAN_ARM_COORDINATE_RATES`, TOPP-RA's
          // first-order constraint); the acceleration, which the retiming
          // leaves unbounded, only within the trust box.
          const rate: number = RATES[d] ?? Infinity;
          const v: number = it.rates.velocities[a]![k]![d]!;
          // An iterate the solver's own tolerance left just past the limit keeps
          // the step of no change in its range.
          out[base + c.width] = {
            low: Math.min(0, (-rate - v) * span),
            high: Math.max(0, (rate - v) * span),
            scale: 1,
          };
          out[base + 2 * c.width] = {
            low: -Infinity,
            high: Infinity,
            scale: 1,
          };
        }),
      );
    }
    return out;
  }

  /**
   * An iterate moved by a subproblem's solution: the positions by
   * `HumanArmTrajectoryModel.stepped`, the knots' velocities and accelerations
   * by their own steps, projected where a knot lies on a bound
   * (`HumanArmTrajectoryRateProjection`).
   */
  function stepped(
    c: M.IContext,
    it: IIterate,
    solved: Float64Array,
    knotted: boolean,
    pinned?: HumanArmSeed.IHolds,
  ): IIterate {
    if (!knotted || it.rates === undefined)
      return { x: M.stepped(c, it.x, solved, pinned) };
    const width: number = c.width;
    const inner: number = solved.length / (3 * width);
    const positions: Float64Array = new Float64Array(inner * width);
    for (let k: number = 0; k < inner; ++k)
      for (let o: number = 0; o < width; ++o)
        positions[k * width + o] = solved[k * 3 * width + o]!;
    const velocities: number[][][] = it.rates.velocities.map(
      (arm: number[][]): number[][] =>
        arm.map((v: number[]): number[] => [...v]),
    );
    const accelerations: number[][][] = it.rates.accelerations.map(
      (arm: number[][]): number[][] =>
        arm.map((v: number[]): number[] => [...v]),
    );
    for (let k: number = 1; k < c.n; ++k) {
      if (!M.inner(c, k)) continue;
      c.free.forEach((free: readonly number[], a: number): void =>
        free.forEach((d: number, f: number): void => {
          const base: number = (k - 1) * 3 * width + c.offset[a]! + f;
          // The steps are in the knot's own time scale (`Knots.span`).
          const span: number = Knots.span(c.times, k);
          velocities[a]![k]![d] =
            velocities[a]![k]![d]! + solved[base + width]! / span;
          accelerations[a]![k]![d] =
            accelerations[a]![k]![d]! +
            solved[base + 2 * width]! / (span * span);
        }),
      );
    }
    const x: number[][][] = M.stepped(c, it.x, positions, pinned);
    return {
      x,
      rates: Projection(c, x, { velocities, accelerations }),
    };
  }

  /**
   * The solve's iterate: each arm's coordinates at each waypoint, and where the
   * waypoints are knots on a finer grid, each knot's velocity and
   * acceleration.
   */
  interface IIterate {
    /** Each arm's coordinates at each waypoint. */
    x: number[][][];
    /** The knots' rates; absent where the waypoints are read themselves. */
    rates?: Knots.IRates;
  }
  /**
   * An iterate's reading for the loop: the model's, with its greatest
   * violation.
   */
  interface IReading extends M.IEvaluation {
    /** The worst violation past its slack (`IWorst.value`). */
    greatest: number;
  }

  /** A variable's hard range as a step from the iterate. */
  interface IRange {
    /** The least step. */
    low: number;

    /** The greatest step. */
    high: number;

    /** The trust box's scale in the variable's own units. */
    scale: number;
  }

  /** The coefficient the session's scales were taken at. */
  interface IScaled {
    /** The coefficient; absent before the first solve. */
    at?: number;
  }

  /** A still solve's first reading, which supplies its fixed endpoints. */
  interface IKept {
    /** The reading and which waypoints change; absent before the first. */
    fixed?: Fixed;
  }

  /** A coordinate's hard range, as the context holds it. */
  type Bound = M.IContext["bounds"][number][number];

  /**
   * What `HumanArmTrajectoryModel.evaluate` takes as a still solve's first
   * reading.
   */
  type Fixed = NonNullable<Parameters<typeof M.evaluate>[2]>;
}

/** Degrees in a radian: the arm's coordinates are near a degree a unit. */
const DEGREES: number = 180 / Math.PI;

/**
 * Trajopt's trajectory settings (`OptimizeProblem`, `problem_description.cpp`
 * lines 247-250 at commit 8da5bb00b690647318a12fa4f5dd7e6c8a0f501c,
 * BSD-2-Clause): `max_iter_` 40, `min_approx_improve_frac_` .001,
 * `improve_ratio_threshold_` .2 and `merit_error_coeff_` 20; with the sco
 * defaults that carry a unit read in this model's units: trajopt's joint
 * variables are radians, so its box (`trust_box_size_` 0.1) and its least box
 * (`min_trust_box_size_` 1e-4) are in coordinate units, near a degree each; its
 * distances are metres, so its constraint tolerance (`cnt_tolerance_` 1e-4) is
 * in this model's millimetres.
 */
const TRAJECTORY: Readonly<
  Partial<IAutoMovieMotionHumanSequentialConvex.IParameters>
> = {
  maxIter: 40,
  minApproxImproveFrac: 0.001,
  improveRatioThreshold: 0.2,
  meritErrorCoeff: 20,
  trustBoxSize: 0.1 * DEGREES,
  minTrustBoxSize: 1e-4 * DEGREES,
  cntTolerance: 1e-4 * 1000,
};
