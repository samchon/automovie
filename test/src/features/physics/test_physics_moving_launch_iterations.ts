import {
  IAutoMovieBallisticSolution,
  solveMovingLaunch,
} from "@automovie/engine";
import { IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { namedFacts } from "../internal/predicates";

const origin: IAutoMovieVector3 = { x: 0, y: 1.6, z: 0 };
const target: (t: number) => IAutoMovieVector3 = (
  t: number,
): IAutoMovieVector3 => ({
  x: 6 + 3 * t,
  y: 1,
  z: 0,
});

/**
 * `solveMovingLaunch` uses `iterations` as the fixed-point loop cap. Invalid
 * caps must fail like the solver's other invalid scalar inputs rather than
 * becoming fractional or unbounded loop limits.
 *
 * Scenarios:
 *
 * 1. Non-finite, non-integer, and less-than-one iteration counts return `null`.
 * 2. The valid boundary `iterations = 1` still returns a best-so-far partial
 *    solve.
 *
 * @evidence contracts/testing.md#behavioral-verification Requests moving leads with invalid iteration caps and requires null, then admits one step with a positive flight time, catching fractional/unbounded iteration or rejection of the valid lower boundary.
 * @evidence contracts/testing.md#independent-expectations A positive integer cap is the declared bounded-iteration contract; authored invalid scalars and the admitted one-step lower boundary supply expectations independently of candidate arithmetic. This unit does not establish intercept accuracy.
 * @evidence contracts/testing.md#distinguishing-cases Contrasts NaN, infinity, fractional 1.5, zero and negative caps with one admitted step; convergence and closest-candidate selection belong to neighboring moving-launch units.
 * @evidence contracts/testing.md#execution-ownership The named exported portable unit owns the local cases and calls solveMovingLaunch with an authored callback, without hosts or dynamic registration.
 */
export function test_physics_moving_launch_iterations(): void {
  for (const iterations of [Number.NaN, Infinity, 1.5, 0, -1])
    TestValidator.predicate(
      `iterations ${iterations} returns null`,
      solveMovingLaunch(origin, target, 20, undefined, "direct", iterations) ===
        null,
    );

  const partial: IAutoMovieBallisticSolution | null = solveMovingLaunch(
    origin,
    target,
    20,
    undefined,
    "direct",
    1,
  );
  TestValidator.equals(
    "one iteration remains a valid partial solve",
    namedFacts([
      ["partial", (): boolean => partial !== null],
      [
        "partialHitTime",
        (): boolean => partial !== null && partial.hitTime > 0,
      ],
    ]),
    { partial: true, partialHitTime: true },
  );
}
