import { runResolveDriversCycleScenario } from "../../../internal/runResolveDriversCycleScenario";

/**
 * Reciprocal value-driver dependencies refuse before execution.
 *
 * Scenarios:
 * 1. Two copy rotation drivers referring to each other's outputs throw the dependency-cycle fault.
 */
export function test_unit_engine_resolve_drivers_cycle(): void {
  runResolveDriversCycleScenario();
}
