import type { AutoMovieHumanoidBone, IAutoMovieBodyMeasure, IAutoMovieMotionClock, IAutoMovieVector3 } from "@automovie/interface";
import {
  AutoMovieMotionHumanTargetGrid
} from "../../../../../packages/motions/src/compose/internal/AutoMovieMotionHumanTargetGrid";
import {
  motionManner
} from "../../../../../packages/motions/src/compose/internal/motionManner";
import {
  MartialArtStanceForms
} from "../../../../../packages/motions/src/sport/internal/MartialArtStanceForms";
import {
  martialArtGuardSite
} from "../../../../../packages/motions/src/sport/internal/martialArtGuardSite";
import {
  martialArtStanceClock
} from "../../../../../packages/motions/src/sport/internal/martialArtStanceClock";
import {
  martialArtStanceTurn
} from "../../../../../packages/motions/src/sport/internal/martialArtStanceTurn";
import {
  prepareChokuZukiPath
} from "../../../../../packages/motions/src/sport/internal/prepareChokuZukiPath";
import { TestValidator } from "@nestia/e2e";

import { humanFixture } from "../../internal/fixtures/humanFixture";
import { nclose } from "../../internal/nclose";
import { vclose } from "../../internal/vclose";

/** Rounding of a few closed-form sums. */
const ROUNDING: number = 1e-12;

/**
 * The martial-art forms' own logic: a stance form's timetable and pelvis turn,
 * a held guard's fist site, and the choku-zuki fist's path.
 *
 * Scenarios:
 *
 * 1. The taekwondo reset (0.64 s steps, 0.48 and 0.72 s transfers) held 0.24 s
 *    marks `ready`, `stroke`, `strokeEnd` and `relax` at 0.64, 1.12, 1.84 and
 *    2.08 s and lasts 2.72 s.
 * 2. Opened, it heads 2 degrees away from a left lead before the back transfer and
 *    18 after it, +18 for a right lead.
 * 3. With a 0.2 m shoulder half width, 0.3 m upper arm, 0.26 m forearm, 0.24 m
 *    chest depth and 0.035 m forearm radius, the Muay Thai lead fist stands 0.6
 *    upper arms above its shoulder at its 0.45 arm lengths ahead, and the
 *    taekwondo rear fist 0.4 upper arms below, pushed from 0.3 arm lengths
 *    (0.168 m) out to the chest's clearance, 0.12 + 0.07 = 0.19 m.
 * 4. The average man's punch path from a chamber 8 cm outward, at waist height and
 *    9 cm ahead starts at `[0, 0]`, passes `[0, c]` at its chord share, where
 *    `c` brings the elbow (a forearm behind the fist) to the chest's front,
 *    ends at `[1, 1]`, and turns no share inward before the crossing.
 */
export async function test_motions_sport_martial_art(): Promise<void> {
  // 1. The timetable.
  const clock: IAutoMovieMotionClock = martialArtStanceClock(
    MartialArtStanceForms.FORM.taekwondoStanceReset,
    0.24,
    motionManner.NEUTRAL,
  );
  TestValidator.predicate(
    "the taekwondo marks",
    nclose(clock.at("ready"), 0.64, ROUNDING) &&
      nclose(clock.at("stroke"), 1.12, ROUNDING) &&
      nclose(clock.at("strokeEnd"), 1.84, ROUNDING) &&
      nclose(clock.at("relax"), 2.08, ROUNDING) &&
      nclose(clock.duration, 2.72, ROUNDING),
  );

  // 2. The pelvis turn.
  const taekwondo: MartialArtStanceForms.IForm =
    MartialArtStanceForms.FORM.taekwondoStanceReset;
  TestValidator.equals(
    "the bladed turn",
    [
      martialArtStanceTurn(taekwondo, "left", 1, 0),
      martialArtStanceTurn(taekwondo, "left", 1, 1),
      martialArtStanceTurn(taekwondo, "right", 1, 1),
    ],
    [-2, -18, 18],
  );

  // 3. The guards.
  const measure: Pick<
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
  TestValidator.predicate(
    "the guard sites",
    vclose(
      martialArtGuardSite(
        MartialArtStanceForms.GUARDS.highGuard.lead,
        "left",
        measure,
      ),
      { x: -0.11, y: 0.18, z: 0.252 },
      ROUNDING,
    ) &&
      vclose(
        martialArtGuardSite(
          MartialArtStanceForms.GUARDS.lowGuard.rear,
          "right",
          measure,
        ),
        { x: 0.12, y: -0.12, z: 0.19 },
        ROUNDING,
      ),
  );

  // 4. The punch path.
  const m: IAutoMovieBodyMeasure = (await humanFixture("m-average")).measure;
  const shoulder: IAutoMovieVector3 = { x: -0.19, y: 1.2, z: 0.02 };
  const chamber: IAutoMovieVector3 = {
    x: 0.08,
    y: m.waistHeight - m.shoulderHeight,
    z: 0.09,
  };
  const path = prepareChokuZukiPath(
    {
      measure: m,
      rest: new Map<AutoMovieHumanoidBone, IAutoMovieVector3>([
        ["rightUpperArm", shoulder],
      ]),
    },
    chamber,
  );
  const forward: number = m.upperArm + m.forearm - shoulder.z - chamber.z;
  const up: number =
    AutoMovieMotionHumanTargetGrid.height({ measure: m }, "chest") * m.stature -
    m.waistHeight;
  const c: number =
    (m.chestDepth / 2 + 2 * m.forearmRadius + m.forearm - chamber.z) / forward;
  const along: number = Math.hypot(up, forward);
  const at: number =
    (c * along) /
    (c * along + Math.hypot(chamber.x - shoulder.x, (1 - c) * along));
  const share = (u: number): readonly number[] => path.position(u);
  TestValidator.predicate(
    "the path through its knots",
    c > 0 &&
      c < 1 &&
      nclose(share(0)[0]!, 0, ROUNDING) &&
      nclose(share(at)[0]!, 0, ROUNDING) &&
      nclose(share(at)[1]!, c, ROUNDING) &&
      nclose(share(1)[0]!, 1, ROUNDING) &&
      nclose(share(1)[1]!, 1, ROUNDING) &&
      [0.25, 0.5, 0.75].every(
        (f: number): boolean => share(f * at)[0]! <= ROUNDING,
      ),
  );
}
