import { runResolveDriversDrivenScenario } from "../../../internal/runResolveDriversDrivenScenario";

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
 */
export function test_unit_engine_resolve_drivers_driven(): void {
  runResolveDriversDrivenScenario();
}
