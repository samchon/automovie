import { StrikingTwist } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

/**
 * `StrikingTwist.trunk` adds a strike's trunk twist to the spine's and the
 * chest's own, keeping their flexion and abduction.
 *
 * Scenarios:
 *
 * 1. A spine flexed 10 and twisted 5 twists 15 more to 20; an unset chest twists
 *    from zero.
 */
export function test_motions_striking_twist(): void {
  TestValidator.equals(
    "the twist adds to each trunk joint's own",
    StrikingTwist.trunk({ spine: [10, 2, 5] }, 15),
    { spine: [10, 2, 20], chest: [0, 0, 15] },
  );
}
