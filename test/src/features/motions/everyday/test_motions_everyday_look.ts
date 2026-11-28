import {
  AutoMovieMotionHumanRefusal
} from "@automovie/motions";
import {
  look
} from "../../../../../packages/motions/src/everyday/internal/look";
import { strict as assert } from "node:assert";

/**
 * The attended field includes its ±60° edges. A cue admits a wider turn.
 *
 * @evidence contracts/development/common.md#meaningful-documentation An ordinary look admits both 60-degree field edges. An explicit cue can admit a wider turn.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the look restriction reader with a forward target, both signed edge angles, over-edge targets, and the cue allowance.
 * @evidence contracts/development/testing.md#independent-expectations The authored yaw is admitted at both 60-degree edges. A one-degree increase on either side requires the seen or signal cue.
 */
export function test_motions_everyday_look(): void {
  for (const yaw of [-60, 0, 60]) look.admitCue(yaw, undefined);
  for (const yaw of [-61, 61]) {
    assert.throws(
      () => look.admitCue(yaw, undefined),
      (error: unknown): boolean =>
        error instanceof AutoMovieMotionHumanRefusal && error.axis === "cue",
    );
    look.admitCue(yaw, "seen");
    look.admitCue(yaw, "signal");
  }
}
