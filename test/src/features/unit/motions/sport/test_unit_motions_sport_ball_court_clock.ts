import type {
  IAutoMovieMotionClock,
  IAutoMovieMotionManner,
} from "@automovie/interface";
import {
  AutoMovieMotionManner,
  ballCourtClock,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

/**
 * `ballCourtClock` times a court phrase: its preparation and attack, a 0.22 s
 * follow-through, the finish held 0.85 s for a release or 0.24 s for a contest,
 * and a 0.34 s return; the manner's tempo stretches the moving spans and its
 * hold the held finish.
 *
 * Scenarios:
 *
 * 1. A chest pass (0.37 s, 0.24 s) under the neutral manner releases at 0.61 s,
 *    finishes its follow-through at 0.83 s, relaxes at 1.68 s and ends at 2.02
 *    s.
 * 2. A contest's finish holds 0.24 s.
 * 3. Twice as slow, the chest pass releases at 1.22 s and still holds its finish
 *    0.85 s.
 */
export function test_unit_motions_sport_ball_court_clock(): void {
  const pass: IAutoMovieMotionClock = ballCourtClock(
    { prepare: 0.37, attack: 0.24 },
    false,
    AutoMovieMotionManner.NEUTRAL,
  );
  TestValidator.predicate(
    "the chest pass",
    nclose(pass.at("stroke"), 0.61, 1e-12) &&
      nclose(pass.at("strokeEnd"), 0.83, 1e-12) &&
      nclose(pass.at("relax"), 1.68, 1e-12) &&
      nclose(pass.duration, 2.02, 1e-12),
  );
  const contest: IAutoMovieMotionClock = ballCourtClock(
    { prepare: 0.34, attack: 0.55 },
    true,
    AutoMovieMotionManner.NEUTRAL,
  );
  TestValidator.predicate(
    "the contest's hold",
    nclose(contest.at("relax") - contest.at("strokeEnd"), 0.24, 1e-12),
  );
  const slow: IAutoMovieMotionManner.IModifiers = {
    ...AutoMovieMotionManner.NEUTRAL,
    tempo: 2,
  };
  const late: IAutoMovieMotionClock = ballCourtClock(
    { prepare: 0.37, attack: 0.24 },
    false,
    slow,
  );
  TestValidator.predicate(
    "the slow pass",
    nclose(late.at("stroke"), 1.22, 1e-12) &&
      nclose(late.at("relax") - late.at("strokeEnd"), 0.85, 1e-12),
  );
}
