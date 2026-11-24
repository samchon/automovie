import { HumanGaze } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

/**
 * `HumanGaze.split` shares a gaze direction over the eyes, the head and the
 * trunk: the eyes take up to `EYES` (15 degrees, Freedman 2008), the head the
 * next up to its share (60 of yaw, 40 down, 30 up), the trunk what remains of
 * the yaw up to `TRUNK` (40), and the eyes whatever the others leave; `recruit`
 * keeps the trunk, or the head and the trunk, out. `saccade` times the eyes by
 * the main sequence (`2.2 A + 21` ms, Bahill et al. 1975) and `turn` the head
 * and trunk by `0.15 + 0.004 A` s.
 *
 * Scenarios:
 *
 * 1. A gaze 100 degrees left and 30 down: the head 60 left and 15 down, the trunk
 *    the last 25, the eyes 15 and 15.
 * 2. 150 degrees left: the trunk stops at 40, the eyes take 50.
 * 3. With the head only, 100 left leaves the eyes 40; with the eyes only, they
 *    take it all.
 * 4. 50 up: the head stops at 30 up, the eyes take 20.
 * 5. A 10-degree saccade takes 43 ms, a 50-degree head turn 0.35 s.
 */
export function test_unit_motions_everyday_human_gaze_split(): void {
  TestValidator.equals(
    "the splits",
    [
      HumanGaze.split(100, 30),
      HumanGaze.split(150, 0),
      HumanGaze.split(100, 0, "head"),
      HumanGaze.split(100, 0, "eyes"),
      HumanGaze.split(0, -50),
    ],
    [
      { eyes: { yaw: 15, pitch: 15 }, head: { yaw: 60, pitch: 15 }, trunk: 25 },
      { eyes: { yaw: 50, pitch: 0 }, head: { yaw: 60, pitch: 0 }, trunk: 40 },
      { eyes: { yaw: 40, pitch: 0 }, head: { yaw: 60, pitch: 0 }, trunk: 0 },
      { eyes: { yaw: 100, pitch: 0 }, head: { yaw: 0, pitch: 0 }, trunk: 0 },
      { eyes: { yaw: 0, pitch: -20 }, head: { yaw: 0, pitch: -30 }, trunk: 0 },
    ],
  );
  TestValidator.predicate(
    "the timings",
    Math.abs(HumanGaze.saccade(10) - 0.043) < 1e-12 &&
      Math.abs(HumanGaze.saccade(-10) - 0.043) < 1e-12 &&
      Math.abs(HumanGaze.turn(50) - 0.35) < 1e-12,
  );
}
