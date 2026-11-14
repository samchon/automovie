import { TestValidator } from "@nestia/e2e";

import { motionHumanOverlayChannels } from "../internal/motionHumanOverlayChannels";

/**
 * A task overlaid on a walk comes in, runs and goes out without a step in any
 * joint's path: on the average man walking 2 m with the `read` task in the
 * right hand, no joint centre of the film jumps by more than the continuity
 * audit's 5 mm, read over part 5 of the film's eight (one frame into the
 * next; the other eighths are their own specs).
 *
 * Scenarios (`motionHumanOverlayChannels` states each with its bound):
 * 1. Every departing interval of the film resolves to a joint displacement
 *    within 5 mm.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Performs the compositions through the public chain and reads displayed joint centres; an overlay that steps in or out of the swing fails.
 * @evidence contracts/development/testing.md#independent-expectations The bound is the continuity audit's own, which holds for any human motion.
 * @evidence contracts/development/testing.md#distinguishing-cases One eighth of the overlay's film on one body; the other eighths and the claims are their own specs.
 * @evidence contracts/development/testing.md#execution-ownership Prepares one polygon man and performs one film in memory, under a minute alone; the test program discovers every `test_` function, so `pnpm test` and the CI test job run it.
 * @evidence contracts/development/common.md#meaningful-documentation States the act, its part of the overlay scenarios and their bounds.
 */
export function test_human_motion_overlay_channels_continuity_5(): void {
  const complaints: string[] = [];
  motionHumanOverlayChannels.continuity(4, complaints);
  TestValidator.equals("an overlay and its carrier", complaints, []);
}
