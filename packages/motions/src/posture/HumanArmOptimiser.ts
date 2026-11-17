import type { IAutoMovieMotionHumanQuadraticProgram, IAutoMovieMotionHumanSequentialConvex } from "@automovie/interface";

import { HumanArmTrajectoryConvex } from "./HumanArmTrajectoryConvex";
import { HumanArmTrajectoryModel as M } from "./HumanArmTrajectoryModel";
import { HumanQuadraticProgram as QP } from "./HumanQuadraticProgram";
import { HumanSequentialConvex as SCO } from "./HumanSequentialConvex";

/**
 * TrajOpt's penalty sequential convex optimisation with a trust region
 * (Schulman et al. 2014, "Motion planning with sequential convex optimization
 * and convex collision checking", IJRR 33:1251, Algorithm 1) of an arms'
 * waypoints under `HumanArmTrajectoryModel`'s objective and constraints, run
 * by the shared loop (`HumanSequentialConvex`): each convex subproblem
 * (`HumanArmTrajectoryConvex`) is solved within the region by
 * `HumanQuadraticProgram`, warm-started across the region's shrinking and
 * from the multipliers of the last step taken; a step is taken where the
 * merit falls by a tenth of what the model predicts and the region shrunk
 * where not, and the penalty raised tenfold while the constraints are not
 * met. A problem still infeasible at the last penalty is left to the caller
 * to refuse. A solve continued from another's result on refined waypoints
 * starts at that result's penalty, the continuation of a penalty method, in
 * place of the first.
 */
export namespace HumanArmOptimiser {
  /**
   * Optimise from an iterate.
   *
   * @param context The problem's context.
   * @param start Each arm's coordinates at each waypoint; the first and the last waypoint stay.
   * @param from The penalty to start at, a solve continued from an earlier one of the same problem on other waypoints (`penalty` of its result); the first when absent.
   * @returns The last iterate, its evaluation and the penalty it was reached at.
   */
  export function optimise(
    context: M.IContext,
    start: readonly (readonly (readonly number[])[])[],
    from?: number,
  ): { x: number[][][]; evaluation: M.IEvaluation; penalty: number } {
    // The multipliers of the last step taken, which the next subproblem
    // starts from.
    let duals: Map<string, number> | undefined;
    const problem: IAutoMovieMotionHumanSequentialConvex.IProblem<number[][][], M.IEvaluation> = {
      evaluate: (x: number[][][]): M.IEvaluation => M.evaluate(context, x),
      feasible: (evaluation: M.IEvaluation): boolean =>
        evaluation.worst.value <= M.TOLERANCE,
      convexify: (
        x: number[][][],
        evaluation: M.IEvaluation,
        mu: number,
        radius: number,
      ): IAutoMovieMotionHumanSequentialConvex.IModel<number[][][]> => {
        // The pairs that can enter the subproblem are read one growth of the
        // region beyond it.
        const model: IAutoMovieMotionHumanQuadraticProgram.IProblem = HumanArmTrajectoryConvex.convexify(
          context,
          x,
          evaluation,
          mu,
          SCHEDULE.expand * radius,
        );
        const zero: number = QP.value(model, new Float64Array(model.n));
        let trusted: IAutoMovieMotionHumanQuadraticProgram.IProblem | undefined;
        let warm: IAutoMovieMotionHumanQuadraticProgram.IState | undefined;
        return {
          solve: (r: number): IAutoMovieMotionHumanSequentialConvex.IStep<number[][][]> => {
            trusted = {
              ...model,
              rows: [
                ...model.rows,
                ...Array.from(
                  { length: model.n },
                  (_: unknown, i: number): IAutoMovieMotionHumanQuadraticProgram.IRow => ({
                    index: [i],
                    coef: [1],
                    l: -r,
                    u: r,
                    key: `t|${i}`,
                  }),
                ),
              ],
            };
            warm = QP.solve(trusted, warm, duals);
            let length: number = 0;
            for (let i: number = 0; i < warm.x.length; ++i)
              length = Math.max(length, Math.abs(warm.x[i]!));
            return {
              trial: M.stepped(context, x, warm.x),
              predicted: zero - QP.value(model, warm.x),
              length,
              // The step at the region's edge, to the solver's own accuracy.
              full: length >= r * (1 - QP.TOLERANCE),
            };
          },
          taken: (): void => {
            duals = QP.multipliers(trusted!, warm!);
          },
        };
      },
    };
    const solved: IAutoMovieMotionHumanSequentialConvex.IResult<number[][][], M.IEvaluation> = SCO.minimise(
      problem,
      start.map((arm: readonly (readonly number[])[]): number[][] =>
        arm.map((v: readonly number[]): number[] => [...v]),
      ),
      {
        schedule: SCHEDULE,
        penalties: PENALTIES,
        rounds: ROUNDS,
        ...(from === undefined ? {} : { from }),
      },
    );
    return {
      x: solved.x,
      evaluation: solved.evaluation,
      penalty: solved.penalty,
    };
  }
}

/** The penalties tried, each ten times the last from 10: TrajOpt's first penalty and its ratio (sco's merit_error_coeff and merit_coeff_increase_ratio); the last, three increases where TrajOpt allows five, is this planner's value, unsourced. */
const PENALTIES: readonly number[] = [10, 100, 1000, 10000];

/** Convexifications per penalty at most: this planner's value, unsourced (TrajOpt's max_iter is 50). */
const ROUNDS: number = 20;

/**
 * The region's schedule. Sourced: a step is taken where the merit falls by
 * more than a tenth of the model's prediction, an eta within Nocedal and
 * Wright's Algorithm 4.1 range [0, 1/4); a step not taken quarters the
 * region, Algorithm 4.1's factor; a step taken widens it by half, TrajOpt's
 * trust_expand_ratio, on every step taken as TrajOpt does. This planner's
 * values, unsourced: the first region (8 coordinate units, set again at
 * each penalty), the widest (four times it), six tries a convexification,
 * and the settling tests (a step or region of a thousandth of a unit, a
 * predicted decrease of a millionth of the merit).
 */
const SCHEDULE: IAutoMovieMotionHumanSequentialConvex.ISchedule = {
  eta: 0.1,
  low: 0.1,
  high: 0.1,
  shrink: 0.25,
  expand: 1.5,
  boundary: false,
  widest: 8 * 4,
  trust: 8,
  least: 1e-3,
  tries: 6,
  improved: (merit: number): number => 1e-6 * Math.max(1, merit),
};
