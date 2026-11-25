import type { IAutoMovieMotionHumanSequentialConvex } from "@automovie/interface";
import { HumanSequentialConvex } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

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
 */
export function test_unit_motions_posture_sequential_convex(): void {
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
        // The model x² + c max(0, 1 − x) is minimised at 1 (c > 2): the step
        // toward 1, inside the box.
        const trial: number = x + clamp(1 - x, box);
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
}
