import { planPhysicalSimulationSteps } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

/**
 * `planPhysicalSimulationSteps(start, film steps, cadence)` gives the steps a
 * dynamic run performs after the one it resumes from, and the snapshots after
 * each multiple of the cadence among them.
 *
 * Scenarios:
 *
 * 1. A fresh 30-step run every 10 performs 30 steps and snapshots after 10, 20 and
 *    30.
 * 2. A 25-step film every 10 snapshots after 10 and 20, not after its last step; a
 *    10-step film every 10 after 10; a 5-step film every 10 never.
 * 3. A run resumed at 20 every 10 performs 10 steps and snapshots after 30 only.
 * 4. A run resumed at 24 every step performs 6 steps and snapshots 25 to 30.
 * 5. A run resumed at the film's end performs no step and no snapshot.
 */
export function test_unit_engine_physics_simulation_steps(): void {
  TestValidator.equals("fresh", planPhysicalSimulationSteps(0, 30, 10), {
    steps: 30,
    snapshots: [10, 20, 30],
  });
  TestValidator.equals("between", planPhysicalSimulationSteps(0, 25, 10), {
    steps: 25,
    snapshots: [10, 20],
  });
  TestValidator.equals("on", planPhysicalSimulationSteps(0, 10, 10), {
    steps: 10,
    snapshots: [10],
  });
  TestValidator.equals("before", planPhysicalSimulationSteps(0, 5, 10), {
    steps: 5,
    snapshots: [],
  });
  TestValidator.equals("resumed", planPhysicalSimulationSteps(20, 30, 10), {
    steps: 10,
    snapshots: [30],
  });
  TestValidator.equals("every", planPhysicalSimulationSteps(24, 30, 1), {
    steps: 6,
    snapshots: [25, 26, 27, 28, 29, 30],
  });
  TestValidator.equals("end", planPhysicalSimulationSteps(30, 30, 10), {
    steps: 0,
    snapshots: [],
  });
}
