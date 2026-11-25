import { softBodyStepAt } from "@automovie/engine";
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
 */
export function test_engine_soft_body_step_at(): void {
  const domain: IAutoMovieSoftBodyDomain = softPanel({ columns: 2, rows: 2 });
  TestValidator.equals("on a boundary", softBodyStepAt(domain, 0.5), 32);
  TestValidator.equals("inside a step", softBodyStepAt(domain, 0.51), 32);
  TestValidator.equals(
    "just below a boundary",
    softBodyStepAt(domain, 0.5 - 1e-15),
    32,
  );
  TestValidator.equals("before the start", softBodyStepAt(domain, -1), 0);
}
