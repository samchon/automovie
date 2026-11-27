import {
  punchCorrected
} from "../../../../../packages/motions/src/striking/internal/punchCorrected";
import { TestValidator } from "@nestia/e2e";

import { vclose } from "../../internal/vclose";

/**
 * The corrected punch tracker (`punchCorrected`): the goal is the planned point
 * plus every correction's end arrived by a second, and each correction is a
 * minimum-jerk unit of its own start, length and displacement.
 *
 * Scenario: planned at (0, 0, 1) with corrections ending at (1, 0, 0) and (0,
 * 2, 0), the goal is (1, 2, 1) and the units carry those displacements. An
 * earlier seek reads the first correction alone, from the same preparation.
 */
export function test_motions_striking_punch_corrected(): void {
  let reads: number = 0;
  const tracker = punchCorrected({
    tracker: { planned: { x: 0, y: 0, z: 1 } },
    contact: {
      corrected: () => {
        ++reads;
        return [
          {
            start: 0,
            duration: 1,
            end: { x: 1, y: 0, z: 0 },
          },
          {
            start: 0.5,
            duration: 0.8,
            end: { x: 0, y: 2, z: 0 },
          },
        ];
      },
    },
  });
  TestValidator.predicate(
    "the goal",
    vclose(tracker.goal(1), { x: 1, y: 2, z: 1 }, 1e-12),
  );
  TestValidator.equals("the units", tracker.units(1), [
    { displacement: { x: 1, y: 0, z: 0 }, start: 0, duration: 1 },
    { displacement: { x: 0, y: 2, z: 0 }, start: 0.5, duration: 0.8 },
  ]);
  TestValidator.predicate(
    "the late correction joins at its exact start",
    vclose(tracker.goal(0.49), { x: 1, y: 0, z: 1 }, 1e-12) &&
      vclose(tracker.goal(0.5), { x: 1, y: 2, z: 1 }, 1e-12) &&
      tracker.units(0.49).length === 1 &&
      reads === 1,
  );
}
