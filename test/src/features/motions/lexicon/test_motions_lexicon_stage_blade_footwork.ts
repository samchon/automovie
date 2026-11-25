import type {
  IAutoMovieBodyMeasure,
  IAutoMovieMotionHumanEntryState,
} from "@automovie/interface";
import { stageBladeFootworkSchedule } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";
import { throwsError } from "../../internal/throwsError";
import { vclose } from "../../internal/vclose";

/** A planted foot at an ankle, unturned. */
const foot = (
  x: number,
  z: number,
): IAutoMovieMotionHumanEntryState["feet"]["left"] => ({
  ankle: { x, y: 0.08, z },
  rotation: { x: 0, y: 0, z: 0, w: 1 },
  planted: true,
  velocity: { x: 0, y: 0, z: 0 },
  acceleration: { x: 0, y: 0, z: 0 },
  spin: { x: 0, y: 0, z: 0 },
});

/**
 * The `stageBladeFootwork` law's schedule (`stageBladeFootworkSchedule`): a
 * style's profile shifts the stance by its share of stature over its seconds at
 * the reference hip height (0.93 m), the lead foot first going forward, the
 * rear going back, each foot planted outside its travel window.
 *
 * A 1.75 m performer with a 0.93 m hip height, the left foot 0.3 m ahead.
 *
 * Scenarios:
 *
 * 1. A fencing advance shifts 0.14 · 1.75 m along +Z in 0.55 s, the left foot
 *    travelling first, lifting at 6 % and settling at 40 %, the right from 49 %
 *    to 82 %.
 * 2. A retreat moves the right foot first.
 * 3. A shift past 0.23 of the stature is refused.
 */
export function test_motions_lexicon_stage_blade_footwork(): void {
  const feet: Pick<IAutoMovieMotionHumanEntryState["feet"], "left" | "right"> =
    {
      left: foot(0.1, 0.3),
      right: foot(-0.1, 0),
    };
  const measure: Pick<IAutoMovieBodyMeasure, "stature" | "hipHeight"> = {
    stature: 1.75,
    hipHeight: 0.93,
  };
  const advance: stageBladeFootworkSchedule.ISchedule =
    stageBladeFootworkSchedule(
      { style: "fencing", direction: "forward" },
      measure,
      0,
      feet,
    );
  TestValidator.predicate(
    "the fencing advance",
    nclose(advance.duration, 0.55, 1e-12) &&
      vclose(advance.travel, { x: 0, y: 0, z: 0.14 * 1.75 }, 1e-12) &&
      advance.first === "left" &&
      nclose(advance.clock.at("firstLift"), 0.06 * 0.55, 1e-12) &&
      nclose(advance.clock.at("followSettle"), 0.82 * 0.55, 1e-12) &&
      advance.contacts[0]!.part === "leftFoot" &&
      nclose(advance.contacts[0]!.to, 0.06, 1e-12),
  );
  TestValidator.predicate(
    "the retreat, and too far",
    stageBladeFootworkSchedule(
      { style: "fencing", direction: "back" },
      measure,
      0,
      feet,
    ).first === "right" &&
      throwsError(() =>
        stageBladeFootworkSchedule(
          { style: "fencing", direction: "forward", distance: 0.5 },
          measure,
          0,
          feet,
        ),
      ),
  );
}
