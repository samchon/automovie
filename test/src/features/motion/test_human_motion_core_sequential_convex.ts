import type { IAutoMovieMotionHumanSequentialConvex } from "@automovie/interface";
import { HumanSequentialConvex } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

/**
 * The shared sequential convex loop (`HumanSequentialConvex.minimise`) says
 * why a solve stopped (`IResult.reason`), counts only a convergence test
 * with the region open as settled (`IResult.settled`), and takes a rejected
 * step's second-order correction where it decreases the merit
 * (`IProblem.correct`).
 *
 * Scenarios, each on a one-dimensional problem traced by hand (the region
 * starts at 1, doubles on a step whose ratio exceeds 0.75 and halves on a
 * step refused):
 * 1. `(x - 3)^2` from 0 with its exact model, which states its accuracy as
 *    1e-12: steps of 1 and 2 reach 3, where the model predicts no decrease
 *    within its accuracy, so the third convexification stops on the model,
 *    settled. Allowed two convexifications, the same solve reaches 3 but
 *    stops on the rounds, not settled.
 * 2. The same problem with `improved` at 4.5 and no stated accuracy: the
 *    second step's predicted decrease, 4, is under it, and the solve stops
 *    on the model, settled; allowed one convexification, it stops at 1 on
 *    the rounds. With `least` at 1.5 the first step, of length 1, stops it
 *    at 1 on the step, settled.
 * 3. A model that predicts a decrease of 1 for a step that raises `x^2`:
 *    every step is refused and the region halves from 1 to 0.0625, under a
 *    `least` of 0.1, so the solve stops collapsed, not settled; allowed three
 *    tries, the region stops at 0.125, collapsed, not settled.
 * 4. `(x - 3)^2` with a model whose trial lies 10 past its step: every trial
 *    is refused, and without a correction the solve stops at 0, collapsed.
 *    With a correction returning the step's own point, each refused trial
 *    is corrected once and taken on the step's predicted decrease, the
 *    region doubling on the corrected ratio of 1: 0 to 1 to 3 in two
 *    corrections, where the model stops it settled. A correction that
 *    returns null leaves the solve as without one.
 * 5. Without a value-error certificate, the exact minimiser's zero proposal
 *    terminates as numerical no progress on the step. The same zero proposal
 *    at a physically infeasible iterate remains collapsed. A rejected large
 *    uphill proposal remains collapsed even when physically feasible.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs the public loop on real problems and reads its iterate, region, reason, `settled` and `collapsed`, and counts the corrections asked for; a reason misread, a collapse called settled, a correction not taken or asked for twice fails.
 * @evidence contracts/development/testing.md#independent-expectations Each iterate, region, reason and count is traced by hand from the schedule and the problem, not read from a solver's output.
 * @evidence contracts/development/testing.md#distinguishing-cases Each reason (the model's accuracy and `improved`, the step under `least`, a region under `least` and spent tries, the rounds) is paired with the same solve stopped one step short, and the correction is compared with none and with a null one; zero proposals compare physically feasible and infeasible iterates, while a large rejected step remains a collapse.
 * @evidence contracts/development/testing.md#execution-ownership In memory, milliseconds; the test program discovers every `test_` function, so `pnpm test` and the CI test job run it.
 * @evidence contracts/development/common.md#meaningful-documentation States the claims and the 5 scenarios with their traced iterates, reasons and flags.
 */
export function test_human_motion_core_sequential_convex(): void {
  type IEvaluation = IAutoMovieMotionHumanSequentialConvex.IEvaluation;
  type IProblem = IAutoMovieMotionHumanSequentialConvex.IProblem<
    number,
    IEvaluation
  >;
  type IResult = IAutoMovieMotionHumanSequentialConvex.IResult<
    number,
    IEvaluation
  >;
  const schedule: (
    overrides: Partial<IAutoMovieMotionHumanSequentialConvex.ISchedule>,
  ) => IAutoMovieMotionHumanSequentialConvex.ISchedule = (
    overrides: Partial<IAutoMovieMotionHumanSequentialConvex.ISchedule>,
  ): IAutoMovieMotionHumanSequentialConvex.ISchedule => ({
    eta: 0.1,
    low: 0.25,
    high: 0.75,
    shrink: 0.5,
    expand: 2,
    boundary: false,
    widest: 10,
    trust: 1,
    least: 1e-6,
    tries: 10,
    improved: (): number => 0,
    ...overrides,
  });
  const f: (x: number) => number = (x: number): number => (x - 3) ** 2;
  const quadratic: (accuracy: number | undefined, miss: number) => IProblem = (
    accuracy: number | undefined,
    miss: number,
  ): IProblem => ({
    evaluate: (x: number): IEvaluation => ({ objective: f(x), violation: 0 }),
    convexify: (
      x: number,
    ): IAutoMovieMotionHumanSequentialConvex.IModel<number> => ({
      solve: (
        radius: number,
      ): IAutoMovieMotionHumanSequentialConvex.IStep<number> => {
        const p: number = Math.max(-radius, Math.min(radius, 3 - x));
        return {
          trial: x + p + miss,
          predicted: f(x) - f(x + p),
          length: Math.abs(p),
          full: Math.abs(p) >= radius,
          accuracy,
        };
      },
    }),
    feasible: (): boolean => true,
  });
  const solve: (
    problem: IProblem,
    options: Partial<IAutoMovieMotionHumanSequentialConvex.ISchedule>,
    rounds: number,
  ) => IResult = (
    problem: IProblem,
    options: Partial<IAutoMovieMotionHumanSequentialConvex.ISchedule>,
    rounds: number,
  ): IResult =>
    HumanSequentialConvex.minimise(problem, 0, {
      schedule: schedule(options),
      penalties: [1],
      rounds,
    });
  const ended: (
    result: IResult,
    x: number,
    reason: IAutoMovieMotionHumanSequentialConvex.Reason,
  ) => boolean = (
    result: IResult,
    x: number,
    reason: IAutoMovieMotionHumanSequentialConvex.Reason,
  ): boolean =>
    result.x === x &&
    result.reason === reason &&
    result.settled === (reason === "model" || reason === "step") &&
    result.collapsed === (reason === "collapsed");

  TestValidator.predicate(
    "the model's accuracy settles the solve at the minimiser",
    ended(solve(quadratic(1e-12, 0), {}, 10), 3, "model"),
  );
  TestValidator.predicate(
    "the rounds end it at the minimiser, not settled",
    ended(solve(quadratic(1e-12, 0), {}, 2), 3, "rounds"),
  );

  const flat: Partial<IAutoMovieMotionHumanSequentialConvex.ISchedule> = {
    improved: (): number => 4.5,
  };
  TestValidator.predicate(
    "a decrease under improved settles the solve",
    ended(solve(quadratic(undefined, 0), flat, 2), 3, "model"),
  );
  TestValidator.predicate(
    "one round stops it short, not settled",
    ended(solve(quadratic(undefined, 0), flat, 1), 1, "rounds"),
  );
  TestValidator.predicate(
    "a step under least settles the solve",
    ended(solve(quadratic(undefined, 0), { least: 1.5 }, 10), 1, "step"),
  );

  const lying: IProblem = {
    evaluate: (x: number): IEvaluation => ({ objective: x * x, violation: 0 }),
    convexify: (
      x: number,
    ): IAutoMovieMotionHumanSequentialConvex.IModel<number> => ({
      solve: (
        radius: number,
      ): IAutoMovieMotionHumanSequentialConvex.IStep<number> => ({
        trial: x + radius,
        predicted: 1,
        length: radius,
        full: true,
      }),
    }),
    feasible: (): boolean => true,
  };
  const shrunk: IResult = solve(lying, { least: 0.1 }, 10);
  TestValidator.predicate(
    "a region under least is a collapse, not settled",
    ended(shrunk, 0, "collapsed") && shrunk.radius === 0.0625,
  );
  const spent: IResult = solve(lying, { least: 0.1, tries: 3 }, 10);
  TestValidator.predicate(
    "tries spent above least are a collapse, not settled",
    ended(spent, 0, "collapsed") && spent.radius === 0.125,
  );

  const missing: IProblem = quadratic(1e-12, 10);
  TestValidator.predicate(
    "every missed trial refused without a correction",
    ended(solve(missing, {}, 10), 0, "collapsed"),
  );
  const asked: number[] = [];
  const corrected: IResult = solve(
    {
      ...missing,
      correct: (
        x: number,
        step: IAutoMovieMotionHumanSequentialConvex.IStep<number>,
      ): number => {
        asked.push(x);
        return step.trial - 10;
      },
    },
    {},
    10,
  );
  TestValidator.predicate(
    "each missed trial corrected once and taken",
    ended(corrected, 3, "model") &&
      corrected.radius === 4 &&
      asked.length === 2 &&
      asked[0] === 0 &&
      asked[1] === 1,
  );
  TestValidator.predicate(
    "a null correction leaves the solve as without one",
    ended(
      solve({ ...missing, correct: (): null => null }, {}, 10),
      0,
      "collapsed",
    ),
  );
  TestValidator.predicate(
    "a feasible zero proposal needs no invented objective-error certificate",
    ended(solve(quadratic(undefined, 0), {}, 10), 3, "step"),
  );
  const frozen: IProblem = {
    evaluate: (): IEvaluation => ({ objective: 0, violation: 1 }),
    convexify: (
      x: number,
    ): IAutoMovieMotionHumanSequentialConvex.IModel<number> => ({
      solve: (): IAutoMovieMotionHumanSequentialConvex.IStep<number> => ({
        trial: x,
        predicted: 0,
        length: 0,
        full: false,
      }),
    }),
    feasible: (): boolean => false,
  };
  TestValidator.predicate(
    "an infeasible zero proposal stays collapsed",
    ended(solve(frozen, {}, 10), 0, "collapsed"),
  );
  TestValidator.predicate(
    "a large rejected proposal is not numerical no progress",
    ended(solve(lying, {}, 10), 0, "collapsed"),
  );
}
