import type {
  IAutoMovieMotionClock,
  IAutoMovieMotionManner,
} from "@automovie/interface";
import {
  AutoMovieMotionManner,
  racketClock,
  racketStanceTransfer,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

/**
 * The racket law's own logic: a solo position's timetable and a stance's
 * weight transfer between the feet.
 *
 * Scenarios:
 *
 * 1. Under a manner twice as slow that holds three times as long, a split step
 *    held 0.5 s reaches its position at 1.2 s, lands its unslowed 0.3 s hop at
 *    1.5 s, holds to 3 s and returns by 4.2 s; a golf address settles over 2.4 s
 *    to 3.6 s.
 * 2. Over 0 to 1 s with the feet 0.2 m either side, the first foot swings over
 *    [0.17, 0.43] s and the second over [0.57, 0.83] s, the pelvis standing
 *    `SUPPORT_SHARE` (0.65) of the way, 0.13 m, toward the first foot as it
 *    swings, centred between the swings and 0.13 m toward the second as it
 *    swings; the window's ends belong to the bearing phases.
 */
export function test_unit_motions_sport_racket(): void {
  const manner: IAutoMovieMotionManner.IModifiers = {
    ...AutoMovieMotionManner.NEUTRAL,
    tempo: 2,
    hold: 3,
  };
  const split: IAutoMovieMotionClock = racketClock("splitStep", 0.5, manner);
  TestValidator.predicate(
    "the solo timetables",
    nclose(split.at("ready"), 1.2, 1e-12) &&
      nclose(split.at("stroke"), 1.5, 1e-12) &&
      nclose(split.at("relax"), 3, 1e-12) &&
      nclose(split.duration, 4.2, 1e-12) &&
      nclose(racketClock("golfAddress", 0.5, manner).at("stroke"), 3.6, 1e-12),
  );
  const transfer: racketStanceTransfer.ITransfer = racketStanceTransfer(
    0,
    1,
    0.2,
    -0.2,
  );
  TestValidator.equals("the swing windows", transfer.swings, [
    [0.17, 0.43],
    [0.57, 0.83],
  ]);
  TestValidator.predicate(
    "the pelvis between the feet",
    nclose(transfer.offset(0.3), 0.13, 1e-12) &&
      nclose(transfer.offset(0.5), 0, 1e-12) &&
      nclose(transfer.offset(0.7), -0.13, 1e-12) &&
      !racketStanceTransfer.inside([1, 3], 1) &&
      racketStanceTransfer.inside([1, 3], 2),
  );
}
