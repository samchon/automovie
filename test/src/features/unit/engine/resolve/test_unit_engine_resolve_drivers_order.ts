import { runResolveDriversOrderScenario } from "../../../internal/runResolveDriversOrderScenario";

/**
 * Value drivers evaluate dependencies before consumers and preserve deferral.
 *
 * Scenarios:
 * 1. Reverse-authored /x-to-/y-to-/z drivers produce 1, 2 and 4 in one pass.
 * 2. Shared dependencies feed distinct dependents without losing their outputs.
 * 3. World aim descriptors defer.
 */
export function test_unit_engine_resolve_drivers_order(): void {
  runResolveDriversOrderScenario();
}
