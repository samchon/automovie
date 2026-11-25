import { HumanSport as HumanSportRows } from "@automovie/motions/internal";
import type { IAutoMovieVector3 } from "@automovie/interface";
import { bend, bendLower } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

namespace part_bend_choose {
  /**
   * `bend.choose` takes the strategy a target asks for: `auto` stoops for a
   * target above mid-shank and semi-squats below it; a named strategy is kept.
   *
   * Scenarios, for a 0.08 m ankle height and a 0.42 m shank (mid-shank at 0.29
   * m):
   *
   * 1. `auto` at 0.3 m stoops, at 0.28 m semi-squats.
   * 2. A named squat is kept for a target at 1 m.
   */
  export function verify(): void {
    const body: Parameters<typeof bend.choose>[0] = {
      measure: { ankleHeight: 0.08, shank: 0.42 },
    };
    const at = (y: number): IAutoMovieVector3 => ({ x: 0, y, z: 0.3 });
    TestValidator.equals(
      "auto",
      [bend.choose(body, at(0.3), "auto"), bend.choose(body, at(0.28), "auto")],
      ["stoop", "semiSquat"],
    );
    TestValidator.equals("named", bend.choose(body, at(1), "squat"), "squat");
  }
}

namespace part_bend_lower_hip_share {
  /** Rounding of a few cosines and a quotient. */
  const ROUNDING: number = 1e-12;

  /**
   * `bendLower.hipShare` is the share of the standing hip height a strategy
   * keeps: the knee flexed by the strategy's `KNEE`, the shank tilted by half of
   * it but no more than the crouching ankle's `ANKLE` and the strategy's heel
   * lift, the thigh by the rest: the ankle height, the shank's and the thigh's
   * heights summed, `a + s cos(shank) + t cos(knee - shank)`, over the standing
   * `a + s + t`.
   *
   * Scenarios, for a 0.08 m ankle height, a 0.42 m shank and a 0.45 m thigh:
   *
   * 1. A stoop (knee 30) tilts each by 15 degrees.
   * 2. A semi-squat (knee 90) tilts the shank by the ankle's 28 and the thigh by 62.
   * 3. A squat (knee 135, heel 30) tilts the shank by 58 and the thigh by 77.
   * 4. The deeper the strategy, the lower the hips.
   */
  export function verify(): void {
    const body: Parameters<typeof bendLower.hipShare>[0] = {
      measure: { ankleHeight: 0.08, shank: 0.42, thigh: 0.45 },
    };
    const share = (shank: number, thigh: number): number => {
      const r: number = Math.PI / 180;
      return (
        (0.08 + 0.42 * Math.cos(shank * r) + 0.45 * Math.cos(thigh * r)) / 0.95
      );
    };
    const stoop: number = bendLower.hipShare(body, "stoop");
    const semi: number = bendLower.hipShare(body, "semiSquat");
    const squat: number = bendLower.hipShare(body, "squat");
    TestValidator.predicate("a stoop", nclose(stoop, share(15, 15), ROUNDING));
    TestValidator.predicate(
      "a semi-squat",
      nclose(semi, share(28, 62), ROUNDING),
    );
    TestValidator.predicate("a squat", nclose(squat, share(58, 77), ROUNDING));
    TestValidator.predicate("deeper is lower", stoop > semi && semi > squat);
  }
}

namespace part_toe_touch {
  /**
   * `HumanSport.toeTouch` is a row of `bend`: the stretch reaches the top of the
   * right foot and holds 20 s, whatever else is given.
   *
   * Scenarios:
   *
   * 1. Its family is `bend`, and it resolves any given target to the right foot
   *    top with a 20 s hold.
   */
  export function verify(): void {
    TestValidator.equals(
      "the toe touch",
      [
        HumanSportRows.toeTouch.family,
        HumanSportRows.toeTouch.resolve!({
          target: { kind: "self", region: "chin" },
        }),
      ],
      ["bend", { target: { kind: "self", region: "footTopRight" }, hold: 20 }],
    );
  }
}

/**
 * `bend`'s unit contract: its strategy and hip share.
 *
 * Its parts, each documented with its own scenarios:
 *
 * - `toe_touch`: the toe touch row bends to the right foot top and holds 20 s.
 * - `bend_choose`: `bend.choose` takes the strategy a target asks for:
 * - `bend_lower_hip_share`: `bendLower.hipShare` is the share of the standing hip
 *   height a strategy keeps:
 */
export async function test_unit_motions_everyday_bend(): Promise<void> {
  part_bend_choose.verify();
  part_bend_lower_hip_share.verify();
  part_toe_touch.verify();
}
