import { ease } from "@automovie/engine";
import { AutoMovieEasing } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/predicates";

/**
 * The four named polynomial easing curves retain their endpoint and clamping
 * values. Interior shape and pose interpolation are observed in other entries.
 *
 * Scenarios:
 * 1. Linear, easeIn, easeOut and easeInOut return zero/one at progress zero/one.
 * 2. Each curve clamps progress -1 to zero and progress two to one.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls ease for each of four named curves at both endpoints and both exterior inputs, asserting retained endpoint values. Broken clamping or an endpoint offset fails without depending on the intermediate curve shape.
 * @evidence contracts/testing.md#independent-expectations Normalized polynomial easing fixes zero and one, and finite exterior progress is clamped to that closed interval by contract. Literal scalar endpoints are independent of product output; this entry does not prove interior boundedness or interpolated pose identity.
 * @evidence contracts/testing.md#distinguishing-cases Keeps all four continuous named curves at zero, one, -1 and two. Step/interior shape, parameterized Bezier curves and malformed input are owned by their separate easing entries.
 * @evidence contracts/testing.md#execution-ownership The named synchronous unit owns its four-curve loop and directly calls portable easing source, without installed consumers, native builds, host startup or dynamic registration.
 */
export function test_motion_easing_endpoints(): void {
  const curves: AutoMovieEasing[] = [
    "linear",
    "easeIn",
    "easeOut",
    "easeInOut",
  ];
  for (const c of curves) {
    TestValidator.predicate(`${c} at 0 = 0`, nclose(ease(c, 0), 0));
    TestValidator.predicate(`${c} at 1 = 1`, nclose(ease(c, 1), 1));
    TestValidator.predicate(`${c} clamps below`, nclose(ease(c, -1), 0));
    TestValidator.predicate(`${c} clamps above`, nclose(ease(c, 2), 1));
  }
}
