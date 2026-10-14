import { ease } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../internal/throwsError";

/**
 * Runtime callers can bypass the TypeScript `AutoMovieEasing` union, so the
 * engine boundary must reject unknown curve names instead of leaking an
 * undefined eased progress into interpolation.
 *
 * Scenarios:
 * 1. The forged easing name elastic refuses with its unknown-curve diagnostic.
 *
 * @evidence contracts/testing.md#behavioral-verification Passes a runtime value outside AutoMovieEasing to the actual ease dispatcher and requires its unknown-curve Error. Returning undefined, a scalar fallback or an unrelated exception fails.
 * @evidence contracts/testing.md#independent-expectations The public closed easing vocabulary excludes elastic, and runtime admission promises an unknown-curve refusal. The literal diagnostic fragment identifies that boundary independently of the implementation's return value.
 * @evidence contracts/testing.md#distinguishing-cases Keeps the single unsupported-curve input at ordinary progress one-half. Supported names, endpoints/clamping, nonfinite progress and parameterized Bezier controls belong to the other easing entries.
 * @evidence contracts/testing.md#execution-ownership This named synchronous unit owns its forged-input case and invokes portable source with the existing exception observer, without consumer installation, native compilation, host startup or dynamic registration.
 */
export function test_motion_easing_invalid_curve(): void {
  TestValidator.predicate(
    "unknown easing curve rejects",
    throwsError(
      (): number => ease("elastic" as never, 0.5),
      'unknown easing curve "elastic"',
    ),
  );
}
