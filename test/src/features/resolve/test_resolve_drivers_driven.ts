import { runResolveDriversDrivenScenario } from "../internal/runResolveDriversDrivenScenario";

/**
 * Scalar driven channels map linear ranges or authored curves and reject malformed source, output and mapping data.
 *
 * Scenarios:
 * 1. Present source5 maps [0,10] to50 on [0,100].
 * 2. Missing source selects the lower input and output endpoints.
 * 3. Clamping source20 yields100, while omitted clamp extrapolates to200.
 * 4. Degenerate [5,5] input yields the lower output3.
 * 5. Curves work without linear fields, interpolate8.5 to55 and hold below/above endpoints.
 * 6. Empty or vector source values, an empty curve and duplicate coordinates throw.
 * 7. Node TRS and nonscalar pointer outputs throw before a scalar write.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs the existing driven scenarios through actual resolveDrivers, checking output width/values and diagnostic fragments for invalid inputs rather than inspecting source or configuration arrangement.
 * @evidence contracts/development/testing.md#independent-expectations Linear interval arithmetic gives50/100/200, the lower-bound default gives7 or3, and midpoint interpolation on (7,10)-(10,100) gives55; literal endpoints and scalar-width requirements supply the remaining expectations independently of the implementation.
 * @evidence contracts/development/common.md#meaningful-documentation Ordinary mapping, missing source, clamp, extrapolation, degenerate intervals and curve endpoint holds have distinct numeric witnesses. Malformed values and nonscalar destinations refuse.
 */
export function test_resolve_drivers_driven(): void {
  runResolveDriversDrivenScenario();
}
