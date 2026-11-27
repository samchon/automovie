import {
  AutoMovieMotionHumanRefusal
} from "@automovie/motions";
import {
  look
} from "../../../../../packages/motions/src/everyday/internal/look";
import { strict as assert } from "node:assert";

/** The attended field includes its ±60° edges. A cue admits a wider turn. */
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
