import type { IAutoMovieMotionClock } from "@automovie/interface";
import {
  AutoMovieMotionClock,
  bowViolinStroke,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

/** The clearance off the string before and after the stroke, metres. */
const CLEARANCE: number = 0.035;

/**
 * `bowViolinStroke` schedules a stroke on its clock: the hair slides from 18%
 * to 42% of the playable hair through the `contact` phase (down-bow) or back
 * (up-bow), and stands a clearance off the string until `ready`, lowers to it
 * by `contact` and rises back over `lift`; the clock's progress is a minimum-
 * jerk share, one half at a phase's middle.
 *
 * Phases: approach 0 to 1 s, ready to 1.2 s, contact to 2.2 s, lift to 2.4 s.
 *
 * Scenarios:
 *
 * 1. A down-bow starts at 18% a clearance off the string, passes 30% on it at
 *    mid-stroke and ends at 42% a clearance off.
 * 2. An up-bow starts at 42%, also passes 30% mid-stroke, and ends at 18%.
 * 3. `from` names each direction's starting share.
 */
export function test_unit_motions_music_bow_violin_stroke(): void {
  const clock: IAutoMovieMotionClock = AutoMovieMotionClock.sequence([
    { name: "approach", seconds: 1 },
    { name: "ready", seconds: 0.2 },
    { name: "contact", seconds: 1 },
    { name: "lift", seconds: 0.2 },
  ]);
  const down: (seconds: number) => bowViolinStroke.IStroke = bowViolinStroke(
    clock,
    undefined,
    CLEARANCE,
  );
  const up: (seconds: number) => bowViolinStroke.IStroke = bowViolinStroke(
    clock,
    "up",
    CLEARANCE,
  );
  const at = (
    stroke: bowViolinStroke.IStroke,
    share: number,
    lift: number,
  ): boolean => nclose(stroke.share, share, 1e-12) && nclose(stroke.lift, lift, 1e-12);
  TestValidator.predicate(
    "the down-bow",
    at(down(0.5), 0.18, CLEARANCE) &&
      at(down(1.7), 0.3, 0) &&
      at(down(2.4), 0.42, CLEARANCE),
  );
  TestValidator.predicate(
    "the up-bow",
    at(up(0.5), 0.42, CLEARANCE) && at(up(1.7), 0.3, 0) && at(up(2.4), 0.18, CLEARANCE),
  );
  TestValidator.equals(
    "the starting shares",
    [bowViolinStroke.from("down"), bowViolinStroke.from("up")],
    [0.18, 0.42],
  );
}
