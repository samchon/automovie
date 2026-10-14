import { solveBallisticLaunch, solveMovingLaunch } from "@automovie/engine";
import { IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * Ballistic speed is a physical magnitude. Non-finite values must behave like
 * invalid speeds and return `null` before the solver can emit `NaN` velocity or
 * hit-time components.
 *
 * Scenarios:
 *
 * 1. Static and moving launch solvers reject `NaN` and both infinities.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls both launch solvers with non-finite speed and requires null, catching fabricated non-finite launch results.
 * @evidence contracts/testing.md#independent-expectations A physical speed must be finite; null is the admission contract and does not depend on another solver's output. This case does not establish finite-speed reachability.
 * @evidence contracts/testing.md#distinguishing-cases Covers NaN and both infinity signs in static and moving entry points; neighboring launch tests own finite, vertical and out-of-range cases.
 * @evidence contracts/testing.md#execution-ownership The named exported unit entry calls portable engine functions with an authored target callback; it starts no host or dynamic cases.
 */
export function test_physics_ballistic_non_finite_speed(): void {
  const origin: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };
  const target: IAutoMovieVector3 = { x: 8, y: 1, z: 0 };

  for (const speed of [Number.NaN, Infinity, -Infinity]) {
    TestValidator.predicate(
      `static ${String(speed)} speed is null`,
      solveBallisticLaunch(origin, target, speed) === null,
    );
    TestValidator.predicate(
      `moving ${String(speed)} speed is null`,
      solveMovingLaunch(origin, (): IAutoMovieVector3 => target, speed) ===
        null,
    );
  }
}
