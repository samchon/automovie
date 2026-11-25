import type {
  IAutoMovieMotionClock,
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanFoot,
} from "@automovie/interface";
import {
  AthleticsSwing,
  AutoMovieMotionManner,
  athleticsClock,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";
import { qclose } from "../../../internal/qclose";
import { vclose } from "../../../internal/vclose";

/** The scenarios of `test_unit_motions_sport_athletics_clock`. */
namespace ScenarioAthleticsClock {
  /**
   * `athleticsClock` times a sprint start: the crouch into the set position over
   * `CROUCH` (1.5 s), the hold to the gun, and with a drive the block exit over
   * its seconds, the rear foot off its block at the drive's middle; without one
   * the phrase closes a millisecond after the gun.
   *
   * Under the neutral manner.
   *
   * Scenarios:
   *
   * 1. Held 1 s with a 0.4 s drive: marks at 0, set at 1.5 s, the gun at 2.5 s, the
   *    rear block off at 2.7 s and the blocks left at 2.9 s, the end.
   * 2. Without a drive: no block events, the end 1 ms after the gun.
   */
  export function test_unit_motions_sport_athletics_clock(): void {
    const driven: IAutoMovieMotionClock = athleticsClock(
      1,
      0.4,
      AutoMovieMotionManner.NEUTRAL,
    );
    TestValidator.predicate(
      "the start with a drive",
      driven.at("onYourMarks") === 0 &&
        nclose(driven.at("set"), 1.5, 1e-12) &&
        nclose(driven.at("gun"), 2.5, 1e-12) &&
        nclose(driven.at("rearBlockOff"), 2.7, 1e-12) &&
        nclose(driven.at("blockExit"), 2.9, 1e-12) &&
        nclose(driven.duration, 2.9, 1e-12),
    );
    const held: IAutoMovieMotionClock = athleticsClock(
      1,
      undefined,
      AutoMovieMotionManner.NEUTRAL,
    );
    TestValidator.predicate(
      "the start held to the gun",
      nclose(held.duration - held.at("gun"), 0.001, 1e-12) &&
        held
          .events()
          .every(
            (e: IAutoMovieMotionEvent): boolean =>
              e.name !== "rearBlockOff" && e.name !== "blockExit",
          ),
    );
  }
}

/** The scenarios of `test_unit_motions_sport_athletics_swing_prepare`. */
namespace ScenarioAthleticsSwingPrepare {
  /**
   * `AthleticsSwing.prepare` swings a foot through a quadratic Bézier whose
   * control point makes it pass `over` at its middle, `2 over - (from + to) / 2`,
   * on a minimum-jerk share of the progress clamped to [0, 1]; the foot turns
   * from `from` to `over` over the first half and on to `to` over the second.
   *
   * The foot swings from the origin over (0, 0.4, 0.5) to (0, 0, 1), turned a
   * quarter about +X over the top.
   *
   * Scenarios:
   *
   * 1. At the start it stands on `from`; at the end, and past it, on `to`.
   * 2. At half progress (share one half) it passes `over` with `over`'s turn.
   */
  export function test_unit_motions_sport_athletics_swing_prepare(): void {
    const level: IAutoMovieMotionHumanFoot.IPlacement["rotation"] = {
      x: 0,
      y: 0,
      z: 0,
      w: 1,
    };
    const tipped: IAutoMovieMotionHumanFoot.IPlacement["rotation"] = {
      x: Math.SQRT1_2,
      y: 0,
      z: 0,
      w: Math.SQRT1_2,
    };
    const swing: (progress: number) => IAutoMovieMotionHumanFoot.IPlacement =
      AthleticsSwing.prepare({
        from: { ankle: { x: 0, y: 0, z: 0 }, rotation: level },
        over: { ankle: { x: 0, y: 0.4, z: 0.5 }, rotation: tipped },
        to: { ankle: { x: 0, y: 0, z: 1 }, rotation: level },
      });
    TestValidator.predicate(
      "the ends",
      vclose(swing(0).ankle, { x: 0, y: 0, z: 0 }, 1e-12) &&
        vclose(swing(1).ankle, { x: 0, y: 0, z: 1 }, 1e-12) &&
        vclose(swing(2).ankle, { x: 0, y: 0, z: 1 }, 1e-12),
    );
    TestValidator.predicate(
      "over the top",
      vclose(swing(0.5).ankle, { x: 0, y: 0.4, z: 0.5 }, 1e-12) &&
        qclose(swing(0.5).rotation, tipped, 1e-12),
    );
  }
}

/**
 * The `athletics` family's own logic, one scenario group per namespace above:
 * each group's scenarios are documented on it.
 */
export function test_unit_motions_sport_athletics(): void {
  ScenarioAthleticsClock.test_unit_motions_sport_athletics_clock();
  ScenarioAthleticsSwingPrepare.test_unit_motions_sport_athletics_swing_prepare();
}
