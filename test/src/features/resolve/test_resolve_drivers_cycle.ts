import { runResolveDriversCycleScenario } from "../internal/runResolveDriversCycleScenario";

/**
 * Reciprocal value-driver dependencies refuse before execution.
 *
 * Scenarios:
 * 1. Two copy rotation drivers referring to each other's outputs throw the dependency-cycle fault.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs the maintained reciprocal-copy scenario through real resolveDrivers and asserts its dependency-cycle error, catching an ordering implementation that loops or silently executes a cyclic graph.
 * @evidence contracts/development/testing.md#independent-expectations Each authored rotation output is the other's input, forming an explicit two-edge directed cycle that has no topological evaluation order; refusal follows that graph property independently of the producer's DFS.
 * @evidence contracts/development/common.md#meaningful-documentation Two rotations copy each other's output. The resulting driver dependency cycle throws.
 */
export function test_resolve_drivers_cycle(): void {
  runResolveDriversCycleScenario();
}
