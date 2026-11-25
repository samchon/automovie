import { smoothMinimum } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";
import { throwsError } from "../../internal/throwsError";

/** Rounding of one quadratic. */
const ROUNDING: number = 1e-12;

/**
 * `smoothMinimum` is the quadratic smooth minimum `min(a, b) - h^2 w / 4` with
 * `h = max(w - |a - b|, 0) / w`.
 *
 * Scenarios:
 *
 * 1. Equal inputs and width 1 give h = 1: 0 - 1/4 = -0.25.
 * 2. A = 1, b = 0.5, width 1 give h = 0.5: 0.5 - 0.25 / 4 = 0.4375.
 * 3. Inputs further apart than the width give the plain minimum.
 * 4. A zero width is refused.
 */
export function test_engine_motion_smooth_minimum(): void {
  TestValidator.predicate(
    "equal inputs",
    nclose(smoothMinimum(0, 0, 1), -0.25, ROUNDING),
  );
  TestValidator.predicate(
    "a blend",
    nclose(smoothMinimum(1, 0.5, 1), 0.4375, ROUNDING),
  );
  TestValidator.equals("far apart", smoothMinimum(5, 1, 2), 1);
  TestValidator.predicate(
    "a zero width",
    throwsError(() => smoothMinimum(1, 2, 0), "positive finite width"),
  );
}
