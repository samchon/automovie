import type { IAutoMovieVector3 } from "@automovie/interface";
import {
  AutoMovieMotionClock,
  climbStairsPelvis,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { vclose } from "../../../internal/vclose";

/** Rounding of a few minimum-jerk products, metres. */
const ROUNDING: number = 1e-9;

/**
 * `climbStairsPelvis` is a stair climb's root: its height rises by each step's
 * riser from the step's toe-off to its tread contact on the clock's own
 * progress, and its ground point travels from one stance root to the next by a
 * minimum-jerk share between the middles of neighbouring tread contacts, the
 * first from the start and the last to the end.
 *
 * Scenarios, two steps over 3 s from (0, 0.9, 0) through (0, 1.07, 0.3) to (0,
 * 1.24, 0.6), toe-offs at 0.2 and 1.2 s and tread contacts at 1 and 2 s:
 *
 * 1. At 0 s the root stands on the first stance, and from 2 s on at the last one's
 *    height, at 3 s on the last stance.
 * 2. Between the first tread contact and the second toe-off, at 1.1 s, the root
 *    has risen the first riser to 1.07 m.
 * 3. Its ground point is half way between the first two stances at 1 s, the middle
 *    of its span from 0.5 s, half way to the first tread contact, to 1.5 s,
 *    half way between the two.
 */
export function test_unit_motions_terrain_climb_stairs_pelvis(): void {
  const stance: IAutoMovieVector3[] = [
    { x: 0, y: 0.9, z: 0 },
    { x: 0, y: 1.07, z: 0.3 },
    { x: 0, y: 1.24, z: 0.6 },
  ];
  const root: (seconds: number) => IAutoMovieVector3 = climbStairsPelvis(
    stance,
    AutoMovieMotionClock(3, [
      { name: "toeOff1", seconds: 0.2 },
      { name: "treadContact1", seconds: 1 },
      { name: "toeOff2", seconds: 1.2 },
      { name: "treadContact2", seconds: 2 },
    ]),
    2,
    3,
  );
  TestValidator.predicate(
    "the ends",
    vclose(root(0), stance[0]!, ROUNDING) &&
      vclose(root(3), stance[2]!, ROUNDING) &&
      Math.abs(root(2.2).y - 1.24) < ROUNDING,
  );
  TestValidator.predicate(
    "the first riser",
    Math.abs(root(1.1).y - 1.07) < ROUNDING,
  );
  const half: IAutoMovieVector3 = root(1);
  TestValidator.predicate(
    "half way along",
    Math.abs(half.x) < ROUNDING && Math.abs(half.z - 0.15) < ROUNDING,
  );
}
