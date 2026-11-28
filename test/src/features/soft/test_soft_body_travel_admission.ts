import { AutoMovieEngineSoftBody } from "@automovie/engine";
import {
  IAutoMovieConstraintViolation,
  IAutoMovieSoftBodyDomain,
  IAutoMovieValidation,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { hasViolation } from "../internal/hasViolation";
import { softPanel } from "../internal/softFixtures";

/**
 * Finite timestep inputs cannot bypass the authored travel limit by overflowing its ratio.
 *
 * Scenarios:
 *
 * 1. A quarter-metre structural edge admits dt 1/8 and exact-boundary dt 1/4 at reference speed 1.
 * 2. dt 1/2 is a finite overshoot, while the largest finite dt overflows division by 1/4; both refuse the timestep path.
 * 3. Largest finite dt and speed overflow their product and remain refused, with no invented finite overshoot measurement.
 *
 * @evidence contracts/development/testing.md#behavioral-verification The real domain validator decides success and the timestep-path range finding; finite and overflow overshoots catch the skipped-Infinity branch while adjacent admitted inputs preserve the limit's boundary.
 * @evidence contracts/development/testing.md#independent-expectations The existing fixture places two particles exactly 1/4 metre apart. At unit reference speed, dt 1/8 travels half that edge, dt 1/4 equals it, and dt 1/2 exceeds it; the largest finite dt exceeds the same edge independently of a ratio calculation's representability.
 * @evidence contracts/development/common.md#meaningful-documentation Half-edge and exact-edge steps pass. A finite overshoot and overflow in the division or product each refuse the timestep.
 */
export function test_soft_body_travel_admission(): void {
  const base: IAutoMovieSoftBodyDomain = softPanel({
    columns: 2,
    rows: 1,
    spacing: { u: 1 / 4, v: 1 / 4 },
  });
  const check: (step: number, speed?: number) => IAutoMovieValidation = (
    step: number,
    speed: number = 1,
  ): IAutoMovieValidation =>
    AutoMovieEngineSoftBody.validateSoftBodyDomain({
      domain: {
        ...base,
        solver: {
          ...base.solver,
          fixedStepSeconds: step,
          referenceSpeed: speed,
        },
      },
    });
  TestValidator.equals(
    "below the declared travel limit is admitted",
    check(1 / 8).success,
    true,
  );
  TestValidator.equals(
    "exact travel boundary is admitted",
    check(1 / 4).success,
    true,
  );
  for (const [name, step, speed] of [
    ["finite overshoot", 1 / 2, 1],
    ["division overflow", Number.MAX_VALUE, 1],
    ["product overflow", Number.MAX_VALUE, Number.MAX_VALUE],
  ] as const) {
    const result: IAutoMovieValidation = check(step, speed);
    TestValidator.equals(
      name + " refuses the timestep path",
      hasViolation(result, "range", "solver.fixedStepSeconds"),
      true,
    );
    if (name !== "finite overshoot" && result.success === false)
      TestValidator.equals(
        name + " does not invent a finite overshoot",
        result.violations
          .filter((item: IAutoMovieConstraintViolation): boolean =>
            item.path.includes("solver.fixedStepSeconds"),
          )
          .every(
            (item: IAutoMovieConstraintViolation): boolean =>
              item.overshoot === undefined,
          ),
        true,
      );
  }
}
