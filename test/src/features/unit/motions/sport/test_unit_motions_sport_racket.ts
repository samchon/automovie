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

/** The scenarios of `test_unit_motions_sport_racket_clock`. */
namespace ScenarioRacketClock {
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
}

/** The scenarios of `test_unit_motions_sport_racket_stance_transfer`. */
namespace ScenarioRacketStanceTransfer {
  /**
   * `racketStanceTransfer` moves a racket stance's weight between two feet over a
   * window: the first foot swings over 17% to 43% of it and the second over 57%
   * to 83%, and the pelvis shifts `SUPPORT_SHARE` (0.65) of the way to the first
   * foot's offset before the first swing, on to the second's between the swings,
   * and back to the middle after the second.
   *
   * Over 0 to 1 s with the feet 0.2 m either side of the pelvis.
   *
   * Scenarios:
   *
   * 1. The swings are [0.17, 0.43] and [0.57, 0.83] s.
   * 2. The pelvis starts centred, stands 0.13 m toward the first foot as it swings,
   *    centred midway between the swings, 0.13 m toward the second as it swings,
   *    and centred again at the end.
   */
  export function test_unit_motions_sport_racket_stance_transfer(): void {
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
      nclose(transfer.offset(0), 0, 1e-12) &&
        nclose(transfer.offset(0.3), 0.13, 1e-12) &&
        nclose(transfer.offset(0.5), 0, 1e-12) &&
        nclose(transfer.offset(0.7), -0.13, 1e-12) &&
        nclose(transfer.offset(1), 0, 1e-12),
    );
  }
}

/** The scenarios of `test_unit_motions_sport_racket_stance_transfer_windows`. */
namespace ScenarioRacketStanceTransferWindows {
  /**
   * `racketStanceTransfer.inside`, `share` and `ease` read a phase window: a
   * second is inside only strictly between the ends (an end belongs to the
   * adjacent bearing phase), the share is the clamped linear fraction, and the
   * ease its minimum-jerk share `10 u³ - 15 u⁴ + 6 u⁵`.
   *
   * The window from 1 s to 3 s.
   *
   * Scenarios:
   *
   * 1. 2 s is inside; the ends and outside are not.
   * 2. The share is 0 before, 0.25 at 1.5 s and 1 after.
   * 3. The ease is one half at the middle and 0.103515625 a quarter in.
   */
  export function test_unit_motions_sport_racket_stance_transfer_windows(): void {
    const window: racketStanceTransfer.Window = [1, 3];
    TestValidator.equals(
      "inside, strictly",
      [0.5, 1, 2, 3, 4].map((t: number): boolean =>
        racketStanceTransfer.inside(window, t),
      ),
      [false, false, true, false, false],
    );
    TestValidator.predicate(
      "the share and the ease",
      racketStanceTransfer.share(window, 0) === 0 &&
        nclose(racketStanceTransfer.share(window, 1.5), 0.25, 1e-12) &&
        racketStanceTransfer.share(window, 5) === 1 &&
        nclose(racketStanceTransfer.ease(window, 2), 0.5, 1e-12) &&
        nclose(racketStanceTransfer.ease(window, 1.5), 0.103515625, 1e-12),
    );
  }
}

/**
 * The `racket` family's own logic, one scenario group per namespace above: each
 * group's scenarios are documented on it.
 */
export function test_unit_motions_sport_racket(): void {
  ScenarioRacketClock.test_unit_motions_sport_racket_clock();
  ScenarioRacketStanceTransfer.test_unit_motions_sport_racket_stance_transfer();
  ScenarioRacketStanceTransferWindows.test_unit_motions_sport_racket_stance_transfer_windows();
}
