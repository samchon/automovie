import { TestValidator } from "@nestia/e2e";

import { motionPostureBranches } from "../internal/motionPostureBranches";

/**
 * Gaze recruits the authored joints and accepts both authored cues.
 *
 * Scenarios:
 * 1. Omitted recruitment, eye-only, head-only and trunk recruitment cover the reach boundaries.
 * 2. Each explicit cue stages the same gaze problem; the public timing audit checks its event.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the law's distinguishing inputs and preserves their staged context.
 * @evidence contracts/development/testing.md#behavioral-verification Performs the actual public law and applies the timing, contact, range, spin and display audits to its staged performances.
 * @evidence contracts/development/testing.md#independent-expectations The display range and continuity bounds apply to gaze and its recruited segments. These limits are independent of the result the law returns.
 * @evidence contracts/development/testing.md#distinguishing-cases Omitted recruitment, eye-only, head-only and trunk recruitment cover the reach boundaries. Each explicit cue stages the same gaze problem; the public timing audit checks its event.
 * @evidence contracts/development/testing.md#execution-ownership The discovered test stages and audits the selected solo branches in memory.
 */
export function test_human_motion_law_sweep_posture_gaze(): void {
  TestValidator.equals(
    "Gaze recruits the authored joints and accepts both authored cues",
    motionPostureBranches([
      ["look", "default", "f-small"],
      ["look", "with=eyes", "m-large"],
      ["look", "with=head", "f-small"],
      ["look", "with=trunk", "m-large"],
      ["look", "cue=seen", "m-large"],
      ["look", "cue=signal", "f-small"],
    ]),
    [],
  );
}
