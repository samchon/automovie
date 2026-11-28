import { AutoMovieEnginePhysicalStepPlanner } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

/**
 * `AutoMovieEnginePhysicalStepPlanner.plan(start, film steps, cadence)` gives the steps a
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
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines which intervals run after resume and which completion ticks are snapshots for a fixed cadence.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the planner on fresh, resumed and already complete ranges with cadence 10 or 1.
 * @evidence contracts/development/testing.md#independent-expectations Counting ticks gives snapshots 10, 20 and 30 for a fresh 30-step run, only 30 after resume at 20, and none for a completed run.
 */
export function test_engine_physics_simulation_steps(): void {
  TestValidator.equals("fresh", AutoMovieEnginePhysicalStepPlanner.plan(0, 30, 10), {
    steps: 30,
    snapshots: [10, 20, 30],
  });
  TestValidator.equals("between", AutoMovieEnginePhysicalStepPlanner.plan(0, 25, 10), {
    steps: 25,
    snapshots: [10, 20],
  });
  TestValidator.equals("on", AutoMovieEnginePhysicalStepPlanner.plan(0, 10, 10), {
    steps: 10,
    snapshots: [10],
  });
  TestValidator.equals("before", AutoMovieEnginePhysicalStepPlanner.plan(0, 5, 10), {
    steps: 5,
    snapshots: [],
  });
  TestValidator.equals("resumed", AutoMovieEnginePhysicalStepPlanner.plan(20, 30, 10), {
    steps: 10,
    snapshots: [30],
  });
  TestValidator.equals("every", AutoMovieEnginePhysicalStepPlanner.plan(24, 30, 1), {
    steps: 6,
    snapshots: [25, 26, 27, 28, 29, 30],
  });
  TestValidator.equals("end", AutoMovieEnginePhysicalStepPlanner.plan(30, 30, 10), {
    steps: 0,
    snapshots: [],
  });
}
