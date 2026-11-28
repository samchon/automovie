import type { IAutoMovieMotionHumanSequentialConvex } from "@automovie/interface";
import {
  HumanSequentialConvex
} from "../../../../../packages/motions/src/posture/internal/HumanSequentialConvex";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/** Twelve rounded updates at the largest state and box magnitude of three. */
const STEP_ROUNDING: number = 12 * 3 * Number.EPSILON;

/**
 * `HumanSequentialConvex.minimise`, trajopt's trust-region SQP, on two
 * one-variable problems whose models and merits are hand-computed.
 *
 * Scenarios:
 *
 * 1. `x²` subject to `x ≥ 1` from 3, the model exact (the quadratic itself and the
 *    hinge `10 max(0, 1 − x − d)`): every step's predicted merit improvement is
 *    the actual one, so every step is taken and the box grows by 1.5 from 0.1:
 *    3, 2.9, 2.75, 2.525, 2.1875, 1.68125, then the model's minimum, 1, which
 *    meets the constraint at the first coefficient, 10, converged.
 * 2. `x⁴` from 1 on its first-order model `1 + 4d` in a box of 2: the model
 *    predicts 8 for the step to −1 and the merit improves by 0, a ratio under
 *    0.25, so the box shrinks to 0.2; the step to 0.8 predicts 0.8 and improves
 *    by `1 − 0.8⁴ = 0.5904`, a ratio of 0.738, and is taken. One iteration then
 *    ends the solve at its limit.
 * 3. Starting the exact constrained quadratic at zero with penalty one
 *    gives the unconstrained penalized minimum at `x = 1/2`. TrajOpt's outer
 *    penalty loop multiplies by ten and reaches `x = 1`; a single allowed
 *    coefficient leaves `x = 1/2` and reports the penalty iteration limit.
 *
 * @see https://escholarship.org/content/qt6km506db/qt6km506db.pdf Schulman et al. 2014, §3, Algorithm 1.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines trust-region acceptance and shrink, outer penalty increase and explicit iteration limits.
 * @evidence contracts/development/testing.md#behavioral-verification Minimizes a constrained quadratic with exact model and a quartic with overoptimistic first-order model, then restricts penalty iterations.
 * @evidence contracts/development/testing.md#independent-expectations Trial arithmetic fixes the rejected ratio zero and accepted improvement 0.5904. A single penalty gives x = 1/2, while increased penalty attains the x = 1 constraint.
 */
export function test_motions_posture_sequential_convex(): void {
  type IReading = IAutoMovieMotionHumanSequentialConvex.IEvaluation;
  const clamp = (v: number, box: number): number =>
    Math.min(box, Math.max(-box, v));

  // 1. An exact model.
  const visited: number[] = [];
  const constrained: IAutoMovieMotionHumanSequentialConvex.IProblem<
    number,
    IReading
  > = {
    closest: (x: number): number => x,
    evaluate: (x: number): IReading => {
      visited.push(x);
      return {
        objective: x * x,
        violation: Math.max(0, 1 - x),
        greatest: Math.max(0, 1 - x),
      };
    },
    convexify: (
      x: number,
      _: IReading,
      coefficient: number,
    ): IAutoMovieMotionHumanSequentialConvex.IModel<number> => ({
      solve: (
        box: number,
      ): IAutoMovieMotionHumanSequentialConvex.IStep<number> => {
        // The derivative below the hinge is 2x − c. Its zero minimises the
        // merit up to x = 1, where the derivative above the hinge is positive.
        const minimum: number = Math.min(1, coefficient / 2);
        const trial: number = x + clamp(minimum - x, box);
        return {
          trial,
          merit: trial * trial + coefficient * Math.max(0, 1 - trial),
          failed: false,
        };
      },
    }),
  };
  const solved: IAutoMovieMotionHumanSequentialConvex.IResult<
    number,
    IReading
  > = HumanSequentialConvex.minimise(
    constrained,
    3,
    HumanSequentialConvex.DEFAULTS,
  );
  const path: number[] = [3, 2.9, 2.75, 2.525, 2.1875, 1.68125, 1];
  TestValidator.predicate(
    "an exact model takes every step",
    solved.status === "converged" &&
      solved.coefficient === 10 &&
      nclose(solved.x, 1, STEP_ROUNDING) &&
      path.every((p: number, i: number): boolean =>
        nclose(visited[i]!, p, STEP_ROUNDING),
      ),
  );

  // 2. A first-order model of x⁴.
  const boxes: number[] = [];
  const quartic: IAutoMovieMotionHumanSequentialConvex.IProblem<
    number,
    IReading
  > = {
    closest: (x: number): number => x,
    evaluate: (x: number): IReading => ({
      objective: x ** 4,
      violation: 0,
      greatest: 0,
    }),
    convexify: (
      x: number,
    ): IAutoMovieMotionHumanSequentialConvex.IModel<number> => ({
      solve: (
        box: number,
      ): IAutoMovieMotionHumanSequentialConvex.IStep<number> => {
        boxes.push(box);
        const d: number = -box * Math.sign(4 * x ** 3);
        return { trial: x + d, merit: x ** 4 + 4 * x ** 3 * d, failed: false };
      },
    }),
  };
  const shrunk: IAutoMovieMotionHumanSequentialConvex.IResult<
    number,
    IReading
  > = HumanSequentialConvex.minimise(quartic, 1, {
    ...HumanSequentialConvex.DEFAULTS,
    trustBoxSize: 2,
    maxIter: 1,
  });
  TestValidator.predicate(
    "an overpredicting model shrinks its box",
    boxes.length === 2 &&
      boxes[0] === 2 &&
      nclose(boxes[1]!, 0.2, STEP_ROUNDING) &&
      nclose(shrunk.x, 0.8, STEP_ROUNDING) &&
      shrunk.status === "scoIterationLimit",
  );

  const starts: IAutoMovieMotionHumanSequentialConvex.IParameters = {
    ...HumanSequentialConvex.DEFAULTS,
    meritErrorCoeff: 1,
    trustBoxSize: 1,
  };
  const adjusted = HumanSequentialConvex.minimise(constrained, 0, starts);
  const exhausted = HumanSequentialConvex.minimise(constrained, 0, {
    ...starts,
    maxMeritCoeffIncreases: 1,
  });
  TestValidator.equals(
    "the penalty increases until the constraint is satisfied",
    [
      adjusted.status,
      adjusted.coefficient,
      adjusted.x,
      adjusted.evaluation.greatest,
    ],
    ["converged", 10, 1, 0],
  );
  TestValidator.equals(
    "one allowed coefficient ends at the infeasible penalized minimum",
    [exhausted.status, exhausted.x, exhausted.evaluation.greatest],
    ["penaltyIterationLimit", 1 / 2, 1 / 2],
  );
}
