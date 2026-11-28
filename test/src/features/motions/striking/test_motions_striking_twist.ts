import {
  StrikingTwist
} from "../../../../../packages/motions/src/striking/internal/StrikingTwist";
import { TestValidator } from "@nestia/e2e";

/**
 * `StrikingTwist.trunk` adds a strike's trunk twist to the spine's and the
 * chest's own, keeping their flexion and abduction.
 *
 * Scenarios:
 *
 * 1. A spine flexed 10 and twisted 5 twists 15 more to 20; an unset chest twists
 *    from zero.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes additive rotation for two rig trunk joints with unchanged other axes.
 * @evidence contracts/development/testing.md#behavioral-verification Adds trunk twist to a spine with an existing pose and to a chest without a prior value.
 * @evidence contracts/development/testing.md#independent-expectations Authored spine twist 5 plus 15 gives 20, while its flexion stays 10 and the unset chest starts at zero.
 */
export function test_motions_striking_twist(): void {
  TestValidator.equals(
    "the twist adds to each trunk joint's own",
    StrikingTwist.trunk({ spine: [10, 2, 5] }, 15),
    { spine: [10, 2, 20], chest: [0, 0, 15] },
  );
}
