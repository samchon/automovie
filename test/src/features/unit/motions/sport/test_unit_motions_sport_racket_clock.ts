import type {
  IAutoMovieMotionClock,
  IAutoMovieMotionManner,
} from "@automovie/interface";
import {
  AutoMovieMotionManner,
  racketClock,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

/**
 * `racketClock` times a solo position: 0.6 s into it, the stroke (1.2 s for a
 * golf address, 0.3 s otherwise), the hold and the 0.6 s return; the manner's
 * hold scales the held span, its tempo the rest, but never a split step's hop.
 *
 * Under a manner twice as slow that holds three times as long, a 0.5 s hold:
 *
 * Scenarios:
 *
 * 1. A split step reaches its position at 1.2 s, lands its unslowed 0.3 s hop at
 *    1.5 s, holds 1.5 s to 3 s and returns by 4.2 s.
 * 2. A golf address settles over 2.4 s to 3.6 s, holds to 5.1 s and returns by 6.3
 *    s.
 */
export function test_unit_motions_sport_racket_clock(): void {
  const manner: IAutoMovieMotionManner.IModifiers = {
    ...AutoMovieMotionManner.NEUTRAL,
    tempo: 2,
    hold: 3,
  };
  const split: IAutoMovieMotionClock = racketClock("splitStep", 0.5, manner);
  TestValidator.predicate(
    "the split step",
    nclose(split.at("ready"), 1.2, 1e-12) &&
      nclose(split.at("stroke"), 1.5, 1e-12) &&
      nclose(split.at("relax"), 3, 1e-12) &&
      nclose(split.duration, 4.2, 1e-12),
  );
  const golf: IAutoMovieMotionClock = racketClock("golfAddress", 0.5, manner);
  TestValidator.predicate(
    "the golf address",
    nclose(golf.at("ready"), 1.2, 1e-12) &&
      nclose(golf.at("stroke"), 3.6, 1e-12) &&
      nclose(golf.at("relax"), 5.1, 1e-12) &&
      nclose(golf.duration, 6.3, 1e-12),
  );
}
