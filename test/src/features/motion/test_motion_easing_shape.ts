import { ease } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/predicates";

/**
 * Beyond their endpoints, the easing curves must have their characteristic
 * shapes. This is what makes motion feel linear, eased, or snapped rather than
 * merely landing in the right place. Pins the qualitative behaviour of each
 * named curve.
 *
 * Scenarios:
 *
 * 1. Linear is the identity (0.37 → 0.37).
 * 2. EaseInOut is symmetric about its midpoint (0.5 → 0.5) and never decreases.
 * 3. EaseIn lags behind linear early (0.25 → < 0.25) while easeOut leads it (0.25
 *    → > 0.25).
 * 4. Step holds at 0 until the very end, reaching 1 only at t=1.
 *
 * @evidence contracts/testing.md#behavioral-verification Evaluates ease at literal interior values and step boundaries, then checks eleven easeInOut samples for nondecrease. Flattened or exchanged named curves and an early step transition fail the retained observations.
 * @evidence contracts/testing.md#independent-expectations Linear progress is unchanged, easeInOut fixes its symmetric midpoint, quadratic easeIn lags and easeOut leads linear at one-quarter, and step changes only at the closed endpoint. The eleven-sample ordering check does not prove continuous monotonicity between samples.
 * @evidence contracts/testing.md#distinguishing-cases Preserves linear .37, midpoint .5, early .25 for both asymmetric curves, step .99/1 and the full zero-through-one eleven-sample sweep. Exterior clamping and invalid values are owned by separate entries.
 * @evidence contracts/testing.md#execution-ownership The discoverable synchronous unit owns every assertion and local sample loop and invokes portable easing source, without installed consumers, native compilation, process/browser/GPU startup or dynamic registration.
 */
export function test_motion_easing_shape(): void {
  TestValidator.predicate(
    "linear is identity",
    nclose(ease("linear", 0.37), 0.37),
  );
  TestValidator.predicate(
    "easeInOut symmetric midpoint",
    nclose(ease("easeInOut", 0.5), 0.5),
  );
  TestValidator.predicate("easeIn lags early", ease("easeIn", 0.25) < 0.25);
  TestValidator.predicate("easeOut leads early", ease("easeOut", 0.25) > 0.25);
  TestValidator.predicate("step before end", nclose(ease("step", 0.99), 0));
  TestValidator.predicate("step at end", nclose(ease("step", 1), 1));

  let prev: number = -1;
  let monotonic: boolean = true;
  for (let i: number = 0; i <= 10; ++i) {
    const v: number = ease("easeInOut", i / 10);
    if (v < prev) monotonic = false;
    prev = v;
  }
  TestValidator.predicate("easeInOut is monotonic", monotonic);
}
