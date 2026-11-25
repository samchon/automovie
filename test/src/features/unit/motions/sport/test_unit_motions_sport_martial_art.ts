import type {
  AutoMovieHumanoidBone,
  IAutoMovieBodyMeasure,
  IAutoMovieMotionClock,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanTargetGrid,
  AutoMovieMotionManner,
  MartialArtStanceForms,
  martialArtGuardSite,
  martialArtStanceClock,
  martialArtStanceTurn,
  prepareChokuZukiPath,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixture } from "../../../internal/fixtures/humanFixture";
import { nclose } from "../../../internal/nclose";
import { vclose } from "../../../internal/vclose";

/** The scenarios of `test_unit_motions_sport_martial_art_guard_site`. */
namespace ScenarioMartialArtGuardSite {
  /** A body's measures the guard reads, metres. */
  const MEASURE: Pick<
    IAutoMovieBodyMeasure,
    | "shoulderHalfWidth"
    | "upperArm"
    | "forearm"
    | "chestDepth"
    | "forearmRadius"
  > = {
    shoulderHalfWidth: 0.2,
    upperArm: 0.3,
    forearm: 0.26,
    chestDepth: 0.24,
    forearmRadius: 0.035,
  };

  /**
   * `martialArtGuardSite` places a guard fist from its shoulder joint by the
   * guard's shares, never nearer than a forearm diameter ahead of the chest's
   * front (half the chest's depth ahead of the shoulder).
   *
   * Scenarios:
   *
   * 1. The Muay Thai lead fist stands 0.6 upper arms above the shoulder, 0.55 half
   *    widths inward, its 0.45 arm lengths ahead already clear of the chest.
   * 2. The taekwondo rear fist stands 0.4 upper arms below its shoulder, and its 0.3
   *    arm lengths (0.168 m) are pushed out to the chest's clearance, 0.12 + 0.07
   *    = 0.19 m.
   * 3. A left hand's inward share points to -X, a right hand's to +X.
   */
  export function test_unit_motions_sport_martial_art_guard_site(): void {
    const high: IAutoMovieVector3 = martialArtGuardSite(
      MartialArtStanceForms.GUARDS.highGuard.lead,
      "left",
      MEASURE,
    );
    TestValidator.predicate(
      "the high guard",
      vclose(high, { x: -0.11, y: 0.18, z: 0.252 }, 1e-12),
    );
    const low: IAutoMovieVector3 = martialArtGuardSite(
      MartialArtStanceForms.GUARDS.lowGuard.rear,
      "right",
      MEASURE,
    );
    TestValidator.predicate(
      "the low guard clear of the chest",
      vclose(low, { x: 0.12, y: -0.12, z: 0.19 }, 1e-12),
    );
  }
}

/** The scenarios of `test_unit_motions_sport_martial_art_stance_clock`. */
namespace ScenarioMartialArtStanceClock {
  /**
   * `martialArtStanceClock` times a stance form from its blocking: the step in to
   * `ready`, the forward transfer to `stroke`, the back transfer to `strokeEnd`,
   * the hold to `relax` and the step back, under the neutral manner.
   *
   * Scenarios, each held 0.24 s:
   *
   * 1. Karate (0.55 s steps, 0.42 s transfers): marks at 0.55, 0.97, 1.39 and 1.63
   *    s, 2.18 s in all.
   * 2. Taekwondo (0.64 s steps, 0.48 and 0.72 s transfers): marks at 0.64, 1.12,
   *    1.84 and 2.08 s, 2.72 s in all.
   * 3. Tai chi (2 s steps, 2.5 s transfers): 9.24 s in all, the slowest form.
   */
  export function test_unit_motions_sport_martial_art_stance_clock(): void {
    const marks = (kind: MartialArtStanceForms.Kind): number[] => {
      const clock: IAutoMovieMotionClock = martialArtStanceClock(
        MartialArtStanceForms.FORM[kind],
        0.24,
        AutoMovieMotionManner.NEUTRAL,
      );
      return [
        clock.at("ready"),
        clock.at("stroke"),
        clock.at("strokeEnd"),
        clock.at("relax"),
        clock.duration,
      ];
    };
    const near = (got: number[], want: number[]): boolean =>
      want.every((w: number, i: number): boolean => nclose(got[i]!, w, 1e-12));
    TestValidator.predicate(
      "karate",
      near(marks("karateStanceTransfer"), [0.55, 0.97, 1.39, 1.63, 2.18]),
    );
    TestValidator.predicate(
      "taekwondo",
      near(marks("taekwondoStanceReset"), [0.64, 1.12, 1.84, 2.08, 2.72]),
    );
    TestValidator.predicate(
      "tai chi",
      nclose(marks("taiChiTransfer")[4]!, 9.24, 1e-12),
    );
  }
}

/** The scenarios of `test_unit_motions_sport_martial_art_stance_turn`. */
namespace ScenarioMartialArtStanceTurn {
  /**
   * `martialArtStanceTurn` turns the pelvis away from the lead by the form's
   * opening offset as it opens and its further turn over the back transfer.
   *
   * Scenarios:
   *
   * 1. Taekwondo's bladed reset, opened, heads -2 degrees before the back transfer
   *    and -18 after it for a left lead, +18 for a right lead.
   * 2. Muay Thai's square reset stays within its 2 degree opening.
   * 3. A form not yet opened has not turned.
   */
  export function test_unit_motions_sport_martial_art_stance_turn(): void {
    const taekwondo = MartialArtStanceForms.FORM.taekwondoStanceReset;
    const muayThai = MartialArtStanceForms.FORM.muayThaiStanceReset;
    TestValidator.equals(
      "the bladed turn",
      [
        martialArtStanceTurn(taekwondo, "left", 1, 0),
        martialArtStanceTurn(taekwondo, "left", 1, 1),
        martialArtStanceTurn(taekwondo, "right", 1, 1),
      ],
      [-2, -18, 18],
    );
    TestValidator.equals(
      "the square stance and the closed form",
      [
        martialArtStanceTurn(muayThai, "left", 1, 1),
        martialArtStanceTurn(taekwondo, "left", 0, 1),
      ],
      [-2, 0],
    );
  }
}

/** The scenarios of `test_unit_motions_sport_prepare_choku_zuki_path`. */
namespace ScenarioPrepareChokuZukiPath {
  /** Rounding of a few closed-form quintic sums. */
  const ROUNDING: number = 1e-12;

  /**
   * `prepareChokuZukiPath` lays the fist's shares of the way from chamber to aim
   * through three knots: the chamber at progress 0, the chest-front crossing with
   * no share inward yet, and the aim at progress 1, each knot's progress its
   * share of the chord length, joined by the minimum-jerk knot course.
   *
   * The average man's stored measures, his right shoulder joint 0.19 m right of
   * the root, 1.2 m above it and 2 cm ahead, and a chamber 8 cm outward, at waist
   * height and 9 cm ahead of it.
   *
   * Scenarios:
   *
   * 1. The path starts at `[0, 0]`, passes `[0, c]` at the crossing's chord share
   *    and ends at `[1, 1]`, where `c` brings the fist to half the chest's depth
   *    and a forearm diameter ahead of the shoulder.
   * 2. Before the crossing no share goes inward: the forearm runs along the flank.
   */
  export async function test_unit_motions_sport_prepare_choku_zuki_path(): Promise<void> {
    const measure: IAutoMovieBodyMeasure = (await humanFixture("m-average"))
      .measure;
    const shoulder: IAutoMovieVector3 = { x: -0.19, y: 1.2, z: 0.02 };
    const rest: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieVector3> = new Map<
      AutoMovieHumanoidBone,
      IAutoMovieVector3
    >([["rightUpperArm", shoulder]]);
    const chamber: IAutoMovieVector3 = {
      x: 0.08,
      y: measure.waistHeight - measure.shoulderHeight,
      z: 0.09,
    };
    const path = prepareChokuZukiPath({ measure, rest }, chamber);

    // The knots' closed forms.
    const forward: number =
      measure.upperArm + measure.forearm - shoulder.z - chamber.z;
    const up: number =
      AutoMovieMotionHumanTargetGrid.height({ measure }, "chest") *
        measure.stature -
      measure.waistHeight;
    const c: number =
      (measure.chestDepth / 2 +
        2 * measure.forearmRadius +
        measure.forearm -
        chamber.z) /
      forward;
    const along: number = Math.hypot(up, forward);
    const first: number = c * along;
    const at: number =
      first / (first + Math.hypot(chamber.x - shoulder.x, (1 - c) * along));
    const share = (u: number): readonly number[] => path.position(u);
    TestValidator.predicate(
      "through its knots",
      c > 0 &&
        c < 1 &&
        nclose(share(0)[0]!, 0, ROUNDING) &&
        nclose(share(0)[1]!, 0, ROUNDING) &&
        nclose(share(at)[0]!, 0, ROUNDING) &&
        nclose(share(at)[1]!, c, ROUNDING) &&
        nclose(share(1)[0]!, 1, ROUNDING) &&
        nclose(share(1)[1]!, 1, ROUNDING),
    );
    TestValidator.predicate(
      "none inward before the chest's front",
      [0.1, 0.25, 0.5, 0.75, 0.9].every(
        (f: number): boolean => share(f * at)[0]! <= ROUNDING,
      ),
    );
  }
}

/**
 * The `martial_art` family's own logic, one scenario group per namespace above:
 * each group's scenarios are documented on it.
 */
export async function test_unit_motions_sport_martial_art(): Promise<void> {
  ScenarioMartialArtGuardSite.test_unit_motions_sport_martial_art_guard_site();
  ScenarioMartialArtStanceClock.test_unit_motions_sport_martial_art_stance_clock();
  ScenarioMartialArtStanceTurn.test_unit_motions_sport_martial_art_stance_turn();
  await ScenarioPrepareChokuZukiPath.test_unit_motions_sport_prepare_choku_zuki_path();
}
