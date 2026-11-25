import { AutoMovieGravity } from "@automovie/engine";
import { run } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

namespace part_run_speed {
  /** Rounding of one square root, m/s. */
  const ROUNDING: number = 1e-12;

  /** The hip height, metres. */
  const HIP: number = 0.9;

  /**
   * `run.speed` is a pace's speed from its Froude number, `v = sqrt(Fr g l)` with
   * `l` the hip height.
   *
   * Scenarios, for a 0.9 m hip height:
   *
   * 1. The run (Fr 1.3) goes `sqrt(1.3 * 9.80665 * 0.9)`, and is the pace when none
   *    is given.
   * 2. The jog (Fr 0.6) and the sprint (Fr 5) go by their own numbers.
   */
  export function verify(): void {
    const body: run.IBody = { measure: { hipHeight: HIP } };
    const g: number = AutoMovieGravity.STANDARD;
    TestValidator.predicate(
      "the run",
      nclose(run.speed(body, "run"), Math.sqrt(1.3 * g * HIP), ROUNDING) &&
        run.speed(body) === run.speed(body, "run"),
    );
    TestValidator.predicate(
      "the jog and the sprint",
      nclose(run.speed(body, "jog"), Math.sqrt(0.6 * g * HIP), ROUNDING) &&
        nclose(run.speed(body, "sprint"), Math.sqrt(5 * g * HIP), ROUNDING),
    );
  }
}

/**
 * `run`'s unit contract: its speed.
 *
 * Its parts, each documented with its own scenarios:
 *
 * - `run_speed`: `run.speed` is a pace's speed from its Froude number, `v =
 *   sqrt(Fr g l)` with `l` the hip height.
 */
export async function test_unit_motions_actions_run(): Promise<void> {
  part_run_speed.verify();
}
