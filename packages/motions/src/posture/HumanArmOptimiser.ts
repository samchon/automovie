import type {
  IAutoMovieMotionHumanQuadraticProgram,
  IAutoMovieMotionHumanSequentialConvex,
} from "@automovie/interface";

import { HumanArmTrajectoryConvex } from "./HumanArmTrajectoryConvex";
import { HumanArmTrajectoryKnots as Knots } from "./HumanArmTrajectoryKnots";
import { HumanArmTrajectoryModel as M } from "./HumanArmTrajectoryModel";
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
   * @returns The last iterate at the waypoints, its evaluation and the merit
   *   coefficient it was reached at.
   */
  export function optimise(
    context: M.IContext,
    start: readonly (readonly (readonly number[])[])[],
    from?: number,
    fine?: M.IContext,
  ): IOptimised {
    // With a frame grid finer than the waypoints, the waypoints are knots:
    // the model is read and linearised at every grid instant on their
    // interpolant, and each subproblem is carried onto the knots' steps.
    const grid: M.IContext | undefined =
      fine !== undefined && !context.still && fine.n > context.n
        ? fine
        : undefined;
    const read: M.IContext = grid ?? context;
    const weights: number[][] | undefined =
      grid === undefined ? undefined : Knots.weights(context.times, grid.times);
    const spread = (x: number[][][]): number[][][] =>
      grid === undefined ? x : Knots.read(context.times, grid.times, x);

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
      HumanArmTrajectorySmooth.of(read);

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
      number[][][],
      IReading
    > = {
      closest: (x: number[][][]): number[][][] => closest(context, x),
      evaluate: (x: number[][][]): IReading => {
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
        x: number[][][],
        evaluation: IReading,
        coefficient: number,
      ): IAutoMovieMotionHumanSequentialConvex.IModel<number[][][]> => {
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
      x: number[][][],
      evaluation: IReading,
      coefficient: number,
    ): IAutoMovieMotionHumanSequentialConvex.IModel<number[][][]> => {
      // The box's rows, one per variable, built once for the model: a
      // smaller box changes only their two ends (`setTrustBoxConstraints`).
      const ranges: IRange[] = rangesOf(context, x, model.n);
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
      return {
        solve: (
          box: number,
        ): IAutoMovieMotionHumanSequentialConvex.IStep<number[][][]> => {
          // lbtrust = fmax(x - box, lb), ubtrust = fmin(x + box, ub), as steps.
          ranges.forEach((range: IRange, i: number): void => {
            trust[i]!.l = Math.max(-box, range.low);
            trust[i]!.u = Math.min(box, range.high);
          });
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
            trial: M.stepped(context, x, solved),
            merit: evaluation.objective + QP.value(model, solved),
            failed: false,
          };
        },
      };
    };

    const solved: IAutoMovieMotionHumanSequentialConvex.IResult<
      number[][][],
      IReading
    > = SCO.minimise(
      problem,
      start.map((arm: readonly (readonly number[])[]): number[][] =>
        arm.map((v: readonly number[]): number[] => [...v]),
      ),
      {
        ...SCO.DEFAULTS,
        ...TRAJECTORY,
        ...(from === undefined ? {} : { meritErrorCoeff: from }),
      },
    );
    return {
      x: solved.x,
      evaluation: solved.evaluation,
      penalty: solved.coefficient,
    };
  }

  /**
   * The waypoints nearest an iterate inside the coordinates' hard ranges
   * (`OptProb::getClosestFeasiblePoint`): each inner waypoint projected by
   * `HumanArmTrajectoryModel.ranged`, the others kept.
   */
  function closest(c: M.IContext, x: number[][][]): number[][][] {
    return x.map((arm: number[][], a: number): number[][] =>
      arm.map((v: number[], k: number): number[] =>
        M.inner(c, k) ? M.ranged(c, a, v) : [...v],
      ),
    );
  }

  /**
   * Each variable's hard range as a step from the iterate, the variable laid
   * out as `HumanArmTrajectoryModel.stepped` reads it: a boxed coordinate's
   * bounds less its value, the chart's two unbounded (its disc is met by the
   * projection after the step).
   */
  function rangesOf(c: M.IContext, x: number[][][], n: number): IRange[] {
    const out: IRange[] = Array.from(
      { length: n },
      (): IRange => ({ low: -Infinity, high: Infinity }),
    );
    for (let k: number = 1; k < c.n; ++k) {
      if (!M.inner(c, k)) continue;
      c.free.forEach((free: readonly number[], a: number): void =>
        free.forEach((d: number, f: number): void => {
          const b: Bound = c.bounds[a]![d] ?? null;
          if (b === null) return;
          const i: number = (k - 1) * c.width + c.offset[a]! + f;
          const value: number = x[a]![k]![d]!;
          out[i] = { low: b[0] - value, high: b[1] - value };
        }),
      );
    }
    return out;
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
