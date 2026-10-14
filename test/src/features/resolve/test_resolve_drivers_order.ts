import { runResolveDriversOrderScenario } from "../internal/runResolveDriversOrderScenario";

/**
 * Value drivers evaluate dependencies before consumers and preserve deferral.
 *
 * Scenarios:
 * 1. Reverse-authored /x-to-/y-to-/z drivers produce 1, 2 and 4 in one pass.
 * 2. Shared dependencies feed distinct dependents without losing their outputs.
 * 3. World aim descriptors defer and unknown driver kinds throw.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls the maintained runResolveDriversOrderScenario harness, which invokes real resolveDrivers and checks chained/shared output values, world deferral and unknown-kind refusal; unrelated producer ordering cannot replace dependency evaluation.
 * @evidence contracts/testing.md#independent-expectations Authored ranges independently map x=1 to y=2 and then z=4; the shared dependency maps its explicit input to 5 before separate p/q mappings produce 1/2. Expected numbers follow hand linear arithmetic rather than orderValueDrivers output.
 * @evidence contracts/testing.md#distinguishing-cases Reverse producer order, a shared dependency, independent outputs, deferred aim and unknown-kind neighbors distinguish the decisions; reciprocal cycle refusal belongs to test_resolve_drivers_cycle and curve/width guards have their own units.
 * @evidence contracts/testing.md#execution-ownership The discoverable synchronous test_resolve_drivers_order calls the shared portable runResolveDriversOrderScenario harness; that helper owns these direct cases without dynamic registration, consumer install or a real host.
 */
export function test_resolve_drivers_order(): void {
  runResolveDriversOrderScenario();
}
