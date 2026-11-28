import { AutoMovieEngineSoftBody } from "@automovie/engine";
import type { IAutoMovieSoftBodyDomain } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { softPanel } from "../../internal/softFixtures";

/**
 * `softBodyStepAt` is the whole fixed steps elapsed by a shot second, `⌊t /
 * dt⌋`, with negative time held at step zero and a 1e-9 step allowance for
 * rounding just below a boundary.
 *
 * Scenarios:
 *
 * 1. Dt = 1/64 s: 0.5 s is step 32, 0.51 s is step 32.
 * 2. A second rounded just below a boundary, 32/64 − 1e-15, still reads 32.
 * 3. Negative time reads step 0.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls AutoMovieEngineSoftBody.softBodyStepAt with a 1/64-second clock at an exact boundary, inside a step, just below a boundary and during pre-roll.
 * @evidence contracts/development/testing.md#independent-expectations A half-second is 32 steps, and 0.51 seconds is inside step 32. Subtracting 1e-15 second shifts the former by less than the declared 1e-9-step allowance. Pre-roll has zero elapsed time.
 * @evidence contracts/development/common.md#meaningful-documentation Exact time, interior time, rounding just below the boundary and negative time exercise the clock's four tested decisions.
 */
export function test_engine_soft_body_step_at(): void {
  const domain: IAutoMovieSoftBodyDomain = softPanel({ columns: 2, rows: 2 });
  TestValidator.equals("on a boundary", AutoMovieEngineSoftBody.softBodyStepAt(domain, 0.5), 32);
  TestValidator.equals("inside a step", AutoMovieEngineSoftBody.softBodyStepAt(domain, 0.51), 32);
  TestValidator.equals(
    "just below a boundary",
    AutoMovieEngineSoftBody.softBodyStepAt(domain, 0.5 - 1e-15),
    32,
  );
  TestValidator.equals("before the start", AutoMovieEngineSoftBody.softBodyStepAt(domain, -1), 0);
}
