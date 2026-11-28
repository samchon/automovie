import { runResolveDriversOrderScenario } from "../internal/runResolveDriversOrderScenario";

/**
 * Value drivers evaluate dependencies before consumers and preserve deferral.
 *
 * Scenarios:
 * 1. Reverse-authored /x-to-/y-to-/z drivers produce 1, 2 and 4 in one pass.
 * 2. Shared dependencies feed distinct dependents without losing their outputs.
 * 3. World aim descriptors defer.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the maintained runResolveDriversOrderScenario harness, which invokes real resolveDrivers and checks chained/shared output values, world deferral; unrelated producer ordering cannot replace dependency evaluation.
 * @evidence contracts/development/testing.md#independent-expectations Authored ranges independently map x=1 to y=2 and then z=4; the shared dependency maps its explicit input to 5 before separate p/q mappings produce 1/2. Expected numbers follow hand linear arithmetic rather than orderValueDrivers output.
 * @evidence contracts/development/common.md#meaningful-documentation Reverse-authored chains still evaluate dependencies first, and shared dependencies feed more than one output. World aim remains deferred in the local pass.
 */
export function test_resolve_drivers_order(): void {
  runResolveDriversOrderScenario();
}
