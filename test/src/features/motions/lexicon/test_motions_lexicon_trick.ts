import type { IAutoMovieMotionHumanTrick } from "@automovie/interface";
import { humanTrickSchedule } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";
import { throwsError } from "../../internal/throwsError";

/**
 * The `HumanTrick` law's schedule (`humanTrickSchedule`): each figure's
 * transfer then its hold, ending back in the seat, cued where each transfer
 * ends, its transfer on a minimum-jerk share.
 *
 * Scenarios:
 *
 * 1. A hippodrome stand of 0.8 s transfer and 1 s hold, then a seat of 0.6 s and
 *    0.4 s, runs 2.8 s, cued `hippodrome:0` at 0.8 s and `seat:1` at 2.4 s; at
 *    0.4 s the stand is half transferred, at 2 s the seat has begun.
 * 2. A ride not ending in the seat is refused.
 */
export function test_motions_lexicon_trick(): void {
  const stand: IAutoMovieMotionHumanTrick.IFigure = {
    kind: "hippodrome",
    transfer: 0.8,
    hold: 1,
  };
  const seat: IAutoMovieMotionHumanTrick.IFigure = {
    kind: "seat",
    transfer: 0.6,
    hold: 0.4,
  };
  const schedule: humanTrickSchedule.ISchedule = humanTrickSchedule([
    stand,
    seat,
  ]);
  TestValidator.predicate(
    "the figures in turn",
    nclose(schedule.duration, 2.8, 1e-12) &&
      schedule.events[0]!.name === "hippodrome:0" &&
      nclose(schedule.events[0]!.share * 2.8, 0.8, 1e-12) &&
      nclose(schedule.events[1]!.share * 2.8, 2.4, 1e-12) &&
      schedule.at(0.4).index === 0 &&
      nclose(schedule.at(0.4).share, 0.5, 1e-12) &&
      schedule.at(2).index === 1,
  );
  TestValidator.predicate(
    "not back in the seat",
    throwsError(() => humanTrickSchedule([stand])),
  );
}
