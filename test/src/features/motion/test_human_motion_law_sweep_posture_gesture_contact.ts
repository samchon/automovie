import { TestValidator } from "@nestia/e2e";

import { motionPostureBranches } from "../internal/motionPostureBranches";

/**
 * Gestures with both hands in close proximity keep their palm and wrist motion admissible.
 *
 * Scenarios:
 * 1. Clapping, rubbing and bringing the palms together close against the other hand. Pushing glasses and scratching pass near the head.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the relevant geometry and which distinct input targets the scenario compares.
 * @evidence contracts/development/testing.md#behavioral-verification Performs the real public gesture in its original stage. The display audit catches excessive penetration, motion discontinuity, missing events and joint range overshoot.
 * @evidence contracts/development/testing.md#independent-expectations The original geometry, timing and joint bounds are shared across input gestures and derive from the physical audit, without reading back the plan's own output as an expectation.
 * @evidence contracts/development/testing.md#distinguishing-cases Clapping, rubbing and bringing the palms together close against the other hand. Pushing glasses and scratching pass near the head.
 * @evidence contracts/development/testing.md#execution-ownership The discovered scenario stages and reads the selected actual gestures in memory on contrasting bodies.
 */
export function test_human_motion_law_sweep_posture_gesture_contact(): void {
  TestValidator.equals(
    "Gestures with both hands in close proximity keep their palm and wrist motion admissible",
    motionPostureBranches([
      ["gesture", "kind=clap", "f-small"],
      ["gesture", "kind=rubHands", "m-large"],
      ["gesture", "kind=palmsTogether", "f-small"],
      ["gesture", "kind=pushGlasses", "m-large"],
      ["gesture", "kind=scratchHead", "f-small"],
    ]),
    [],
  );
}
