import type { IAutoMovieMotionHumanSequentialConvex } from "@automovie/interface";
import { HumanSequentialConvex as SCO } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/nclose";

/**
 * The ported loop's merit schedule and its ends (trajopt's
 * `sco::BasicTrustRegionSQP::optimize`, github.com/joschu/trajopt
 * src/sco/optimizers.cpp at commit 8da5bb00b690647318a12fa4f5dd7e6c8a0f501c,
 * BSD-2-Clause, Copyright (c) 2013, John Schulman).
 *
 * Scenarios, on the scripted scalar problem "minimise x²/2 subject to x >= 1",
 * whose exact violation reads 1.25 times the model's linearisation and whose
 * model step at coefficient mu aims at 1 - 0.09 / mu inside the box:
 *
 * 1. At coefficient 10 the solve takes x = 0.991 (exact violation 0.01125), after
 *    which the model's predicted improvement (0.0225) is never realised, so the
 *    box shrinks under its least and the SQP converges with the constraint
 *    violated past the tolerance 0.01. The coefficient rises to 100, the box is
 *    floored at 1e-4 / 0.1 × 1.5, and the solve converges at x = 0.9991 with
 *    the violation 0.001125, under the tolerance.
 * 2. With one coefficient only, the same solve ends `penaltyIterationLimit` at x =
 *    0.991 with the coefficient already raised to 100, as sco's member is.
 * 3. With one SQP iteration only, it ends `scoIterationLimit` after the first step
 *    taken, at x = 0.991.
 * 4. A model the convex solver cannot solve ends the solve `failed` at the start.
 *
 * The box each solve is tried in is recorded too: at coefficient 10 the solves
 * are at 2 (taken, the box grows to 3), then at 3, 0.3, 0.03, 0.003 and 0.0003
 * (none taken).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the scripted problem, its parameters and each scenario's expected iterate, coefficient, status and the boxes its solves are tried in.
 * @evidence contracts/development/testing.md#behavioral-verification Runs the public SCO.minimise and checks the returned iterate, status, coefficient and violation, and the box each solve is tried in.
 * @evidence contracts/development/testing.md#independent-expectations Each step is worked by hand from sco's rules: the first step's ratio (12.5 - 0.6035) / (12.5 - 0.5810) = 0.998 is taken and the box grows to 3; at 0.991 the exact improvement is 0, so the box shrinks by tens to 3e-5 under 1e-4; the raised box is max(3e-5, 1.5e-3); each step at coefficient 100 is taken at a ratio above 0.25 until x = 1 - 0.0009.
 * @evidence contracts/development/testing.md#distinguishing-cases Constraints met after a raise, still violated after the last coefficient, the SQP iteration limit, and a failed convex solve.
 * @evidence contracts/development/testing.md#execution-ownership One in-memory unit owns the scripted problems; it calls the actual public loop and replaces nothing.
 */
export function test_geometry_sequential_outer_penalty(): void {
  // 1. Converged violated, raised, converged met.
  const solves: IBox[] = [];
  const raised: IResult = SCO.minimise(hairProblem(solves), 0, PARAMETERS);
  TestValidator.predicate(
    "a solve converged with a violation past the tolerance goes on at a tenfold coefficient",
    raised.status === "converged" &&
      nclose(raised.x, 1 - 0.09 / 100, 1e-12) &&
      nclose(raised.coefficient, 100, 1e-12) &&
      nclose(raised.evaluation.greatest, 1.25 * 0.0009, 1e-12) &&
      raised.evaluation.greatest < PARAMETERS.cntTolerance,
  );
  const tried: number[] = solves
    .filter((b: IBox): boolean => b.coefficient === 10)
    .map((b: IBox): number => b.box);
  TestValidator.predicate(
    "the box grows by 1.5 on a step taken and shrinks by a tenth on each step not taken, until it falls under its least",
    tried.length === 6 &&
      [2, 3, 0.3, 0.03, 0.003, 0.0003].every(
        (box: number, i: number): boolean => nclose(tried[i]!, box, 1e-12),
      ),
  );
  const raisedFirst: IBox | undefined = solves.find(
    (b: IBox): boolean => b.coefficient === 100,
  );
  TestValidator.predicate(
    "the box is floored at 1e-4 / 0.1 × 1.5 when the coefficient rises",
    raisedFirst !== undefined &&
      nclose(raisedFirst.box, (1e-4 / 0.1) * 1.5, 1e-12),
  );

  // 2. Still violated after the last coefficient.
  const limited: IResult = SCO.minimise(hairProblem([]), 0, {
    ...PARAMETERS,
    maxMeritCoeffIncreases: 1,
  });
  TestValidator.predicate(
    "a solve still violated after its last coefficient ends penaltyIterationLimit",
    limited.status === "penaltyIterationLimit" &&
      nclose(limited.x, 1 - 0.09 / 10, 1e-12) &&
      nclose(limited.coefficient, 100, 1e-12) &&
      limited.evaluation.greatest >= PARAMETERS.cntTolerance,
  );

  // 3. The SQP iteration limit ends the whole solve.
  const iterated: IResult = SCO.minimise(hairProblem([]), 0, {
    ...PARAMETERS,
    maxIter: 1,
  });
  TestValidator.predicate(
    "maxIter iterations at one coefficient end the solve scoIterationLimit",
    iterated.status === "scoIterationLimit" &&
      nclose(iterated.x, 1 - 0.09 / 10, 1e-12) &&
      nclose(iterated.coefficient, 10, 1e-12),
  );

  // 4. A failed convex solve ends the solve.
  const failed: IResult = SCO.minimise(
    {
      ...hairProblem([]),
      convexify: (x: number): IModel => ({
        solve: (): IStep => ({ trial: x, merit: Infinity, failed: true }),
      }),
    },
    0,
    PARAMETERS,
  );
  TestValidator.predicate(
    "a model its solver cannot solve ends the solve failed at the start",
    failed.status === "failed" && failed.x === 0,
  );
}

/** A scalar reading. */
type IEvaluation = IAutoMovieMotionHumanSequentialConvex.IEvaluation;

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

/** A solution over one scalar. */
type IStep = IAutoMovieMotionHumanSequentialConvex.IStep<number>;

/** The box a solve was tried in, and its coefficient. */
interface IBox {
  /** The merit coefficient. */
  coefficient: number;

  /** The box. */
  box: number;
}

/** Sco's defaults with the scripted problem's box and tolerance. */
const PARAMETERS: IAutoMovieMotionHumanSequentialConvex.IParameters = {
  ...SCO.DEFAULTS,
  trustBoxSize: 2,
  cntTolerance: 0.01,
};

/** The exact violation over the linearisation's. */
const STEEPER: number = 1.25;

/** The scripted problem; each solve's box is recorded. */
function hairProblem(solves: IBox[]): IProblem {
  const evaluate: (x: number) => IEvaluation = (x: number): IEvaluation => {
    const violation: number = STEEPER * Math.max(0, 1 - x);
    return { objective: (x * x) / 2, violation, greatest: violation };
  };
  return {
    closest: (x: number): number => x,
    evaluate,
    convexify: (
      x: number,
      _current: IEvaluation,
      coefficient: number,
    ): IModel => ({
      solve: (box: number): IStep => {
        solves.push({ coefficient, box });
        const trial: number = Math.min(
          x + box,
          Math.max(x - box, 1 - 0.09 / coefficient),
        );
        return {
          trial,
          merit: (trial * trial) / 2 + coefficient * Math.max(0, 1 - trial),
          failed: false,
        };
      },
    }),
  };
}
