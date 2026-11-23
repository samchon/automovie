import type { IAutoMovieMotionHumanSequentialConvex } from "@automovie/interface";
import { HumanSequentialConvex as SCO } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/nclose";

/**
 * A steered solve's convergence: the stationary stop needs a violation step
 * that misses the linearised constraints, and a solve that settles
 * infeasible goes on at a tenfold penalty up to its ceiling.
 *
 * Scenarios:
 * 1. The objective step at penalty 10 misses the linearised constraints;
 *    the step of the violation alone meets them while reducing the summed
 *    violation (1.05 to 1.00) by less than the stationary tolerance 1. The
 *    iterate is not stationary: the solve must go on, steer to penalty 100,
 *    take x = 1 (largest row 0.5, feasible) and settle on the model, never
 *    stop `infeasible` at x = 0.
 * 2. The constraint x >= 1 is read 1.25 times steeper than the model's
 *    linearisation, and each model step leaves a linear residual of 0.09 /
 *    mu, met within the tolerance 0.01. At penalty 10 the next prediction
 *    (0.0225) falls under a tenth of the merit, so the solve settles at
 *    x = 0.991 with the actual violation 0.01125, a hair past the tolerance.
 *    With the ceiling 1000 it goes on at penalty 100 and settles feasible at
 *    x = 0.9991; without a ceiling it ends where it settled, infeasible, at
 *    penalty 10.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States both scripted problems, their tolerances, the expected iterates, penalties and stop reasons.
 * @evidence contracts/development/testing.md#behavioral-verification Runs the public SCO.minimise on owned scalar problems and checks the returned iterate, penalty, reason and feasibility.
 * @evidence contracts/development/testing.md#independent-expectations Scenario 1's merit falls 100 x 0.05 = 5, exactly its prediction, so x = 1 is taken; scenario 2's iterates are 1 - 0.09/mu at mu = 10 and 100, and their actual violations 1.25 x 0.009 and 1.25 x 0.0009 straddle the tolerance 0.01.
 * @evidence contracts/development/testing.md#distinguishing-cases A met against a missed violation step, a settled infeasible solve with and without a ceiling.
 * @evidence contracts/development/testing.md#execution-ownership One in-memory unit owns both scripted problems; it calls the actual public loop and replaces nothing.
 */
export function test_geometry_sequential_outer_penalty(): void {
  // 1. A met step of the violation alone is no stationary point.
  const met: IResult = SCO.minimise(stationaryProblem(), 0, {
    schedule: SCHEDULE,
    penalties: [10],
    rounds: 3,
    steer: true,
    ceiling: 1000,
    stationary: 1,
  });
  TestValidator.predicate(
    "a met violation step does not stop the solve infeasible",
    met.x === 1 &&
      met.reason === "model" &&
      met.settled &&
      nclose(met.penalty, 100, 1e-12) &&
      met.evaluation.worst <= 1,
  );

  // 2. A solve settled a hair outside the tolerance goes on at a raised penalty.
  for (const ceiling of [1000, undefined]) {
    const solved: IResult = SCO.minimise(hairProblem(), 0, {
      schedule: {
        ...SCHEDULE,
        improved: (merit: number): number => IMPROVED * merit,
      },
      penalties: [10],
      rounds: 5,
      steer: true,
      stationary: TOLERANCE,
      ...(ceiling === undefined ? {} : { ceiling }),
    });
    const raised: boolean = ceiling !== undefined;
    TestValidator.predicate(
      `a settled infeasible solve ${raised ? "rises to penalty 100" : "stays at penalty 10 without a ceiling"}`,
      nclose(solved.x, raised ? 0.9991 : 0.991, 1e-12) &&
        nclose(solved.penalty, raised ? 100 : 10, 1e-12) &&
        solved.reason === "model" &&
        solved.evaluation.worst <= TOLERANCE === raised,
    );
  }
}

/** A scalar reading with its largest row beside the summed violation. */
interface IEvaluation
  extends IAutoMovieMotionHumanSequentialConvex.IEvaluation {
  /** The largest row's violation, what feasibility reads. */
  worst: number;
}

/** A problem over one scalar. */
type IProblem = IAutoMovieMotionHumanSequentialConvex.IProblem<
  number,
  IEvaluation
>;

/** A solve over one scalar. */
type IResult = IAutoMovieMotionHumanSequentialConvex.IResult<
  number,
  IEvaluation
>;

/** A model over one scalar. */
type IModel = IAutoMovieMotionHumanSequentialConvex.IModel<number>;

/** A step over one scalar. */
type IStep = IAutoMovieMotionHumanSequentialConvex.IStep<number>;

/** Scenario 2's feasibility tolerance and the model's linear one. */
const TOLERANCE: number = 0.01;

/** Scenario 2's actual violation over its linearisation's. */
const STEEPER: number = 1.25;

/** Scenario 2's least model improvement, a share of the merit. */
const IMPROVED: number = 0.1;

/** A wide region that no step reaches; the model's own accuracy settles. */
const SCHEDULE: IAutoMovieMotionHumanSequentialConvex.ISchedule = {
  eta: 0.1,
  low: 0.1,
  high: 0.9,
  shrink: 0.25,
  expand: 1.5,
  boundary: false,
  widest: 2,
  trust: 2,
  least: 1e-9,
  tries: 4,
  improved: (): number => 0,
};

/** Scenario 1: two rows whose sum is 1.05 at 0, 1.04 at 0.5 and 1.00 at 1, the largest row 0.5 at 1. */
function stationaryProblem(): IProblem {
  const evaluate = (x: number): IEvaluation =>
    x === 1
      ? { objective: 0, violation: 1, worst: 0.5 }
      : x === 0.5
        ? { objective: 0, violation: 1.04, worst: 1.04 }
        : { objective: 0, violation: 1.05, worst: 1.05 };
  const step = (
    x: number,
    trial: number,
    mu: number,
    radius: number,
  ): IStep => ({
    trial,
    predicted: mu * (evaluate(x).violation - evaluate(trial).violation),
    length: Math.abs(trial - x),
    full: Math.abs(trial - x) >= radius,
    violation: evaluate(trial).violation,
    met: evaluate(trial).worst <= 1,
    accuracy: 0,
  });
  return {
    evaluate,
    feasible: (e: IEvaluation): boolean => e.worst <= 1,
    convexify: (
      x: number,
      _current: IEvaluation,
      mu: number,
      _radius: number,
      objective: boolean,
    ): IModel => ({
      // At 0 the objective's step meets the rows only from penalty 100;
      // the violation's own step always does. At 1 nothing moves.
      solve: (radius: number): IStep =>
        step(x, x === 1 || !objective || mu >= 100 ? 1 : 0.5, mu, radius),
    }),
  };
}

/** Scenario 2: x >= 1 read STEEPER times its linearisation, each step leaving 0.09 / mu of it. */
function hairProblem(): IProblem {
  const evaluate = (x: number): IEvaluation => {
    const violation: number = STEEPER * Math.max(0, 1 - x);
    return { objective: (x * x) / 2, violation, worst: violation };
  };
  return {
    evaluate,
    feasible: (e: IEvaluation): boolean => e.worst <= TOLERANCE,
    convexify: (x: number, current: IEvaluation, mu: number): IModel => ({
      solve: (radius: number): IStep => {
        const trial: number = 1 - 0.09 / mu;
        const left: number = Math.max(0, 1 - trial);
        return {
          trial,
          predicted:
            (x * x) / 2 - (trial * trial) / 2 + mu * (current.violation - left),
          length: Math.abs(trial - x),
          full: Math.abs(trial - x) >= radius,
          violation: left,
          met: left <= TOLERANCE,
        };
      },
    }),
  };
}
