import { runResolveDriversCycleScenario } from "../internal/runResolveDriversCycleScenario";

/**
 * Reciprocal value-driver dependencies refuse before execution.
 *
 * Scenarios:
 * 1. Two copy rotation drivers referring to each other's outputs throw the dependency-cycle fault.
 *
 * @evidence contracts/testing.md#behavioral-verification Runs the maintained reciprocal-copy scenario through real resolveDrivers and asserts its dependency-cycle error, catching an ordering implementation that loops or silently executes a cyclic graph.
 * @evidence contracts/testing.md#independent-expectations Each authored rotation output is the other's input, forming an explicit two-edge directed cycle that has no topological evaluation order; refusal follows that graph property independently of the producer's DFS.
 * @evidence contracts/testing.md#distinguishing-cases This unit owns the reciprocal-cycle negative case; acyclic chains, shared dependencies, world deferral and unknown kinds are positive/adjacent controls in test_resolve_drivers_order.
 * @evidence contracts/testing.md#execution-ownership The discoverable synchronous test_resolve_drivers_cycle delegates direct numerical/map cases to runResolveDriversCycleScenario, with no dynamic registry, consumer installation, native artifact or real host.
 */
export function test_resolve_drivers_cycle(): void {
  runResolveDriversCycleScenario();
}
