import type { IAutoMovieMotionHumanClimbStairsFlight } from "@automovie/interface";
import { climbStairsProfile } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

/** Rounding of a few sums, metres. */
const ROUNDING: number = 1e-12;

/**
 * `climbStairsProfile` is the stepped height a swinging sole point must clear
 * over a flight: the stairs' own surface, raised within a distance of each
 * nosing to the higher tread beside it plus the clearance.
 *
 * Scenarios, three 0.17 m risers on 0.28 m treads, the first nosing 0.5 m
 * ahead, 5 cm either side of a nosing cleared by 2 cm:
 *
 * 1. Before the flight, 0.3 m ahead, the profile is the floor, 0.
 * 2. On the first nosing, and 4 cm before it, the profile is the first tread's
 *    0.17 m plus 0.02 m.
 * 3. In the middle of the first tread, 0.64 m ahead, it is the tread, 0.17 m.
 * 4. Past the last nosing's reach it is the top, 0.51 m.
 */
export function test_unit_motions_terrain_climb_stairs_profile(): void {
  const flight: IAutoMovieMotionHumanClimbStairsFlight.IFlight = {
    frame: { origin: { x: 0, y: 0, z: 0 }, yaw: 0 },
    first: 0.5,
    count: 3,
    riser: 0.17,
    tread: 0.28,
    direction: "up",
  };
  const profile: (z: number) => number = climbStairsProfile(flight, 0.05, 0.02);
  TestValidator.predicate(
    "the profile",
    nclose(profile(0.3), 0, ROUNDING) &&
      nclose(profile(0.5), 0.19, ROUNDING) &&
      nclose(profile(0.46), 0.19, ROUNDING) &&
      nclose(profile(0.64), 0.17, ROUNDING) &&
      nclose(profile(1.5), 0.51, ROUNDING),
  );
}
