import { Vector3 } from "@automovie/engine";
import { WorkoutLoad } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { vclose } from "../../../internal/vclose";

/** Rounding of one rotation and a normalization, unit vectors. */
const ROUNDING: number = 1e-12;

/**
 * `WorkoutLoad.level` is the frame a bar held in one hand is levelled to, so
 * the second hand meets the bar's other grip: the bar runs level from the hand
 * toward the performer's other side, and the knuckles continue the forearm
 * square to the bar, a straight wrist, straight down when the forearm runs
 * along the bar.
 *
 * Scenarios:
 *
 * 1. Facing +Z, the right hand's bar runs along +X, and a forearm (0.1, −0.2,
 *    0.05) leaves its square part (0, −0.2, 0.05) for the knuckles.
 * 2. A forearm along the bar points the knuckles straight down.
 * 3. Facing +X, the left hand's bar runs along +Z.
 */
export function test_unit_motions_exercise_workout_load_level(): void {
  // 1. Square to the bar.
  const right: WorkoutLoad.ILevel = WorkoutLoad.level(0, "right", {
    x: 0.1,
    y: -0.2,
    z: 0.05,
  });
  TestValidator.predicate(
    "the bar across and the knuckles square to it",
    vclose(right.across, { x: 1, y: 0, z: 0 }, ROUNDING) &&
      vclose(
        right.forward,
        Vector3.normalize({ x: 0, y: -0.2, z: 0.05 }),
        ROUNDING,
      ),
  );

  // 2. Along the bar.
  TestValidator.predicate(
    "straight down along the bar",
    vclose(
      WorkoutLoad.level(0, "right", { x: 0.3, y: 0, z: 0 }).forward,
      { x: 0, y: -1, z: 0 },
      0,
    ),
  );

  // 3. Another heading and hand.
  TestValidator.predicate(
    "the left hand's bar facing +X",
    vclose(
      WorkoutLoad.level(90, "left", { x: 0, y: -1, z: 0 }).across,
      { x: 0, y: 0, z: 1 },
      ROUNDING,
    ),
  );
}
